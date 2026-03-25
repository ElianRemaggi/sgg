package com.sgg.training.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.common.security.SecurityUtils;
import com.sgg.training.dto.AssignRoutineRequest;
import com.sgg.training.dto.MemberRoutineDto;
import com.sgg.training.dto.RoutineAssignmentDto;
import com.sgg.training.service.RoutineAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gyms/{gymId}")
@RequiredArgsConstructor
public class RoutineAssignmentController {

    private final RoutineAssignmentService assignmentService;
    private final SecurityUtils securityUtils;

    @PostMapping("/coach/assignments")
    @PreAuthorize("@gymAccessChecker.isCoach(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<RoutineAssignmentDto>> assign(
            @PathVariable Long gymId,
            @Valid @RequestBody AssignRoutineRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(assignmentService.assign(gymId, request)));
    }

    @GetMapping("/member/routine")
    @PreAuthorize("@gymAccessChecker.isMember(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<MemberRoutineDto>> getActiveRoutine(
            @PathVariable Long gymId) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.ok(assignmentService.getActiveRoutine(gymId, userId)));
    }

    @GetMapping("/member/routine/history")
    @PreAuthorize("@gymAccessChecker.isMember(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<List<RoutineAssignmentDto>>> getHistory(
            @PathVariable Long gymId) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.ok(assignmentService.getHistory(gymId, userId)));
    }
}
