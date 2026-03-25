package com.sgg.training.service;

import com.sgg.common.exception.BusinessException;
import com.sgg.common.exception.ResourceNotFoundException;
import com.sgg.common.security.SecurityUtils;
import com.sgg.identity.entity.User;
import com.sgg.identity.repository.UserRepository;
import com.sgg.tenancy.entity.GymMember;
import com.sgg.tenancy.repository.GymMemberRepository;
import com.sgg.training.dto.*;
import com.sgg.training.entity.RoutineAssignment;
import com.sgg.training.entity.RoutineTemplate;
import com.sgg.training.entity.TemplateBlock;
import com.sgg.training.entity.TemplateExercise;
import com.sgg.training.mapper.RoutineTemplateMapper;
import com.sgg.training.repository.RoutineAssignmentRepository;
import com.sgg.training.repository.RoutineTemplateRepository;
import com.sgg.training.repository.TemplateBlockRepository;
import com.sgg.training.repository.TemplateExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RoutineAssignmentServiceImpl implements RoutineAssignmentService {

    private static final Logger log = LoggerFactory.getLogger(RoutineAssignmentServiceImpl.class);

    private final RoutineAssignmentRepository assignmentRepository;
    private final RoutineTemplateRepository templateRepository;
    private final TemplateBlockRepository blockRepository;
    private final TemplateExerciseRepository exerciseRepository;
    private final GymMemberRepository gymMemberRepository;
    private final RoutineTemplateMapper mapper;
    private final SecurityUtils securityUtils;
    private final UserRepository userRepository;

    @Override
    public RoutineAssignmentDto assign(Long gymId, AssignRoutineRequest request) {
        // BUG-04 fix: use DB-level gym check
        RoutineTemplate template = templateRepository.findByIdAndGymIdAndDeletedAtIsNull(request.templateId(), gymId)
            .orElseThrow(() -> new ResourceNotFoundException("Plantilla no encontrada en este gym"));

        // BUG-09 fix: validate member has MEMBER role (not COACH/ADMIN)
        GymMember member = gymMemberRepository.findByGymIdAndUserIdAndStatus(gymId, request.memberUserId(), "ACTIVE")
            .orElseThrow(() -> new BusinessException("El miembro no está activo en este gym"));

        if (!"MEMBER".equals(member.getRole())) {
            throw new BusinessException("Solo se puede asignar rutinas a miembros con rol MEMBER");
        }

        // Validate endsAt > startsAt
        if (request.endsAt() != null && !request.endsAt().isAfter(request.startsAt())) {
            throw new BusinessException("La fecha de fin debe ser posterior a la fecha de inicio");
        }

        // BUG-05 fix: prevent duplicate active assignments
        if (assignmentRepository.hasActiveAssignmentForMember(request.memberUserId(), gymId)) {
            throw new BusinessException("El miembro ya tiene una rutina activa asignada en este gym");
        }

        Long currentUserId = securityUtils.getCurrentUserId();

        RoutineAssignment assignment = new RoutineAssignment();
        assignment.setGymId(gymId);
        assignment.setTemplateId(request.templateId());
        assignment.setMemberUserId(request.memberUserId());
        assignment.setAssignedBy(currentUserId);
        assignment.setStartsAt(request.startsAt());
        assignment.setEndsAt(request.endsAt());
        assignment = assignmentRepository.save(assignment);

        User memberUser = userRepository.findById(request.memberUserId()).orElse(null);
        log.info("Routine assigned: gymId={}, templateId={}, memberUserId={}, assignedBy={}",
            gymId, request.templateId(), request.memberUserId(), currentUserId);

        return new RoutineAssignmentDto(
            assignment.getId(),
            template.getName(),
            memberUser != null ? memberUser.getFullName() : null,
            assignment.getStartsAt(),
            assignment.getEndsAt(),
            assignment.getCreatedAt()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public MemberRoutineDto getActiveRoutine(Long gymId, Long memberUserId) {
        RoutineAssignment assignment = assignmentRepository.findActiveByMemberAndGym(memberUserId, gymId)
            .orElseThrow(() -> new ResourceNotFoundException("No tenés una rutina activa asignada"));

        // BUG-04 fix: use gym-scoped lookup
        RoutineTemplate template = templateRepository.findByIdAndGymIdAndDeletedAtIsNull(assignment.getTemplateId(), gymId)
            .orElseThrow(() -> new ResourceNotFoundException("Plantilla no encontrada"));

        List<TemplateBlock> blocks = blockRepository.findByTemplateIdOrderBySortOrder(template.getId());
        List<Long> blockIds = blocks.stream().map(TemplateBlock::getId).toList();

        Map<Long, List<TemplateExercise>> exercisesByBlock;
        if (!blockIds.isEmpty()) {
            exercisesByBlock = exerciseRepository.findByBlockIdInOrderBySortOrder(blockIds)
                .stream()
                .collect(Collectors.groupingBy(TemplateExercise::getBlockId));
        } else {
            exercisesByBlock = Map.of();
        }

        List<TemplateBlockDto> blockDtos = blocks.stream().map(block -> {
            List<TemplateExerciseDto> exerciseDtos = exercisesByBlock
                .getOrDefault(block.getId(), List.of())
                .stream()
                .map(mapper::toExerciseDto)
                .toList();
            return new TemplateBlockDto(
                block.getId(),
                block.getName(),
                block.getDayNumber(),
                block.getSortOrder(),
                exerciseDtos
            );
        }).toList();

        return new MemberRoutineDto(
            assignment.getId(),
            template.getName(),
            assignment.getStartsAt(),
            assignment.getEndsAt(),
            blockDtos
        );
    }

    // BUG-02/03 fix: batch fetch templates and users to avoid N+1
    @Override
    @Transactional(readOnly = true)
    public List<RoutineAssignmentDto> getHistory(Long gymId, Long memberUserId) {
        List<RoutineAssignment> assignments = assignmentRepository
            .findByMemberUserIdAndGymIdOrderByStartsAtDesc(memberUserId, gymId);

        if (assignments.isEmpty()) return List.of();

        // Batch fetch templates
        List<Long> templateIds = assignments.stream().map(RoutineAssignment::getTemplateId).distinct().toList();
        Map<Long, RoutineTemplate> templatesById = templateRepository.findByIdIn(templateIds)
            .stream()
            .collect(Collectors.toMap(RoutineTemplate::getId, Function.identity()));

        // Single user lookup (history is always for one member)
        User memberUser = userRepository.findById(memberUserId).orElse(null);
        String memberName = memberUser != null ? memberUser.getFullName() : null;

        return assignments.stream().map(a -> {
            RoutineTemplate template = templatesById.get(a.getTemplateId());
            return new RoutineAssignmentDto(
                a.getId(),
                template != null ? template.getName() : "Plantilla eliminada",
                memberName,
                a.getStartsAt(),
                a.getEndsAt(),
                a.getCreatedAt()
            );
        }).toList();
    }
}
