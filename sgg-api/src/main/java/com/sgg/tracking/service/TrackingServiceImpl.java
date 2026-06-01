package com.sgg.tracking.service;

import com.sgg.common.exception.BusinessException;
import com.sgg.common.exception.ResourceNotFoundException;
import com.sgg.common.security.SecurityUtils;
import com.sgg.tracking.dto.*;
import com.sgg.tracking.entity.ExerciseCompletion;
import com.sgg.tracking.mapper.ExerciseCompletionMapper;
import com.sgg.tracking.repository.ExerciseCompletionRepository;
import com.sgg.training.dto.AssignmentInfo;
import com.sgg.training.dto.ExerciseInfo;
import com.sgg.training.service.RoutineQueryService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
    private final RoutineQueryService routineQueryService;
    private final ExerciseCompletionMapper mapper;
    private final SecurityUtils securityUtils;

    @Override
    public ExerciseCompletionDto completeExercise(Long gymId, CompleteExerciseRequest request) {
        Long userId = securityUtils.getCurrentUserId();

        AssignmentInfo assignment = routineQueryService.findActiveAssignment(userId, gymId)
                .orElseThrow(() -> new ResourceNotFoundException("No tenés una rutina activa asignada"));

        if (!assignment.id().equals(request.assignmentId())) {
            throw new BusinessException("El assignment no corresponde a tu rutina activa");
        }

        if (!routineQueryService.exerciseBelongsToTemplate(request.exerciseId(), assignment.templateId())) {
            throw new BusinessException("El ejercicio no pertenece a la rutina asignada");
        }

        LocalDate today = LocalDate.now();
        ExerciseCompletion completion = completionRepository
                .findByAssignmentIdAndExerciseIdAndUserIdAndSessionDate(
                        request.assignmentId(), request.exerciseId(), userId, today)
                .orElseGet(() -> {
                    ExerciseCompletion ec = new ExerciseCompletion();
                    ec.setGymId(gymId);
                    ec.setAssignmentId(request.assignmentId());
                    ec.setExerciseId(request.exerciseId());
                    ec.setUserId(userId);
                    ec.setSessionDate(today);
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
                .findByAssignmentIdAndExerciseIdAndUserIdAndSessionDate(
                        request.assignmentId(), request.exerciseId(), userId, LocalDate.now())
                .ifPresent(completion -> {
                    completion.setIsCompleted(false);
                    completionRepository.save(completion);
                    log.info("Exercise undone: gymId={}, assignmentId={}, exerciseId={}, userId={}",
                            gymId, request.assignmentId(), request.exerciseId(), userId);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public TrackingProgressDto getProgress(Long gymId) {
        return buildProgress(gymId, securityUtils.getCurrentUserId());
    }

    @Override
    @Transactional(readOnly = true)
    public TrackingProgressDto getMemberProgress(Long gymId, Long memberId) {
        return buildProgress(gymId, memberId);
    }

    private TrackingProgressDto buildProgress(Long gymId, Long userId) {
        AssignmentInfo assignment = routineQueryService.findActiveAssignment(userId, gymId)
                .orElseThrow(() -> new ResourceNotFoundException("No hay rutina activa asignada"));

        List<ExerciseInfo> exercises = routineQueryService.findExercisesByTemplateId(assignment.templateId());
        long totalExercises = exercises.size();
        Set<Long> validExerciseIds = exercises.stream().map(ExerciseInfo::id).collect(Collectors.toSet());

        LocalDate today = LocalDate.now();
        List<ExerciseCompletion> todayCompletions = completionRepository
                .findByAssignmentIdAndUserIdAndSessionDateAndIsCompletedTrue(assignment.id(), userId, today);

        List<ExerciseCompletion> validTodayCompletions = todayCompletions.stream()
                .filter(c -> validExerciseIds.contains(c.getExerciseId()))
                .toList();

        long completedToday = validTodayCompletions.size();
        long completedTotal = completionRepository.countCompletedByAssignment(assignment.id(), userId);

        int progressPercent = totalExercises > 0
                ? (int) Math.round((double) completedToday / totalExercises * 100)
                : 0;

        LocalDateTime lastActivityAt = completionRepository
                .findLastActivity(assignment.id(), userId)
                .map(ExerciseCompletion::getCompletedAt)
                .orElse(null);

        List<ExerciseCompletionDto> completionDtos = validTodayCompletions.stream()
                .map(mapper::toDto)
                .toList();

        List<Long> exerciseIds = exercises.stream().map(ExerciseInfo::id).toList();
        Map<Long, String> previousNotesByExerciseId = exerciseIds.isEmpty()
                ? Map.of()
                : completionRepository.findLastNotesByExerciseIds(userId, exerciseIds, LocalDate.now())
                        .stream()
                        .collect(Collectors.toMap(
                                ExerciseCompletionRepository.ExerciseLastNoteRow::getExerciseId,
                                ExerciseCompletionRepository.ExerciseLastNoteRow::getNotes
                        ));

        return new TrackingProgressDto(
                assignment.id(),
                totalExercises,
                completedToday,
                completedTotal,
                progressPercent,
                lastActivityAt,
                completionDtos,
                previousNotesByExerciseId
        );
    }
}
