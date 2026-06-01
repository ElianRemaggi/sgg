package com.sgg.tracking.service;

import com.sgg.common.exception.ResourceNotFoundException;
import com.sgg.tracking.dto.*;
import com.sgg.tracking.entity.ExerciseCompletion;
import com.sgg.tracking.repository.ExerciseCompletionRepository;
import com.sgg.training.dto.AssignmentInfo;
import com.sgg.training.dto.BlockWithExercisesInfo;
import com.sgg.training.dto.ExerciseWithBlockInfo;
import com.sgg.training.service.RoutineQueryService;
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

    private final RoutineQueryService routineQueryService;
    private final ExerciseCompletionRepository completionRepository;

    @Override
    public List<AssignmentHistorySummaryDto> getMemberHistory(Long gymId, Long userId) {
        List<AssignmentInfo> assignments = routineQueryService.findMemberAssignments(userId, gymId);
        if (assignments.isEmpty()) return List.of();

        List<Long> templateIds = assignments.stream().map(AssignmentInfo::templateId).distinct().toList();
        Map<Long, String> templateNames = routineQueryService.findTemplateNames(templateIds);

        List<Long> assignmentIds = assignments.stream().map(AssignmentInfo::id).toList();
        Map<Long, ExerciseCompletionRepository.AssignmentStatsRow> statsMap =
                completionRepository.findStatsBatch(userId, assignmentIds).stream()
                        .collect(Collectors.toMap(
                                ExerciseCompletionRepository.AssignmentStatsRow::getAssignmentId, s -> s));

        return assignments.stream()
                .map(a -> {
                    String name = templateNames.getOrDefault(a.templateId(), "Plantilla eliminada");
                    ExerciseCompletionRepository.AssignmentStatsRow stats = statsMap.get(a.id());
                    long sessionDays = stats != null ? stats.getSessionDays() : 0L;
                    long totalCompletions = stats != null ? stats.getTotalCompletions() : 0L;
                    LocalDateTime lastActivityAt = stats != null ? stats.getLastActivityAt() : null;
                    return new AssignmentHistorySummaryDto(
                            a.id(), name, a.startsAt(), a.endsAt(),
                            isAssignmentActive(a), sessionDays, totalCompletions, lastActivityAt);
                })
                .toList();
    }

    @Override
    public AssignmentHistoryDetailDto getAssignmentDetail(Long gymId, Long userId, Long assignmentId) {
        AssignmentInfo assignment = findAssignmentForUser(assignmentId, userId, gymId);

        String templateName = routineQueryService.findTemplateNames(List.of(assignment.templateId()))
                .getOrDefault(assignment.templateId(), "Plantilla eliminada");

        List<BlockWithExercisesInfo> blocks = routineQueryService.findBlocksWithExercises(assignment.templateId());

        List<ExerciseCompletion> allCompletions = completionRepository
                .findByAssignmentIdAndUserIdOrderBySessionDateAsc(assignmentId, userId);
        Map<Long, List<ExerciseCompletion>> completionsByExercise = allCompletions.stream()
                .collect(Collectors.groupingBy(ExerciseCompletion::getExerciseId));

        List<HistoryBlockDto> historyBlocks = blocks.stream()
                .map(block -> {
                    List<HistoryExerciseSummaryDto> summaries = block.exercises().stream()
                            .map(ex -> buildExerciseSummary(ex.id(), ex.name(),
                                    completionsByExercise.getOrDefault(ex.id(), List.of())))
                            .toList();
                    return new HistoryBlockDto(block.id(), block.name(), block.dayNumber(), summaries);
                })
                .toList();

        return new AssignmentHistoryDetailDto(
                assignment.id(), templateName, assignment.startsAt(), assignment.endsAt(),
                isAssignmentActive(assignment), historyBlocks, buildHistoryStats(allCompletions));
    }

    @Override
    public ExerciseProgressDto getExerciseProgress(Long gymId, Long userId, Long assignmentId, Long exerciseId) {
        AssignmentInfo assignment = findAssignmentForUser(assignmentId, userId, gymId);

        ExerciseWithBlockInfo exerciseInfo = routineQueryService.findExerciseWithBlock(exerciseId)
                .orElseThrow(() -> new ResourceNotFoundException("Ejercicio no encontrado"));

        if (!exerciseInfo.templateId().equals(assignment.templateId())) {
            throw new ResourceNotFoundException("El ejercicio no pertenece a esta rutina");
        }

        List<ExerciseCompletion> completions = completionRepository
                .findByAssignmentIdAndExerciseIdAndUserIdOrderBySessionDateAsc(assignmentId, exerciseId, userId);

        List<ExerciseSessionDto> sessions = completions.stream()
                .map(c -> new ExerciseSessionDto(
                        c.getSessionDate(), c.getWeightKg(), c.getActualReps(),
                        c.getNotes(), c.getIsCompleted(), c.getCompletedAt()))
                .toList();

        return new ExerciseProgressDto(
                exerciseId, exerciseInfo.exerciseName(),
                exerciseInfo.blockName(), exerciseInfo.dayNumber(),
                sessions, buildExerciseStats(completions));
    }

    private AssignmentInfo findAssignmentForUser(Long assignmentId, Long userId, Long gymId) {
        AssignmentInfo assignment = routineQueryService.findAssignmentById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Rutina no encontrada"));
        if (!assignment.memberUserId().equals(userId) || !assignment.gymId().equals(gymId)) {
            throw new ResourceNotFoundException("Rutina no encontrada");
        }
        return assignment;
    }

    private boolean isAssignmentActive(AssignmentInfo assignment) {
        LocalDateTime now = LocalDateTime.now();
        return assignment.startsAt().isBefore(now)
                && (assignment.endsAt() == null || assignment.endsAt().isAfter(now));
    }

    private HistoryExerciseSummaryDto buildExerciseSummary(Long exerciseId, String exerciseName,
                                                            List<ExerciseCompletion> completions) {
        List<ExerciseCompletion> completed = completions.stream()
                .filter(ExerciseCompletion::getIsCompleted).toList();

        BigDecimal bestWeight = completed.stream()
                .map(ExerciseCompletion::getWeightKg).filter(w -> w != null)
                .max(Comparator.naturalOrder()).orElse(null);
        long withWeight = completed.stream().filter(c -> c.getWeightKg() != null).count();
        BigDecimal avg = withWeight > 0
                ? completed.stream().map(ExerciseCompletion::getWeightKg).filter(w -> w != null)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(withWeight), 2, RoundingMode.HALF_UP)
                : null;
        BigDecimal lastWeight = completed.isEmpty() ? null : completed.getLast().getWeightKg();

        return new HistoryExerciseSummaryDto(exerciseId, exerciseName, completed.size(), bestWeight, avg, lastWeight);
    }

    private HistoryStatsDto buildHistoryStats(List<ExerciseCompletion> allCompletions) {
        List<ExerciseCompletion> completed = allCompletions.stream()
                .filter(ExerciseCompletion::getIsCompleted).toList();

        long distinctDays = completed.stream().map(ExerciseCompletion::getSessionDate).distinct().count();
        LocalDateTime first = completed.stream().map(ExerciseCompletion::getCompletedAt)
                .min(Comparator.naturalOrder()).orElse(null);
        LocalDateTime last = completed.stream().map(ExerciseCompletion::getCompletedAt)
                .max(Comparator.naturalOrder()).orElse(null);

        return new HistoryStatsDto(distinctDays, completed.size(), first, last);
    }

    private ExerciseStatsDto buildExerciseStats(List<ExerciseCompletion> completions) {
        List<ExerciseCompletion> completed = completions.stream()
                .filter(ExerciseCompletion::getIsCompleted).toList();

        List<BigDecimal> weights = completed.stream()
                .map(ExerciseCompletion::getWeightKg).filter(w -> w != null).toList();

        BigDecimal best = weights.stream().max(Comparator.naturalOrder()).orElse(null);
        BigDecimal firstWeight = completed.isEmpty() ? null : completed.getFirst().getWeightKg();
        BigDecimal lastWeight = completed.isEmpty() ? null : completed.getLast().getWeightKg();
        BigDecimal avg = weights.isEmpty() ? null
                : weights.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(weights.size()), 2, RoundingMode.HALF_UP);

        Double delta = null;
        if (firstWeight != null && lastWeight != null && firstWeight.compareTo(BigDecimal.ZERO) > 0) {
            delta = lastWeight.subtract(firstWeight)
                    .divide(firstWeight, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }

        return new ExerciseStatsDto(completed.size(), best, avg, firstWeight, lastWeight, delta);
    }
}
