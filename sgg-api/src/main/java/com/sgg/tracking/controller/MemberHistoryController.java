package com.sgg.tracking.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.common.security.SecurityUtils;
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
@RequestMapping("/api/gyms/{gymId}/member/history")
@RequiredArgsConstructor
public class MemberHistoryController {

    private final RoutineHistoryService historyService;
    private final SecurityUtils securityUtils;

    @GetMapping("/assignments")
    @PreAuthorize("@gymAccessChecker.isMember(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<List<AssignmentHistorySummaryDto>>> getHistory(
            @PathVariable Long gymId) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.ok(historyService.getMemberHistory(gymId, userId)));
    }

    @GetMapping("/assignments/{assignmentId}")
    @PreAuthorize("@gymAccessChecker.isMember(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<AssignmentHistoryDetailDto>> getAssignmentDetail(
            @PathVariable Long gymId,
            @PathVariable Long assignmentId) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.ok(historyService.getAssignmentDetail(gymId, userId, assignmentId)));
    }

    @GetMapping("/assignments/{assignmentId}/exercises/{exerciseId}")
    @PreAuthorize("@gymAccessChecker.isMember(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<ExerciseProgressDto>> getExerciseProgress(
            @PathVariable Long gymId,
            @PathVariable Long assignmentId,
            @PathVariable Long exerciseId) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.ok(historyService.getExerciseProgress(gymId, userId, assignmentId, exerciseId)));
    }
}
