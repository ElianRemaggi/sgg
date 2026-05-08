package com.sgg.tracking.dto;

import java.math.BigDecimal;

public record ExerciseStatsDto(
        long sessionsCount,
        BigDecimal bestWeightKg,
        BigDecimal avgWeightKg,
        BigDecimal firstWeightKg,
        BigDecimal lastWeightKg,
        Double deltaPercent
) {}
