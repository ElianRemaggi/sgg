package com.sgg.tenancy.service;

import com.sgg.tenancy.dto.PersonalGymResponse;
import com.sgg.tenancy.entity.Gym;
import com.sgg.tenancy.entity.GymMember;
import com.sgg.tenancy.entity.GymMemberRole;
import com.sgg.tenancy.entity.GymMemberStatus;
import com.sgg.tenancy.entity.GymStatus;
import com.sgg.tenancy.entity.GymType;
import com.sgg.tenancy.repository.GymMemberRepository;
import com.sgg.tenancy.repository.GymRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class PersonalGymServiceImpl implements PersonalGymService {

    private static final Logger log = LoggerFactory.getLogger(PersonalGymServiceImpl.class);

    private final GymRepository gymRepository;
    private final GymMemberRepository gymMemberRepository;

    @Override
    public PersonalGymResponse ensurePersonalGym(Long userId) {
        return gymRepository.findByOwnerUserIdAndType(userId, GymType.PERSONAL)
            .map(existing -> {
                log.debug("Personal gym ya existe para userId={}: gymId={}", userId, existing.getId());
                return new PersonalGymResponse(existing.getId());
            })
            .orElseGet(() -> {
                Gym gym = new Gym();
                gym.setName("Entrenamiento personal");
                gym.setSlug("personal-" + userId);
                gym.setType(GymType.PERSONAL);
                gym.setOwnerUserId(userId);
                gym.setStatus(GymStatus.ACTIVE);
                gym = gymRepository.save(gym);

                GymMember member = new GymMember();
                member.setGymId(gym.getId());
                member.setUserId(userId);
                member.setRole(GymMemberRole.MEMBER);
                member.setStatus(GymMemberStatus.ACTIVE);
                gymMemberRepository.save(member);

                log.info("Gym personal creado: userId={}, gymId={}", userId, gym.getId());
                return new PersonalGymResponse(gym.getId());
            });
    }
}
