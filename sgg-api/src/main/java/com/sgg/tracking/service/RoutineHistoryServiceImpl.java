package com.sgg.tracking.service;

import com.sgg.common.exception.ResourceNotFoundException;
import com.sgg.tracking.dto.*;
import com.sgg.tracking.entity.ExerciseCompletion;
import com.sgg.tracking.repository.ExerciseCompletionRepository;
import com.sgg.training.entity.RoutineAssignment;
import com.sgg.training.entity.TemplateBlock;
import com.sgg.training.entity.TemplateExercise;
import com.sgg.training.repository.RoutineAssignmentRepository;
import com.sgg.training.repository.RoutineTemplateRepository;
import com.sgg.training.repository.TemplateBlockRepository;
import com.sgg.training.repository.TemplateExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoutineHistoryServiceImpl implements RoutineHistoryService {

    private final RoutineAssignmentRepository assignmentRepository;
    private final RoutineTemplateRepository templateRepository;
    private final TemplateBlockRepository blockRepository;
    private final TemplateExerciseRepository exerciseRepository;
    private final ExerciseCompletionRepository completionRepository;

    @Override
    public List<AssignmentHistorySummaryDto> getMemberHistory(Long gymId, Long userId) {
        List<RoutineAssignment> assignments = assignmentRepository
                .findByMemberUserIdAndGymIdOrderByStartsAtDesc(userId, gymId);

        return assignments.stream()
                .map(a -> buildSummary(a, userId))
                .toList();
    }

    @Override
    public AssignmentHistoryDetailDto getAssignmentDetail(Long gymId, Long userId, Long assignmentId) {
        RoutineAssignment assignment = findAssignmentForUser(assignmentId, userId, gymId);

        String templateName = templateRepository.findById(assignment.getTemplateId())
                .map(t -> t.getName())
                .orElse("Plantilla eliminada");

        List<TemplateBlock> blocks = blockRepository
                .findByTemplateIdOrderBySortOrder(assignment.getTemplateId());

        List<Long> blockIds = blocks.stream().map(TemplateBlock::getId).toList();
        List<TemplateExercise> allExercises = blockIds.isEmpty()
                ? List.of()
                : exerciseRepository.findByBlockIdInOrderBySortOrder(blockIds);

        Map<Long, List<TemplateExercise>> exercisesByBlock = allExercises.stream()
                .collect(Collectors.groupingBy(TemplateExercise::getBlockId));

        List<ExerciseCompletion> allCompletions = completionRepository
                .findByAssignmentIdAndUserIdOrderBySessionDateAsc(assignmentId, userId);

        Map<Long, List<ExerciseCompletion>> completionsByExercise = allCompletions.stream()
                .collect(Collectors.groupingBy(ExerciseCompletion::getExerciseId));

        List<HistoryBlockDto> historyBlocks = blocks.stream()
                .map(block -> {
                    List<TemplateExercise> exercises = exercisesByBlock.getOrDefault(block.getId(), List.of());
                    List<HistoryExerciseSummaryDto> exerciseSummaries = exercises.stream()
                            .map(ex -> buildExerciseSummary(ex, completionsByExercise.getOrDefault(ex.getId(), List.of())))
                            .toList();
                    return new HistoryBlockDto(block.getId(), block.getName(), block.getDayNumber(), exerciseSummaries);
                })
                .toList();

        HistoryStatsDto stats = buildHistoryStats(assignmentId, userId, allCompletions);
        boolean isActive = isAssignmentActive(assignment);

        return new AssignmentHistoryDetailDto(
                assignment.getId(), templateName, assignment.getStartsAt(), assignment.getEndsAt(),
                isActive, historyBlocks, stats);
    }

    @Override
    public ExerciseProgressDto getExerciseProgress(Long gymId, Long userId, Long assignmentId, Long exerciseId) {
        RoutineAssignment assignment = findAssignmentForUser(assignmentId, userId, gymId);

        TemplateExercise exercise = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResourceNotFoundException("Ejercicio no encontrado"));

        TemplateBlock block = blockRepository.findById(exercise.getBlockId())
                .orElseThrow(() -> new ResourceNotFoundException("Bloque no encontrado"));

        // Validar que el ejercicio pertenece a la plantilla de la asignación
        if (!block.getTemplateId().equals(assignment.getTemplateId())) {
            throw new ResourceNotFoundException("El ejercicio no pertenece a esta rutina");
        }

        List<ExerciseCompletion> completions = completionRepository
                .findByAssignmentIdAndExerciseIdAndUserIdOrderBySessionDateAsc(assignmentId, exerciseId, userId);

        List<ExerciseSessionDto> sessions = completions.stream()
                .map(c -> new ExerciseSessionDto(
                        c.getSessionDate(), c.getWeightKg(), c.getActualReps(),
                        c.getNotes(), c.getIsCompleted(), c.getCompletedAt()))
                .toList();

        ExerciseStatsDto stats = buildExerciseStats(completions);

        return new ExerciseProgressDto(
                exercise.getId(), exercise.getName(),
                block.getName(), block.getDayNumber(),
                sessions, stats);
    }

    private RoutineAssignment findAssignmentForUser(Long assignmentId, Long userId, Long gymId) {
        RoutineAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Rutina no encontrada"));

        if (!assignment.getMemberUserId().equals(userId) || !assignment.getGymId().equals(gymId)) {
            throw new ResourceNotFoundException("Rutina no encontrada");
        }
        return assignment;
    }

    private AssignmentHistorySummaryDto buildSummary(RoutineAssignment assignment, Long userId) {
        String templateName = templateRepository.findById(assignment.getTemplateId())
                .map(t -> t.getName())
                .orElse("Plantilla eliminada");

        long sessionDays = completionRepository.countDistinctSessionDays(assignment.getId(), userId);
        long totalCompletions = completionRepository.countTotalCompletionsByAssignment(assignment.getId(), userId);
        LocalDateTime lastActivityAt = completionRepository
                .findLastActivityAt(assignment.getId(), userId)
                .orElse(null);

        return new AssignmentHistorySummaryDto(
                assignment.getId(), templateName, assignment.getStartsAt(), assignment.getEndsAt(),
                isAssignmentActive(assignment), sessionDays, totalCompletions, lastActivityAt);
    }

    private HistoryExerciseSummaryDto buildExerciseSummary(TemplateExercise exercise, List<ExerciseCompletion> completions) {
        List<ExerciseCompletion> completed = completions.stream()
                .filter(ExerciseCompletion::getIsCompleted)
                .toList();

        long sessionsCount = completed.size();
        BigDecimal bestWeight = completed.stream()
                .map(ExerciseCompletion::getWeightKg)
                .filter(w -> w != null)
                .max(Comparator.naturalOrder())
                .orElse(null);
        BigDecimal avgWeight = completed.stream()
                .map(ExerciseCompletion::getWeightKg)
                .filter(w -> w != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long withWeight = completed.stream().filter(c -> c.getWeightKg() != null).count();
        BigDecimal avg = withWeight > 0 ? avgWeight.divide(BigDecimal.valueOf(withWeight), 2, RoundingMode.HALF_UP) : null;

        BigDecimal lastWeight = completed.isEmpty() ? null
                : completed.getLast().getWeightKg();

        return new HistoryExerciseSummaryDto(exercise.getId(), exercise.getName(), sessionsCount, bestWeight, avg, lastWeight);
    }

    private HistoryStatsDto buildHistoryStats(Long assignmentId, Long userId, List<ExerciseCompletion> allCompletions) {
        List<ExerciseCompletion> completed = allCompletions.stream()
                .filter(ExerciseCompletion::getIsCompleted)
                .toList();

        long distinctDays = completed.stream()
                .map(ExerciseCompletion::getSessionDate)
                .distinct()
                .count();
        LocalDateTime firstActivity = completed.stream()
                .map(ExerciseCompletion::getCompletedAt)
                .min(Comparator.naturalOrder())
                .orElse(null);
        LocalDateTime lastActivity = completed.stream()
                .map(ExerciseCompletion::getCompletedAt)
                .max(Comparator.naturalOrder())
                .orElse(null);

        return new HistoryStatsDto(distinctDays, completed.size(), firstActivity, lastActivity);
    }

    private ExerciseStatsDto buildExerciseStats(List<ExerciseCompletion> completions) {
        List<ExerciseCompletion> completed = completions.stream()
                .filter(ExerciseCompletion::getIsCompleted)
                .toList();

        long sessionsCount = completed.size();

        List<BigDecimal> weights = completed.stream()
                .map(ExerciseCompletion::getWeightKg)
                .filter(w -> w != null)
                .toList();

        BigDecimal best = weights.stream().max(Comparator.naturalOrder()).orElse(null);
        BigDecimal first = completed.isEmpty() ? null : completed.getFirst().getWeightKg();
        BigDecimal last = completed.isEmpty() ? null : completed.getLast().getWeightKg();

        BigDecimal avg = null;
        if (!weights.isEmpty()) {
            avg = weights.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(weights.size()), 2, RoundingMode.HALF_UP);
        }

        Double delta = null;
        if (first != null && last != null && first.compareTo(BigDecimal.ZERO) > 0) {
            delta = last.subtract(first)
                    .divide(first, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }

        return new ExerciseStatsDto(sessionsCount, best, avg, first, last, delta);
    }

    private boolean isAssignmentActive(RoutineAssignment assignment) {
        LocalDateTime now = LocalDateTime.now();
        return assignment.getStartsAt().isBefore(now)
                && (assignment.getEndsAt() == null || assignment.getEndsAt().isAfter(now));
    }
}
