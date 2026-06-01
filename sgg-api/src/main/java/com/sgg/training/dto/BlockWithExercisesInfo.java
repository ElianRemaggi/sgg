package com.sgg.training.dto;

import java.util.List;

public record BlockWithExercisesInfo(
        Long id,
        Long templateId,
        String name,
        Integer dayNumber,
        Integer sortOrder,
        List<ExerciseInfo> exercises
) {}
