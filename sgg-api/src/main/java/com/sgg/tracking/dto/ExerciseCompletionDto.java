package com.sgg.tracking.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ExerciseCompletionDto(
        Long exerciseId,
        boolean isCompleted,
        BigDecimal weightKg,
        Integer actualReps,
        String notes,
        LocalDateTime completedAt
) {}
