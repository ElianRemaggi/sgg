package com.sgg.tenancy.service;

import com.sgg.common.exception.AccessDeniedException;
import com.sgg.common.exception.BusinessException;
import com.sgg.common.exception.ResourceNotFoundException;
import com.sgg.tenancy.dto.*;
import com.sgg.tenancy.entity.Gym;
import com.sgg.tenancy.entity.GymMember;
import com.sgg.tenancy.entity.GymMemberRole;
import com.sgg.tenancy.entity.GymMemberStatus;
import com.sgg.tenancy.entity.GymStatus;
import com.sgg.tenancy.event.CoachDeactivatedEvent;
import com.sgg.tenancy.repository.GymMemberRepository;
import com.sgg.tenancy.repository.GymRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class GymMemberServiceImpl implements GymMemberService {

    private static final Logger log = LoggerFactory.getLogger(GymMemberServiceImpl.class);

    private final GymMemberRepository gymMemberRepository;
    private final GymRepository gymRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public JoinRequestResponse requestJoin(Long gymId, Long userId) {
        Gym gym = gymRepository.findByIdAndDeletedAtIsNull(gymId)
            .orElseThrow(() -> new ResourceNotFoundException("Gym no encontrado"));

        if (gym.getStatus() != GymStatus.ACTIVE) {
            throw new ResourceNotFoundException("Gym no encontrado");
        }

        boolean alreadyExists = gymMemberRepository.existsByGymIdAndUserIdAndStatusIn(
            gymId, userId, List.of(GymMemberStatus.PENDING, GymMemberStatus.ACTIVE)
        );
        if (alreadyExists) {
            throw new BusinessException("Ya tenés una membresía pendiente o activa en este gym");
        }

        GymMemberStatus status = Boolean.TRUE.equals(gym.getAutoAcceptMembers())
            ? GymMemberStatus.ACTIVE : GymMemberStatus.PENDING;

        GymMember member = new GymMember();
        member.setGymId(gymId);
        member.setUserId(userId);
        member.setRole(GymMemberRole.MEMBER);
        member.setStatus(status);
        gymMemberRepository.save(member);

        log.info("Join request created: userId={}, gymId={}, memberId={}, status={}", userId, gymId, member.getId(), status);

        return new JoinRequestResponse(member.getId(), status, gym.getName());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<GymMemberDto> listMembers(Long gymId, String status, String role, Pageable pageable) {
        GymMemberStatus statusFilter = parseEnumOrNull(status, GymMemberStatus.class);
        GymMemberRole roleFilter = parseEnumOrNull(role, GymMemberRole.class);
        return gymMemberRepository.findMembersByGymWithFilters(gymId, statusFilter, roleFilter, pageable);
    }

    private static <E extends Enum<E>> E parseEnumOrNull(String value, Class<E> enumType) {
        if (value == null || "ALL".equals(value)) return null;
        try {
            return Enum.valueOf(enumType, value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @Override
    public void approveMember(Long gymId, Long memberId) {
        GymMember member = findMemberInGym(gymId, memberId);
        member.setStatus(GymMemberStatus.ACTIVE);
        gymMemberRepository.save(member);
        log.info("Member approved: memberId={}, gymId={}", memberId, gymId);
    }

    @Override
    public void rejectMember(Long gymId, Long memberId) {
        GymMember member = findMemberInGym(gymId, memberId);
        if (member.getStatus() != GymMemberStatus.PENDING) {
            throw new BusinessException("Solo se pueden rechazar membresías pendientes");
        }
        member.setStatus(GymMemberStatus.REJECTED);
        gymMemberRepository.save(member);
        log.info("Member rejected: memberId={}, gymId={}", memberId, gymId);
    }

    @Override
    public void blockMember(Long gymId, Long memberId) {
        GymMember member = findMemberInGym(gymId, memberId);
        Gym gym = gymRepository.findByIdAndDeletedAtIsNull(gymId)
            .orElseThrow(() -> new ResourceNotFoundException("Gym no encontrado"));

        if (gym.getOwnerUserId().equals(member.getUserId())) {
            throw new AccessDeniedException("No se puede bloquear al owner del gym");
        }

        member.setStatus(GymMemberStatus.BLOCKED);
        gymMemberRepository.save(member);
        if (isCoachRole(member.getRole())) {
            eventPublisher.publishEvent(new CoachDeactivatedEvent(gymId, member.getUserId()));
        }
        log.info("Member blocked: memberId={}, gymId={}", memberId, gymId);
    }

    @Override
    public void setExpiry(Long gymId, Long memberId, SetExpiryRequest request) {
        GymMember member = findMemberInGym(gymId, memberId);
        member.setMembershipExpiresAt(request.expiresAt());
        gymMemberRepository.save(member);
        log.info("Expiry set: memberId={}, gymId={}, expiresAt={}", memberId, gymId, request.expiresAt());
    }

    @Override
    public void changeRole(Long gymId, Long memberId, Long requestingUserId, UpdateMemberRoleRequest request) {
        GymMember member = findMemberInGym(gymId, memberId);
        Gym gym = gymRepository.findByIdAndDeletedAtIsNull(gymId)
            .orElseThrow(() -> new ResourceNotFoundException("Gym no encontrado"));

        if (gym.getOwnerUserId().equals(member.getUserId())) {
            throw new AccessDeniedException("No se puede cambiar el rol del owner del gym");
        }

        if (member.getUserId().equals(requestingUserId)) {
            throw new AccessDeniedException("No podés cambiar tu propio rol");
        }

        GymMemberRole newRole = GymMemberRole.valueOf(request.role());
        if (isCoachRole(member.getRole()) && !isCoachRole(newRole)) {
            eventPublisher.publishEvent(new CoachDeactivatedEvent(gymId, member.getUserId()));
        }

        member.setRole(newRole);
        gymMemberRepository.save(member);
        log.info("Role changed: memberId={}, gymId={}, newRole={}", memberId, gymId, newRole);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MembershipDto> getUserMemberships(Long userId) {
        List<GymMember> memberships = gymMemberRepository.findByUserId(userId);
        return memberships.stream()
            .filter(m -> m.getStatus() == GymMemberStatus.ACTIVE || m.getStatus() == GymMemberStatus.PENDING)
            .map(m -> {
                Gym gym = gymRepository.findByIdAndDeletedAtIsNull(m.getGymId()).orElse(null);
                if (gym == null) return null;
                return new MembershipDto(
                    m.getId(), gym.getId(), gym.getName(), gym.getSlug(), gym.getLogoUrl(),
                    gym.getType(), m.getRole(), m.getStatus(), m.getMembershipExpiresAt()
                );
            })
            .filter(java.util.Objects::nonNull)
            .toList();
    }

    private static boolean isCoachRole(GymMemberRole role) {
        return role == GymMemberRole.COACH || role == GymMemberRole.ADMIN_COACH;
    }

    private GymMember findMemberInGym(Long gymId, Long memberId) {
        GymMember member = gymMemberRepository.findById(memberId)
            .orElseThrow(() -> new ResourceNotFoundException("Miembro no encontrado"));
        if (!member.getGymId().equals(gymId)) {
            throw new ResourceNotFoundException("Miembro no encontrado en este gym");
        }
        return member;
    }

}
