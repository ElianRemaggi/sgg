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

    public String getSupabaseUid() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            return jwt.getSubject();
        }
        return null;
    }

    public User getCurrentUser() {
        if (cachedUser != null) {
            return cachedUser;
        }
        String uid = getSupabaseUid();
        if (uid == null) {
            throw new ResourceNotFoundException("Usuario no autenticado");
        }
        cachedUser = userRepository.findBySupabaseUid(uid)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado para uid: " + uid));
        return cachedUser;
    }

    public Long getCurrentUserId() {
        return getCurrentUser().getId();
    }
}
