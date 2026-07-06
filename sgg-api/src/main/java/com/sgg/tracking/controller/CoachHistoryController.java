package com.sgg.tracking.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.common.dto.PageResponse;
import com.sgg.tracking.dto.AssignmentHistoryDetailDto;
import com.sgg.tracking.dto.AssignmentHistorySummaryDto;
import com.sgg.tracking.dto.ExerciseProgressDto;
import com.sgg.tracking.service.RoutineHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/gyms/{gymId}/coach/history")
@RequiredArgsConstructor
public class CoachHistoryController {

    private final RoutineHistoryService historyService;

    @GetMapping("/{memberId}/assignments")
    @PreAuthorize("@gymAccessChecker.isCoach(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<AssignmentHistorySummaryDto>>> getMemberHistory(
            @PathVariable Long gymId,
            @PathVariable Long memberId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<AssignmentHistorySummaryDto> history =
                historyService.getMemberHistory(gymId, memberId, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.from(history)));
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
