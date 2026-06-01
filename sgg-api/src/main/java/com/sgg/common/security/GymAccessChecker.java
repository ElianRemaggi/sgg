package com.sgg.common.security;

import com.sgg.common.multitenancy.TenantContext;
import com.sgg.tenancy.repository.GymMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component("gymAccessChecker")
@RequiredArgsConstructor
public class GymAccessChecker {

    private final GymMemberRepository gymMemberRepository;
    private final SecurityUtils securityUtils;

    public boolean isAdmin(Long gymId) {
        String role = cachedRoleFor(gymId);
        if (role != null) return List.of("ADMIN", "ADMIN_COACH").contains(role);
        Long userId = securityUtils.getCurrentUserId();
        return gymMemberRepository.findByGymIdAndUserIdAndStatus(gymId, userId, "ACTIVE")
            .map(m -> List.of("ADMIN", "ADMIN_COACH").contains(m.getRole()))
            .orElse(false);
    }

    public boolean isCoach(Long gymId) {
        String role = cachedRoleFor(gymId);
        if (role != null) return List.of("COACH", "ADMIN_COACH").contains(role);
        Long userId = securityUtils.getCurrentUserId();
        return gymMemberRepository.findByGymIdAndUserIdAndStatus(gymId, userId, "ACTIVE")
            .map(m -> List.of("COACH", "ADMIN_COACH").contains(m.getRole()))
            .orElse(false);
    }

    public boolean isMember(Long gymId) {
        String role = cachedRoleFor(gymId);
        if (role != null) return "MEMBER".equals(role);
        Long userId = securityUtils.getCurrentUserId();
        return gymMemberRepository.findByGymIdAndUserIdAndStatus(gymId, userId, "ACTIVE")
            .map(m -> "MEMBER".equals(m.getRole()))
            .orElse(false);
    }

    // Returns the cached role only when it belongs to the current request's gym.
    // Returns null for SUPERADMIN paths and platform endpoints (no member in context).
    private String cachedRoleFor(Long gymId) {
        if (gymId.equals(TenantContext.getGymId())) {
            return TenantContext.getCurrentMemberRole();
        }
        return null;
    }
}
