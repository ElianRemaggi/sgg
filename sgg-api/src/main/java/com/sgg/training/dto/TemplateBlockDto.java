package com.sgg.training.dto;

import java.util.List;

public record TemplateBlockDto(
    Long id,
    String name,
    Integer dayNumber,
    Integer sortOrder,
    List<TemplateExerciseDto> exercises
) {}
