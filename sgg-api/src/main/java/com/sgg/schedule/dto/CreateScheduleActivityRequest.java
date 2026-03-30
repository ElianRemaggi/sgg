package com.sgg.schedule.dto;

import jakarta.validation.constraints.*;

public record CreateScheduleActivityRequest(
        @NotBlank(message = "El nombre es requerido")
        @Size(max = 200, message = "El nombre no puede superar los 200 caracteres")
        String name,

        String description,

        @NotNull(message = "El día de la semana es requerido")
        @Min(value = 1, message = "El día debe ser entre 1 (lunes) y 7 (domingo)")
        @Max(value = 7, message = "El día debe ser entre 1 (lunes) y 7 (domingo)")
        Integer dayOfWeek,

        @NotBlank(message = "La hora de inicio es requerida")
        String startTime,

        @NotBlank(message = "La hora de fin es requerida")
        String endTime
) {}
