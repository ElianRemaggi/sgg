package com.sgg.tracking.dto;

import java.util.List;

public record HistoryBlockDto(
        Long id,
        String name,
        Integer dayNumber,
        List<HistoryExerciseSummaryDto> exercises
) {}
