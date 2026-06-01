package com.sgg.tracking.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record TrackingProgressDto(
        Long assignmentId,
        long totalExercises,
        long completedToday,
        long completedTotal,
        int progressPercent,
        LocalDateTime lastActivityAt,
        List<ExerciseCompletionDto> completions,
        Map<Long, String> previousNotesByExerciseId
) {}
