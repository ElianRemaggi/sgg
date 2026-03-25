package com.sgg.training.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record AssignRoutineRequest(
    @NotNull(message = "El templateId es obligatorio")
    Long templateId,

    @NotNull(message = "El memberUserId es obligatorio")
    Long memberUserId,

    @NotNull(message = "La fecha de inicio es obligatoria")
    LocalDateTime startsAt,

    LocalDateTime endsAt
) {}
