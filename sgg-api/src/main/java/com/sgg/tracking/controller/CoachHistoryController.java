package com.sgg.tracking.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.tracking.dto.AssignmentHistoryDetailDto;
import com.sgg.tracking.dto.AssignmentHistorySummaryDto;
import com.sgg.tracking.dto.ExerciseProgressDto;
import com.sgg.tracking.service.RoutineHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gyms/{gymId}/coach/history")
@RequiredArgsConstructor
public class CoachHistoryController {

    private final RoutineHistoryService historyService;

    @GetMapping("/{memberId}/assignments")
    @PreAuthorize("@gymAccessChecker.isCoach(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<List<AssignmentHistorySummaryDto>>> getMemberHistory(
            @PathVariable Long gymId,
            @PathVariable Long memberId) {
        return ResponseEntity.ok(ApiResponse.ok(historyService.getMemberHistory(gymId, memberId)));
    }

    @GetMapping("/{memberId}/assignments/{assignmentId}")
    @PreAuthorize("@gymAccessChecker.isCoach(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<AssignmentHistoryDetailDto>> getAssignmentDetail(
            @PathVariable Long gymId,
            @PathVariable Long memberId,
            @PathVariable Long assignmentId) {
        return ResponseEntity.ok(ApiResponse.ok(historyService.getAssignmentDetail(gymId, memberId, assignmentId)));
    }

    @GetMapping("/{memberId}/assignments/{assignmentId}/exercises/{exerciseId}")
    @PreAuthorize("@gymAccessChecker.isCoach(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<ExerciseProgressDto>> getExerciseProgress(
            @PathVariable Long gymId,
            @PathVariable Long memberId,
            @PathVariable Long assignmentId,
            @PathVariable Long exerciseId) {
        return ResponseEntity.ok(ApiResponse.ok(historyService.getExerciseProgress(gymId, memberId, assignmentId, exerciseId)));
    }
}
