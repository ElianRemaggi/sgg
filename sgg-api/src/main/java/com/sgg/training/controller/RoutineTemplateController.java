package com.sgg.training.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.training.dto.CreateRoutineTemplateRequest;
import com.sgg.training.dto.RoutineTemplateDetailDto;
import com.sgg.training.dto.RoutineTemplateSummaryDto;
import com.sgg.training.service.RoutineTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gyms/{gymId}/coach/templates")
@RequiredArgsConstructor
public class RoutineTemplateController {

    private final RoutineTemplateService templateService;

    @GetMapping
    @PreAuthorize("@gymAccessChecker.isCoach(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<List<RoutineTemplateSummaryDto>>> list(
            @PathVariable Long gymId) {
        return ResponseEntity.ok(ApiResponse.ok(templateService.findByGym(gymId)));
    }

    @GetMapping("/{templateId}")
    @PreAuthorize("@gymAccessChecker.isCoach(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<RoutineTemplateDetailDto>> getById(
            @PathVariable Long gymId, @PathVariable Long templateId) {
        return ResponseEntity.ok(ApiResponse.ok(templateService.findById(gymId, templateId)));
    }

    @PostMapping
    @PreAuthorize("@gymAccessChecker.isCoach(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<RoutineTemplateDetailDto>> create(
            @PathVariable Long gymId,
            @Valid @RequestBody CreateRoutineTemplateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(templateService.create(gymId, request)));
    }

    @PutMapping("/{templateId}")
    @PreAuthorize("@gymAccessChecker.isCoach(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<RoutineTemplateDetailDto>> update(
            @PathVariable Long gymId, @PathVariable Long templateId,
            @Valid @RequestBody CreateRoutineTemplateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(templateService.update(gymId, templateId, request)));
    }

    @DeleteMapping("/{templateId}")
    @PreAuthorize("@gymAccessChecker.isCoach(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long gymId, @PathVariable Long templateId) {
        templateService.delete(gymId, templateId);
        return ResponseEntity.noContent().build();
    }
}
