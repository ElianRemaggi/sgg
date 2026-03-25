package com.sgg.training.dto;

import java.time.LocalDateTime;
import java.util.List;

public record MemberRoutineDto(
    Long assignmentId,
    String templateName,
    LocalDateTime startsAt,
    LocalDateTime endsAt,
    List<TemplateBlockDto> blocks
) {}
