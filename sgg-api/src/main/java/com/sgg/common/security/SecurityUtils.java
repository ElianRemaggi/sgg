package com.sgg.common.security;

import com.sgg.common.exception.ResourceNotFoundException;
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

    private final CurrentUserResolver currentUserResolver;
    private Long cachedUserId;

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

    public Long getCurrentUserId() {
        if (cachedUserId != null) {
            return cachedUserId;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt jwt)) {
            throw new ResourceNotFoundException("Usuario no autenticado");
        }

        String subject = jwt.getSubject();
        boolean nativeToken = CustomJwtAuthenticationConverter.isNativeToken(jwt);
        ResolvedUser resolved = currentUserResolver.resolve(subject, nativeToken)
            .orElseThrow(() -> new ResourceNotFoundException(
                nativeToken
                    ? "Usuario no encontrado para id: " + subject
                    : "Usuario no encontrado para uid: " + subject));

        cachedUserId = resolved.id();
        return cachedUserId;
    }
}
