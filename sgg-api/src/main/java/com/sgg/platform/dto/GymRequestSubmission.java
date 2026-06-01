package com.sgg.platform.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GymRequestSubmission(

    @NotBlank(message = "El nombre del gym es obligatorio")
    @Size(max = 200, message = "El nombre del gym no puede superar 200 caracteres")
    String gymName,

    @NotBlank(message = "El nombre de contacto es obligatorio")
    @Size(max = 200, message = "El nombre de contacto no puede superar 200 caracteres")
    String contactName,

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email no es válido")
    @Size(max = 255, message = "El email no puede superar 255 caracteres")
    String email,

    @NotBlank(message = "El teléfono es obligatorio")
    @Size(max = 50, message = "El teléfono no puede superar 50 caracteres")
    String phone,

    @Size(max = 2000, message = "El mensaje no puede superar 2000 caracteres")
    String message
) {}
