package com.sgg.tenancy.security;

import com.sgg.common.multitenancy.TenantContext;
import com.sgg.common.security.SecurityUtils;
import com.sgg.tenancy.entity.GymMemberRole;
import com.sgg.tenancy.entity.GymMemberStatus;
import com.sgg.tenancy.entity.GymType;
import com.sgg.tenancy.repository.GymMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component("gymAccessChecker")
@RequiredArgsConstructor
public class GymAccessChecker {

    private final GymMemberRepository gymMemberRepository;
    private final SecurityUtils securityUtils;

    public boolean isAdmin(Long gymId) {
        String role = cachedRoleFor(gymId);
        if (role != null) return isAdminRole(role);
        Long userId = securityUtils.getCurrentUserId();
        return gymMemberRepository.findByGymIdAndUserIdAndStatus(gymId, userId, GymMemberStatus.ACTIVE)
            .map(m -> isAdminRole(m.getRole()))
            .orElse(false);
    }

    public boolean isCoach(Long gymId) {
        // O(1): owner de gym personal puede crear/editar plantillas y auto-asignarse.
        // Este check debe ir antes de cachedRoleFor porque el owner está inscrito como MEMBER.
        if (gymId.equals(TenantContext.getGymId())
                && GymType.PERSONAL.name().equals(TenantContext.getGymType())) {
            Long userId = securityUtils.getCurrentUserId();
            return userId != null && userId.equals(TenantContext.getGymOwnerUserId());
        }
        String role = cachedRoleFor(gymId);
        if (role != null) return isCoachRole(role);
        Long userId = securityUtils.getCurrentUserId();
        return gymMemberRepository.findByGymIdAndUserIdAndStatus(gymId, userId, GymMemberStatus.ACTIVE)
            .map(m -> isCoachRole(m.getRole()))
            .orElse(false);
    }

    public boolean isMember(Long gymId) {
        String role = cachedRoleFor(gymId);
        if (role != null) return GymMemberRole.MEMBER.name().equals(role);
        Long userId = securityUtils.getCurrentUserId();
        return gymMemberRepository.findByGymIdAndUserIdAndStatus(gymId, userId, GymMemberStatus.ACTIVE)
            .map(m -> m.getRole() == GymMemberRole.MEMBER)
            .orElse(false);
    }

    private boolean isAdminRole(String role) {
        return GymMemberRole.ADMIN.name().equals(role) || GymMemberRole.ADMIN_COACH.name().equals(role);
    }

    private boolean isAdminRole(GymMemberRole role) {
        return role == GymMemberRole.ADMIN || role == GymMemberRole.ADMIN_COACH;
    }

    private boolean isCoachRole(String role) {
        return GymMemberRole.COACH.name().equals(role) || GymMemberRole.ADMIN_COACH.name().equals(role);
    }

    private boolean isCoachRole(GymMemberRole role) {
        return role == GymMemberRole.COACH || role == GymMemberRole.ADMIN_COACH;
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
