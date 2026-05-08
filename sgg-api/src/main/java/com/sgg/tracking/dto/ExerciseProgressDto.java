package com.sgg.tracking.dto;

import java.util.List;

public record ExerciseProgressDto(
        Long exerciseId,
        String exerciseName,
        String blockName,
        Integer dayNumber,
        List<ExerciseSessionDto> sessions,
        ExerciseStatsDto stats
) {}
