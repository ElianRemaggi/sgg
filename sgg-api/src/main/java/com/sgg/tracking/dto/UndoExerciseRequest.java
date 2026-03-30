package com.sgg.tracking.dto;

import jakarta.validation.constraints.NotNull;

public record UndoExerciseRequest(
        @NotNull(message = "assignmentId es requerido")
        Long assignmentId,

        @NotNull(message = "exerciseId es requerido")
        Long exerciseId
) {}
