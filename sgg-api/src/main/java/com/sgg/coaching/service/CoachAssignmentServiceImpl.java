package com.sgg.coaching.service;

import com.sgg.coaching.dto.AssignCoachRequest;
import com.sgg.coaching.dto.AssignedMemberDto;
import com.sgg.coaching.dto.CoachAssignmentDto;
import com.sgg.coaching.dto.CoachSummaryDto;
import com.sgg.coaching.entity.CoachAssignment;
import com.sgg.coaching.repository.CoachAssignmentRepository;
import com.sgg.common.exception.BusinessException;
import com.sgg.common.exception.ResourceNotFoundException;
import com.sgg.common.exception.ValidationException;
import com.sgg.common.security.SecurityUtils;
import com.sgg.identity.entity.User;
import com.sgg.identity.repository.UserRepository;
import com.sgg.tenancy.entity.GymMember;
import com.sgg.tenancy.repository.GymMemberRepository;
import com.sgg.training.repository.RoutineAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CoachAssignmentServiceImpl implements CoachAssignmentService {

    private static final Logger log = LoggerFactory.getLogger(CoachAssignmentServiceImpl.class);

    private final CoachAssignmentRepository assignmentRepository;
    private final GymMemberRepository gymMemberRepository;
    private final UserRepository userRepository;
    private final RoutineAssignmentRepository routineAssignmentRepository;
    private final SecurityUtils securityUtils;

    @Override
    @Transactional(readOnly = true)
    public List<CoachSummaryDto> listCoaches(Long gymId) {
        return assignmentRepository.findCoachesWithAssignmentCount(gymId);
    }

    @Override
    public CoachAssignmentDto assignCoach(Long gymId, AssignCoachRequest request) {
        GymMember coachMember = gymMemberRepository
            .findByGymIdAndUserIdAndStatus(gymId, request.coachUserId(), "ACTIVE")
            .orElseThrow(() -> new ValidationException("coachUserId no pertenece a este gym como miembro activo"));

        if (!List.of("COACH", "ADMIN_COACH").contains(coachMember.getRole())) {
            throw new ValidationException("El usuario no tiene rol de coach en este gym");
        }

        GymMember memberMem = gymMemberRepository
            .findByGymIdAndUserIdAndStatus(gymId, request.memberUserId(), "ACTIVE")
            .orElseThrow(() -> new ValidationException("memberUserId no pertenece a este gym como miembro activo"));

        if (!"MEMBER".equals(memberMem.getRole())) {
            throw new ValidationException("El usuario destino no tiene rol MEMBER en este gym");
        }

        if (assignmentRepository.existsByGymIdAndMemberUserIdAndUnassignedAtIsNull(gymId, request.memberUserId())) {
            throw new BusinessException("El miembro ya tiene un coach asignado en este gym");
        }

        CoachAssignment assignment = new CoachAssignment();
        assignment.setGymId(gymId);
        assignment.setCoachUserId(request.coachUserId());
        assignment.setMemberUserId(request.memberUserId());
        assignment = assignmentRepository.save(assignment);

        log.info("Coach assigned: gymId={}, coachUserId={}, memberUserId={}",
            gymId, request.coachUserId(), request.memberUserId());

        return new CoachAssignmentDto(
            assignment.getId(),
            assignment.getGymId(),
            assignment.getCoachUserId(),
            assignment.getMemberUserId(),
            assignment.getAssignedAt()
        );
    }

    @Override
    public void unassignCoach(Long gymId, Long assignmentId) {
        CoachAssignment assignment = assignmentRepository.findByIdAndGymId(assignmentId, gymId)
            .orElseThrow(() -> new ResourceNotFoundException("Asignación no encontrada"));

        if (assignment.getUnassignedAt() != null) {
            throw new BusinessException("Esta asignación ya fue desactivada");
        }

        assignment.setUnassignedAt(LocalDateTime.now());
        assignmentRepository.save(assignment);
        log.info("Coach unassigned: gymId={}, assignmentId={}", gymId, assignmentId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssignedMemberDto> getMyMembers(Long gymId) {
        Long coachUserId = securityUtils.getCurrentUserId();
        List<CoachAssignment> assignments = assignmentRepository
            .findByGymIdAndCoachUserIdAndUnassignedAtIsNull(gymId, coachUserId);

        if (assignments.isEmpty()) return List.of();

        List<Long> memberIds = assignments.stream().map(CoachAssignment::getMemberUserId).toList();
        Map<Long, User> usersById = userRepository.findAllById(memberIds)
            .stream()
            .collect(Collectors.toMap(User::getId, Function.identity()));

        return assignments.stream().map(a -> {
            User member = usersById.get(a.getMemberUserId());
            boolean hasRoutine = routineAssignmentRepository
                .hasActiveAssignmentForMember(a.getMemberUserId(), gymId);
            return new AssignedMemberDto(
                a.getMemberUserId(),
                member != null ? member.getFullName() : null,
                member != null ? member.getAvatarUrl() : null,
                a.getId(),
                a.getAssignedAt(),
                hasRoutine
            );
        }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasActiveAssignmentsAsCoach(Long gymId, Long userId) {
        return assignmentRepository.existsByGymIdAndCoachUserIdAndUnassignedAtIsNull(gymId, userId);
    }
}
