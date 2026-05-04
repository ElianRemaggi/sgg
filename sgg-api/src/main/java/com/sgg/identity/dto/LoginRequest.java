package com.sgg.identity.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank(message = "El usuario o email es obligatorio")
    String identifier,

    @NotBlank(message = "La contraseña es obligatoria")
    String password
) {}
