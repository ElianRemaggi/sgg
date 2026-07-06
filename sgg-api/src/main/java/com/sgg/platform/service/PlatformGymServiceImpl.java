package com.sgg.platform.service;

import com.sgg.common.exception.BusinessException;
import com.sgg.common.exception.ResourceNotFoundException;
import com.sgg.identity.entity.User;
import com.sgg.identity.repository.UserRepository;
import com.sgg.platform.dto.*;
import com.sgg.tenancy.entity.Gym;
import com.sgg.tenancy.entity.GymMember;
import com.sgg.tenancy.entity.GymMemberRole;
import com.sgg.tenancy.entity.GymMemberStatus;
import com.sgg.tenancy.entity.GymStatus;
import com.sgg.tenancy.repository.GymMemberRepository;
import com.sgg.tenancy.repository.GymRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class PlatformGymServiceImpl implements PlatformGymService {

    private static final Logger log = LoggerFactory.getLogger(PlatformGymServiceImpl.class);

    private final GymRepository gymRepository;
    private final GymMemberRepository gymMemberRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<GymSummaryDto> listGyms(String status, String search, Pageable pageable) {
        GymStatus statusFilter = parseStatusOrNull(status);
        String searchFilter = (search != null && !search.isBlank()) ? search : null;

        return gymRepository.findAllWithFilters(statusFilter, searchFilter, pageable)
            .map(this::toSummaryDto);
    }

    private static GymStatus parseStatusOrNull(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            return GymStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public GymDetailDto getGymDetail(Long gymId) {
        Gym gym = gymRepository.findById(gymId)
            .orElseThrow(() -> new ResourceNotFoundException("Gym no encontrado"));

        return toDetailDto(gym);
    }

    @Override
    public GymDetailDto createGym(CreateGymRequest request) {
        if (gymRepository.existsBySlug(request.slug())) {
            throw new BusinessException("Ya existe un gym con el slug '" + request.slug() + "'");
        }

        User owner = userRepository.findById(request.ownerUserId())
            .orElseThrow(() -> new ResourceNotFoundException("Usuario owner no encontrado"));

        Gym gym = new Gym();
        gym.setName(request.name());
        gym.setSlug(request.slug());
        gym.setDescription(request.description());
        gym.setLogoUrl(request.logoUrl());
        gym.setRoutineCycle(request.routineCycle());
        gym.setOwnerUserId(owner.getId());
        gym.setStatus(GymStatus.ACTIVE);
        gym = gymRepository.save(gym);

        GymMember ownerMember = new GymMember();
        ownerMember.setGymId(gym.getId());
        ownerMember.setUserId(owner.getId());
        ownerMember.setRole(GymMemberRole.ADMIN);
        ownerMember.setStatus(GymMemberStatus.ACTIVE);
        gymMemberRepository.save(ownerMember);

        log.info("Gym creado: {} (id={}) con owner: {} (id={})", gym.getName(), gym.getId(), owner.getFullName(), owner.getId());

        return toDetailDto(gym);
    }

    @Override
    public GymDetailDto updateGym(Long gymId, UpdateGymRequest request) {
        Gym gym = gymRepository.findById(gymId)
            .orElseThrow(() -> new ResourceNotFoundException("Gym no encontrado"));

        if (gymRepository.existsBySlugAndIdNot(request.slug(), gymId)) {
            throw new BusinessException("Ya existe un gym con el slug '" + request.slug() + "'");
        }

        gym.setName(request.name());
        gym.setSlug(request.slug());
        gym.setDescription(request.description());
        gym.setLogoUrl(request.logoUrl());
        gym.setRoutineCycle(request.routineCycle());
        gym = gymRepository.save(gym);

        log.info("Gym actualizado: {} (id={})", gym.getName(), gym.getId());

        return toDetailDto(gym);
    }

    @Override
    public void changeGymStatus(Long gymId, ChangeGymStatusRequest request) {
        Gym gym = gymRepository.findById(gymId)
            .orElseThrow(() -> new ResourceNotFoundException("Gym no encontrado"));

        GymStatus newStatus = GymStatus.valueOf(request.status());
        if (gym.getStatus() == newStatus) {
            throw new BusinessException("El gym ya tiene el status '" + request.status() + "'");
        }

        if (gym.getStatus() == GymStatus.DELETED) {
            throw new BusinessException("No se puede cambiar el status de un gym eliminado");
        }

        gym.setStatus(newStatus);
        gymRepository.save(gym);

        log.info("Gym {} (id={}) cambió status a {}", gym.getName(), gym.getId(), newStatus);
    }

    @Override
    public void deleteGym(Long gymId, boolean force) {
        Gym gym = gymRepository.findById(gymId)
            .orElseThrow(() -> new ResourceNotFoundException("Gym no encontrado"));

        if (gym.getStatus() == GymStatus.DELETED) {
            throw new BusinessException("El gym ya fue eliminado");
        }

        long activeMembers = gymMemberRepository.countByGymIdAndStatus(gymId, GymMemberStatus.ACTIVE);
        if (activeMembers > 0 && !force) {
            throw new BusinessException("El gym tiene " + activeMembers + " miembros activos. Usá ?force=true para eliminar igualmente.");
        }

        gym.setStatus(GymStatus.DELETED);
        gym.setDeletedAt(LocalDateTime.now());
        gymRepository.save(gym);

        log.info("Gym eliminado (soft): {} (id={})", gym.getName(), gym.getId());
    }

    private GymSummaryDto toSummaryDto(Gym gym) {
        long membersCount = gymMemberRepository.countByGymIdAndStatus(gym.getId(), GymMemberStatus.ACTIVE);
        User owner = userRepository.findById(gym.getOwnerUserId()).orElse(null);

        return new GymSummaryDto(
            gym.getId(),
            gym.getName(),
            gym.getSlug(),
            gym.getStatus(),
            (int) membersCount,
            owner != null ? owner.getFullName() : null,
            owner != null ? owner.getEmail() : null,
            gym.getCreatedAt()
        );
    }

    private GymDetailDto toDetailDto(Gym gym) {
        User owner = userRepository.findById(gym.getOwnerUserId()).orElse(null);
        UserSummaryDto ownerDto = owner != null
            ? new UserSummaryDto(owner.getId(), owner.getFullName(), owner.getEmail())
            : null;

        int activeMembers = (int) gymMemberRepository.countByGymIdAndStatus(gym.getId(), GymMemberStatus.ACTIVE);
        int coaches = (int) gymMemberRepository.countByGymIdAndRoleAndStatus(gym.getId(), GymMemberRole.COACH, GymMemberStatus.ACTIVE);
        // Templates count placeholder — will be real when training module exists
        GymStatsDto stats = new GymStatsDto(activeMembers, coaches, 0);

        return new GymDetailDto(
            gym.getId(),
            gym.getName(),
            gym.getSlug(),
            gym.getDescription(),
            gym.getLogoUrl(),
            gym.getRoutineCycle(),
            gym.getStatus(),
            ownerDto,
            stats,
            gym.getCreatedAt()
        );
    }
}
