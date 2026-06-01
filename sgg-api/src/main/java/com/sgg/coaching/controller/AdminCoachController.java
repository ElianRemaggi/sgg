package com.sgg.coaching.controller;

import com.sgg.coaching.dto.AssignCoachRequest;
import com.sgg.coaching.dto.CoachAssignmentDto;
import com.sgg.coaching.dto.CoachSummaryDto;
import com.sgg.coaching.service.CoachAssignmentService;
import com.sgg.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gyms/{gymId}/admin")
@RequiredArgsConstructor
public class AdminCoachController {

    private final CoachAssignmentService coachAssignmentService;

    @GetMapping("/coaches")
    @PreAuthorize("@gymAccessChecker.isAdmin(#gymId)")
    public ResponseEntity<ApiResponse<List<CoachSummaryDto>>> listCoaches(
            @PathVariable Long gymId) {
        return ResponseEntity.ok(ApiResponse.ok(coachAssignmentService.listCoaches(gymId)));
    }

    @PostMapping("/assign-coach")
    @PreAuthorize("@gymAccessChecker.isAdmin(#gymId)")
    public ResponseEntity<ApiResponse<CoachAssignmentDto>> assignCoach(
            @PathVariable Long gymId,
            @Valid @RequestBody AssignCoachRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(coachAssignmentService.assignCoach(gymId, request)));
    }

    @DeleteMapping("/assign-coach/{assignmentId}")
    @PreAuthorize("@gymAccessChecker.isAdmin(#gymId)")
    public ResponseEntity<Void> unassignCoach(
            @PathVariable Long gymId,
            @PathVariable Long assignmentId) {
        coachAssignmentService.unassignCoach(gymId, assignmentId);
        return ResponseEntity.noContent().build();
    }
}
