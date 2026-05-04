package com.sgg.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "El username es obligatorio")
    @Pattern(
        regexp = "^[a-z0-9_]{3,30}$",
        message = "El username debe tener 3-30 caracteres y solo contener letras minúsculas, números o guion bajo"
    )
    String username,

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email no es válido")
    String email,

    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 2, max = 200, message = "El nombre debe tener entre 2 y 200 caracteres")
    String fullName,

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, max = 100, message = "La contraseña debe tener entre 6 y 100 caracteres")
    String password
) {}
