package com.sgg.training.dto;

import java.time.LocalDateTime;
import java.util.List;

public record RoutineTemplateDetailDto(
    Long id,
    String name,
    String description,
    List<TemplateBlockDto> blocks,
    RoutineTemplateSummaryDto.CreatorDto createdBy,
    LocalDateTime createdAt
) {}
