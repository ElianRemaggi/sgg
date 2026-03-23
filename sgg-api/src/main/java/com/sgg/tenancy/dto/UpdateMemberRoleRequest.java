package com.sgg.tenancy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateMemberRoleRequest(
    @NotBlank(message = "El rol es obligatorio")
    @Pattern(regexp = "MEMBER|COACH|ADMIN|ADMIN_COACH", message = "Rol inválido")
    String role
) {}
