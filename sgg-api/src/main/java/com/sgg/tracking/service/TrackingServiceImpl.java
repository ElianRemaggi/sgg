package com.sgg.tracking.service;

import com.sgg.common.exception.BusinessException;
import com.sgg.common.exception.ResourceNotFoundException;
import com.sgg.common.security.SecurityUtils;
import com.sgg.tracking.dto.*;
import com.sgg.tracking.entity.ExerciseCompletion;
import com.sgg.tracking.mapper.ExerciseCompletionMapper;
import com.sgg.tracking.repository.ExerciseCompletionRepository;
import com.sgg.training.entity.RoutineAssignment;
import com.sgg.training.entity.TemplateBlock;
import com.sgg.training.entity.TemplateExercise;
import com.sgg.training.repository.RoutineAssignmentRepository;
import com.sgg.training.repository.TemplateBlockRepository;
import com.sgg.training.repository.TemplateExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TrackingServiceImpl implements TrackingService {

    private static final Logger log = LoggerFactory.getLogger(TrackingServiceImpl.class);

    private final ExerciseCompletionRepository completionRepository;
    private final RoutineAssignmentRepository assignmentRepository;
    private final TemplateBlockRepository blockRepository;
    private final TemplateExerciseRepository exerciseRepository;
    private final ExerciseCompletionMapper mapper;
    private final SecurityUtils securityUtils;

    @Override
    public ExerciseCompletionDto completeExercise(Long gymId, CompleteExerciseRequest request) {
        Long userId = securityUtils.getCurrentUserId();

        RoutineAssignment assignment = assignmentRepository
                .findActiveByMemberAndGym(userId, gymId)
                .orElseThrow(() -> new ResourceNotFoundException("No tenés una rutina activa asignada"));

        if (!assignment.getId().equals(request.assignmentId())) {
            throw new BusinessException("El assignment no corresponde a tu rutina activa");
        }

        validateExerciseBelongsToAssignment(request.exerciseId(), assignment.getTemplateId());

        // Upsert: find existing or create new
        ExerciseCompletion completion = completionRepository
                .findByAssignmentIdAndExerciseIdAndUserId(request.assignmentId(), request.exerciseId(), userId)
                .orElseGet(() -> {
                    ExerciseCompletion ec = new ExerciseCompletion();
                    ec.setGymId(gymId);
                    ec.setAssignmentId(request.assignmentId());
                    ec.setExerciseId(request.exerciseId());
                    ec.setUserId(userId);
                    return ec;
                });

        completion.setIsCompleted(true);
        completion.setWeightKg(request.weightKg());
        completion.setActualReps(request.actualReps());
        completion.setNotes(request.notes());
        completion.setCompletedAt(LocalDateTime.now());

        completion = completionRepository.save(completion);

        log.info("Exercise completed: gymId={}, assignmentId={}, exerciseId={}, userId={}",
                gymId, request.assignmentId(), request.exerciseId(), userId);

        return mapper.toDto(completion);
    }

    @Override
    public void undoExercise(Long gymId, UndoExerciseRequest request) {
        Long userId = securityUtils.getCurrentUserId();

        completionRepository
                .findByAssignmentIdAndExerciseIdAndUserId(request.assignmentId(), request.exerciseId(), userId)
                .ifPresent(completion -> {
                    completion.setIsCompleted(false);
                    completionRepository.save(completion);
                    log.info("Exercise undone: gymId={}, assignmentId={}, exerciseId={}, userId={}",
                            gymId, request.assignmentId(), request.exerciseId(), userId);
                });
        // Idempotent: if not found, do nothing
    }

    @Override
    @Transactional(readOnly = true)
    public TrackingProgressDto getProgress(Long gymId) {
        Long userId = securityUtils.getCurrentUserId();
        return buildProgress(gymId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public TrackingProgressDto getMemberProgress(Long gymId, Long memberId) {
        return buildProgress(gymId, memberId);
    }

    private TrackingProgressDto buildProgress(Long gymId, Long userId) {
        RoutineAssignment assignment = assignmentRepository
                .findActiveByMemberAndGym(userId, gymId)
                .orElseThrow(() -> new ResourceNotFoundException("No hay rutina activa asignada"));

        // Count total exercises in the template
        List<TemplateBlock> blocks = blockRepository
                .findByTemplateIdOrderBySortOrder(assignment.getTemplateId());
        List<Long> blockIds = blocks.stream().map(TemplateBlock::getId).toList();

        long totalExercises = 0;
        Set<Long> validExerciseIds = Set.of();
        if (!blockIds.isEmpty()) {
            List<TemplateExercise> exercises = exerciseRepository
                    .findByBlockIdInOrderBySortOrder(blockIds);
            totalExercises = exercises.size();
            validExerciseIds = exercises.stream()
                    .map(TemplateExercise::getId)
                    .collect(Collectors.toSet());
        }

        // Get completions
        List<ExerciseCompletion> completions = completionRepository
                .findByAssignmentIdAndUserIdAndIsCompletedTrue(assignment.getId(), userId);

        // Filter completions to only valid exercises
        Set<Long> finalValidExerciseIds = validExerciseIds;
        List<ExerciseCompletion> validCompletions = completions.stream()
                .filter(c -> finalValidExerciseIds.contains(c.getExerciseId()))
                .toList();

        long completedTotal = validCompletions.size();
        long completedToday = validCompletions.stream()
                .filter(c -> c.getCompletedAt().toLocalDate().equals(LocalDateTime.now().toLocalDate()))
                .count();

        int progressPercent = totalExercises > 0
                ? (int) Math.round((double) completedTotal / totalExercises * 100)
                : 0;

        LocalDateTime lastActivityAt = validCompletions.stream()
                .map(ExerciseCompletion::getCompletedAt)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        List<ExerciseCompletionDto> completionDtos = validCompletions.stream()
                .map(mapper::toDto)
                .toList();

        return new TrackingProgressDto(
                assignment.getId(),
                totalExercises,
                completedToday,
                completedTotal,
                progressPercent,
                lastActivityAt,
                completionDtos
        );
    }

    private void validateExerciseBelongsToAssignment(Long exerciseId, Long templateId) {
        List<TemplateBlock> blocks = blockRepository
                .findByTemplateIdOrderBySortOrder(templateId);
        List<Long> blockIds = blocks.stream().map(TemplateBlock::getId).toList();

        if (blockIds.isEmpty()) {
            throw new BusinessException("La plantilla no tiene ejercicios");
        }

        List<TemplateExercise> exercises = exerciseRepository
                .findByBlockIdInOrderBySortOrder(blockIds);

        boolean belongs = exercises.stream()
                .anyMatch(e -> e.getId().equals(exerciseId));

        if (!belongs) {
            throw new BusinessException("El ejercicio no pertenece a la rutina asignada");
        }
    }
}
