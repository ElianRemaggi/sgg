package com.sgg.training.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;

public record CreateRoutineTemplateRequest(
    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 200, message = "El nombre no puede superar 200 caracteres")
    String name,

    @Size(max = 500, message = "La descripción no puede superar 500 caracteres")
    String description,

    @NotEmpty(message = "Debe tener al menos un bloque")
    @Valid
    List<BlockRequest> blocks
) {
    public record BlockRequest(
        @NotBlank(message = "El nombre del bloque es obligatorio")
        @Size(max = 100, message = "El nombre del bloque no puede superar 100 caracteres")
        String name,

        @NotNull(message = "El número de día es obligatorio")
        @Min(value = 1, message = "El día debe ser al menos 1")
        @Max(value = 31, message = "El día no puede ser mayor a 31")
        Integer dayNumber,

        Integer sortOrder,

        @Valid
        List<ExerciseRequest> exercises
    ) {}

    public record ExerciseRequest(
        @NotBlank(message = "El nombre del ejercicio es obligatorio")
        @Size(max = 200, message = "El nombre del ejercicio no puede superar 200 caracteres")
        String name,

        @Min(value = 1, message = "Las series deben ser al menos 1")
        Integer sets,

        @Size(max = 50, message = "Las repeticiones no pueden superar 50 caracteres")
        String reps,

        @Min(value = 0, message = "El descanso no puede ser negativo")
        Integer restSeconds,

        String notes,

        Integer sortOrder
    ) {}
}
