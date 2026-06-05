package com.sgg.training.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.common.exception.BusinessException;
import com.sgg.training.dto.CreateRoutineTemplateRequest;
import com.sgg.training.dto.RoutineTemplateDetailDto;
import com.sgg.training.dto.RoutineTemplateSummaryDto;
import com.sgg.training.service.RoutineExportService;
import com.sgg.training.service.RoutineTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.text.Normalizer;
import java.util.List;

@RestController
@RequestMapping("/api/gyms/{gymId}/coach/templates")
@RequiredArgsConstructor
public class RoutineTemplateController {

    private final RoutineTemplateService templateService;
    private final RoutineExportService exportService;

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

    @GetMapping("/{templateId}/export")
    @PreAuthorize("@gymAccessChecker.isCoach(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<byte[]> export(
            @PathVariable Long gymId,
            @PathVariable Long templateId,
            @RequestParam(defaultValue = "xlsx") String format) {

        RoutineTemplateDetailDto dto = templateService.findById(gymId, templateId);
        String filename = buildFilename(dto.name(), format);

        return switch (format.toLowerCase()) {
            case "xlsx" -> ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(exportService.toXlsx(dto));
            case "csv" -> ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(exportService.toCsv(dto));
            default -> throw new BusinessException("Formato no soportado. Usá 'xlsx' o 'csv'.");
        };
    }

    /** Convierte el nombre de la plantilla en un filename seguro. */
    private String buildFilename(String name, String format) {
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD)
            .replaceAll("[^\\p{ASCII}]", "")
            .replaceAll("[^a-zA-Z0-9_\\-]", "_")
            .replaceAll("_+", "_")
            .strip();
        if (normalized.isEmpty()) normalized = "rutina";
        return normalized + "." + format.toLowerCase();
    }
}
