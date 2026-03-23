package com.sgg.tenancy.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record SetExpiryRequest(
    @NotNull(message = "La fecha de vencimiento es obligatoria")
    @Future(message = "La fecha debe ser futura")
    LocalDateTime expiresAt
) {}
