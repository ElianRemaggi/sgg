package com.sgg.tracking.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ExerciseSessionDto(
        LocalDate sessionDate,
        BigDecimal weightKg,
        Integer actualReps,
        String notes,
        boolean isCompleted,
        LocalDateTime completedAt
) {}
