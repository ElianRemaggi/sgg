package com.sgg.tracking.dto;

import java.math.BigDecimal;

public record HistoryExerciseSummaryDto(
        Long exerciseId,
        String name,
        long sessionsCount,
        BigDecimal bestWeightKg,
        BigDecimal avgWeightKg,
        BigDecimal lastWeightKg
) {}
