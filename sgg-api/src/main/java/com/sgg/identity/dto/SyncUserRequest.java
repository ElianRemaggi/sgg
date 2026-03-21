package com.sgg.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SyncUserRequest(
    @NotBlank(message = "supabaseUid es obligatorio")
    String supabaseUid,

    @NotBlank(message = "email es obligatorio")
    @Email(message = "email debe ser válido")
    String email,

    @NotBlank(message = "fullName es obligatorio")
    @Size(max = 200, message = "fullName no puede superar 200 caracteres")
    String fullName,

    @Size(max = 500, message = "avatarUrl no puede superar 500 caracteres")
    String avatarUrl,

    @NotBlank(message = "provider es obligatorio")
    String provider,

    @NotBlank(message = "providerUid es obligatorio")
    String providerUid
) {}
