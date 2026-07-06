package com.sgg.tenancy.security;

import com.sgg.common.multitenancy.GymTenantInfo;
import com.sgg.common.multitenancy.GymTenantResolver;
import com.sgg.tenancy.entity.GymMemberStatus;
import com.sgg.tenancy.repository.GymMemberRepository;
import com.sgg.tenancy.repository.GymRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class GymTenantResolverImpl implements GymTenantResolver {

    private final GymRepository gymRepository;
    private final GymMemberRepository gymMemberRepository;

    @Override
    public Optional<GymTenantInfo> findGym(Long gymId) {
        return gymRepository.findByIdAndDeletedAtIsNull(gymId)
            .map(gym -> new GymTenantInfo(gym.getId(), gym.getOwnerUserId(), gym.getType().name()));
    }

    @Override
    public Optional<String> findActiveMemberRole(Long gymId, Long userId) {
        return gymMemberRepository.findByGymIdAndUserIdAndStatus(gymId, userId, GymMemberStatus.ACTIVE)
            .map(member -> member.getRole().name());
    }
}
