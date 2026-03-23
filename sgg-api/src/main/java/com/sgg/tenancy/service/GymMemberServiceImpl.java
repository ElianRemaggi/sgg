package com.sgg.tenancy.service;

import com.sgg.common.exception.AccessDeniedException;
import com.sgg.common.exception.BusinessException;
import com.sgg.common.exception.ResourceNotFoundException;
import com.sgg.tenancy.dto.*;
import com.sgg.tenancy.entity.Gym;
import com.sgg.tenancy.entity.GymMember;
import com.sgg.tenancy.repository.GymMemberRepository;
import com.sgg.tenancy.repository.GymRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    @Override
    public JoinRequestResponse requestJoin(Long gymId, Long userId) {
        Gym gym = gymRepository.findByIdAndDeletedAtIsNull(gymId)
            .orElseThrow(() -> new ResourceNotFoundException("Gym no encontrado"));

        if (!"ACTIVE".equals(gym.getStatus())) {
            throw new ResourceNotFoundException("Gym no encontrado");
        }

        boolean alreadyExists = gymMemberRepository.existsByGymIdAndUserIdAndStatusIn(
            gymId, userId, List.of("PENDING", "ACTIVE")
        );
        if (alreadyExists) {
            throw new BusinessException("Ya tenés una membresía pendiente o activa en este gym");
        }

        GymMember member = new GymMember();
        member.setGymId(gymId);
        member.setUserId(userId);
        member.setRole("MEMBER");
        member.setStatus("PENDING");
        gymMemberRepository.save(member);

        log.info("Join request created: userId={}, gymId={}, memberId={}", userId, gymId, member.getId());

        return new JoinRequestResponse(member.getId(), "PENDING", gym.getName());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<GymMemberDto> listMembers(Long gymId, String status, String role, Pageable pageable) {
        String statusFilter = "ALL".equals(status) ? null : status;
        String roleFilter = "ALL".equals(role) ? null : role;
        return gymMemberRepository.findMembersByGymWithFilters(gymId, statusFilter, roleFilter, pageable);
    }

    @Override
    public void approveMember(Long gymId, Long memberId) {
        GymMember member = findMemberInGym(gymId, memberId);
        member.setStatus("ACTIVE");
        gymMemberRepository.save(member);
        log.info("Member approved: memberId={}, gymId={}", memberId, gymId);
    }

    @Override
    public void rejectMember(Long gymId, Long memberId) {
        GymMember member = findMemberInGym(gymId, memberId);
        if (!"PENDING".equals(member.getStatus())) {
            throw new BusinessException("Solo se pueden rechazar membresías pendientes");
        }
        member.setStatus("REJECTED");
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

        member.setStatus("BLOCKED");
        gymMemberRepository.save(member);
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

        if ("COACH".equals(member.getRole()) && "MEMBER".equals(request.role())) {
            if (hasActiveCoachAssignments(memberId)) {
                throw new BusinessException("El coach tiene asignaciones activas. Reasigná los alumnos antes de degradar.");
            }
        }

        member.setRole(request.role());
        gymMemberRepository.save(member);
        log.info("Role changed: memberId={}, gymId={}, newRole={}", memberId, gymId, request.role());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MembershipDto> getUserMemberships(Long userId) {
        List<GymMember> memberships = gymMemberRepository.findByUserId(userId);
        return memberships.stream()
            .filter(m -> "ACTIVE".equals(m.getStatus()) || "PENDING".equals(m.getStatus()))
            .map(m -> {
                Gym gym = gymRepository.findByIdAndDeletedAtIsNull(m.getGymId()).orElse(null);
                if (gym == null) return null;
                return new MembershipDto(
                    m.getId(), gym.getId(), gym.getName(), gym.getSlug(), gym.getLogoUrl(),
                    m.getRole(), m.getStatus(), m.getMembershipExpiresAt()
                );
            })
            .filter(java.util.Objects::nonNull)
            .toList();
    }

    private GymMember findMemberInGym(Long gymId, Long memberId) {
        GymMember member = gymMemberRepository.findById(memberId)
            .orElseThrow(() -> new ResourceNotFoundException("Miembro no encontrado"));
        if (!member.getGymId().equals(gymId)) {
            throw new ResourceNotFoundException("Miembro no encontrado en este gym");
        }
        return member;
    }

    private boolean hasActiveCoachAssignments(Long memberId) {
        // Placeholder: se implementa en Fase 6 (coaching module)
        return false;
    }
}
