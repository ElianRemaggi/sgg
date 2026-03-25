package com.sgg.common.security;

import com.sgg.common.exception.ResourceNotFoundException;
import com.sgg.identity.entity.User;
import com.sgg.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

@Component
@RequestScope
@RequiredArgsConstructor
public class SecurityUtils {

    private final UserRepository userRepository;
    private User cachedUser;

    public String getSubject() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            return jwt.getSubject();
        }
        return null;
    }

    public String getSupabaseUid() {
        return getSubject();
    }

    public User getCurrentUser() {
        if (cachedUser != null) {
            return cachedUser;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt jwt)) {
            throw new ResourceNotFoundException("Usuario no autenticado");
        }

        String subject = jwt.getSubject();
        if (CustomJwtAuthenticationConverter.isNativeToken(jwt)) {
            cachedUser = userRepository.findById(Long.valueOf(subject))
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado para id: " + subject));
        } else {
            cachedUser = userRepository.findBySupabaseUid(subject)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado para uid: " + subject));
        }

        return cachedUser;
    }

    public Long getCurrentUserId() {
        return getCurrentUser().getId();
    }
}
