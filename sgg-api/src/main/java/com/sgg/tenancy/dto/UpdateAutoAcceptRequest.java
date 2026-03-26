package com.sgg.tenancy.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateAutoAcceptRequest(
    @NotNull Boolean autoAccept
) {}
