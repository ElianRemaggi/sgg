package com.sgg.tracking.dto;

import java.time.LocalDateTime;
import java.util.List;

public record TrackingProgressDto(
        Long assignmentId,
        long totalExercises,
        long completedToday,
        long completedTotal,
        int progressPercent,
        LocalDateTime lastActivityAt,
        List<ExerciseCompletionDto> completions
) {}
