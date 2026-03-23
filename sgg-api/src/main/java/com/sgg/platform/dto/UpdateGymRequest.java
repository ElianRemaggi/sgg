package com.sgg.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateGymRequest(
    @NotBlank @Size(max = 200) String name,
    @NotBlank @Pattern(regexp = "^[a-z0-9-]+$", message = "Solo letras minúsculas, números y guiones") @Size(max = 100) String slug,
    @Size(max = 1000) String description,
    @Size(max = 500) String logoUrl,
    @NotBlank @Pattern(regexp = "WEEKLY|MONTHLY") String routineCycle
) {}
