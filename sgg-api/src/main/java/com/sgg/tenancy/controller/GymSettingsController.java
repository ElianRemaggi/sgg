package com.sgg.tenancy.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.tenancy.dto.UpdateAutoAcceptRequest;
import com.sgg.tenancy.service.GymService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/gyms/{gymId}/settings")
@RequiredArgsConstructor
public class GymSettingsController {

    private final GymService gymService;

    @PatchMapping("/auto-accept")
    @PreAuthorize("@gymAccessChecker.isAdmin(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<Void>> updateAutoAccept(
            @PathVariable Long gymId,
            @Valid @RequestBody UpdateAutoAcceptRequest request) {
        gymService.updateAutoAccept(gymId, request.autoAccept());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
