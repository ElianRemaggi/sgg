package com.sgg.coaching.dto;

import jakarta.validation.constraints.NotNull;

public record AssignCoachRequest(

    @NotNull(message = "coachUserId es obligatorio")
    Long coachUserId,

    @NotNull(message = "memberUserId es obligatorio")
    Long memberUserId
) {}
