package com.sgg.common.multitenancy;

import com.sgg.common.exception.ResourceNotFoundException;
import com.sgg.common.exception.TenantViolationException;
import com.sgg.common.security.SecurityUtils;
import com.sgg.tenancy.repository.GymMemberRepository;
import com.sgg.tenancy.repository.GymRepository;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class TenantInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(TenantInterceptor.class);
    private static final Pattern GYM_ID_PATTERN = Pattern.compile("/api/gyms/(\\d+)(/.*)?");
    private static final List<String> SKIP_MEMBERSHIP_PATHS = List.of("/join-request", "/info");

    private final GymRepository gymRepository;
    private final GymMemberRepository gymMemberRepository;
    private final SecurityUtils securityUtils;
    private final EntityManager entityManager;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String path = request.getRequestURI();
        Matcher matcher = GYM_ID_PATTERN.matcher(path);

        if (!matcher.matches()) {
            return true;
        }

        Long gymId = Long.parseLong(matcher.group(1));
        String subPath = matcher.group(2);

        gymRepository.findByIdAndDeletedAtIsNull(gymId)
            .orElseThrow(() -> new ResourceNotFoundException("Gym no encontrado"));

        TenantContext.setGymId(gymId);
        enableHibernateFilter(gymId);

        if (shouldSkipMembershipCheck(subPath)) {
            return true;
        }

        if (isSuperAdmin()) {
            return true;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return true; // Spring Security will handle 401
        }

        try {
            Long userId = securityUtils.getCurrentUserId();
            boolean hasAccess = gymMemberRepository.existsByGymIdAndUserIdAndStatusIn(
                gymId, userId, List.of("ACTIVE")
            );
            if (!hasAccess) {
                throw new TenantViolationException("No tenés acceso a este gym");
            }
        } catch (com.sgg.common.exception.ResourceNotFoundException e) {
            // User not found in DB yet — let the request proceed, Spring Security handles auth
            return true;
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        TenantContext.clear();
    }

    private boolean shouldSkipMembershipCheck(String subPath) {
        if (subPath == null) return false;
        return SKIP_MEMBERSHIP_PATHS.stream().anyMatch(subPath::endsWith);
    }

    private boolean isSuperAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_SUPERADMIN"));
    }

    private void enableHibernateFilter(Long gymId) {
        Session session = entityManager.unwrap(Session.class);
        session.enableFilter("tenantFilter").setParameter("gymId", gymId);
    }
}
