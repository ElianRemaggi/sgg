package com.sgg.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateGymRequestStatusRequest(

    @NotBlank(message = "El status es obligatorio")
    @Pattern(regexp = "PENDING|CONTACTED|APPROVED|REJECTED",
             message = "Status inválido. Valores permitidos: PENDING, CONTACTED, APPROVED, REJECTED")
    String status
) {}
