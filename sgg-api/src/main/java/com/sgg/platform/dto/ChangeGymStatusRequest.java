package com.sgg.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangeGymStatusRequest(
    @NotBlank @Pattern(regexp = "ACTIVE|SUSPENDED") String status,
    @Size(max = 500) String reason
) {}
