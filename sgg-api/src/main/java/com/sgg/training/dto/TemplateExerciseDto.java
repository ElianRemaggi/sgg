package com.sgg.training.dto;

public record TemplateExerciseDto(
    Long id,
    String name,
    Integer sets,
    String reps,
    Integer restSeconds,
    String notes,
    Integer sortOrder
) {}
