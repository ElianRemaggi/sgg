package com.sgg.tracking.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CompleteExerciseRequest(
        @NotNull(message = "assignmentId es requerido")
        Long assignmentId,

        @NotNull(message = "exerciseId es requerido")
        Long exerciseId,

        @DecimalMin(value = "0.0", message = "El peso debe ser positivo")
        BigDecimal weightKg,

        @Min(value = 0, message = "Las reps deben ser positivas")
        Integer actualReps,

        @Size(max = 500, message = "Las notas no pueden superar los 500 caracteres")
        String notes
) {}
