package com.sgg.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

public record UpdateProfileRequest(
    @NotBlank(message = "fullName es obligatorio")
    @Size(min = 2, max = 200, message = "fullName debe tener entre 2 y 200 caracteres")
    String fullName,

    @URL(message = "avatarUrl debe ser una URL válida")
    @Size(max = 500, message = "avatarUrl no puede superar 500 caracteres")
    String avatarUrl
) {}
