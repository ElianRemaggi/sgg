package com.sgg.common.security;

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
        Long userId = securityUtils.getCurrentUserId();
        return gymMemberRepository.findByGymIdAndUserIdAndStatus(gymId, userId, "ACTIVE")
            .map(member -> List.of("ADMIN", "ADMIN_COACH").contains(member.getRole()))
            .orElse(false);
    }

    public boolean isCoach(Long gymId) {
        Long userId = securityUtils.getCurrentUserId();
        return gymMemberRepository.findByGymIdAndUserIdAndStatus(gymId, userId, "ACTIVE")
            .map(member -> List.of("COACH", "ADMIN_COACH").contains(member.getRole()))
            .orElse(false);
    }

    public boolean isMember(Long gymId) {
        Long userId = securityUtils.getCurrentUserId();
        return gymMemberRepository.findByGymIdAndUserIdAndStatus(gymId, userId, "ACTIVE")
            .map(member -> "MEMBER".equals(member.getRole()))
            .orElse(false);
    }
}
