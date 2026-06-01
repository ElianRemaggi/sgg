package com.sgg.training.dto;

public record ExerciseInfo(
        Long id,
        Long blockId,
        String name,
        Integer sets,
        String reps,
        Integer restSeconds,
        String notes,
        Integer sortOrder
) {}
