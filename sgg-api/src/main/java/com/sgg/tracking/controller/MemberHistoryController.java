package com.sgg.tracking.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.common.dto.PageResponse;
import com.sgg.common.security.SecurityUtils;
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
@RequestMapping("/api/gyms/{gymId}/member/history")
@RequiredArgsConstructor
public class MemberHistoryController {

    private final RoutineHistoryService historyService;
    private final SecurityUtils securityUtils;

    @GetMapping("/assignments")
    @PreAuthorize("@gymAccessChecker.isMember(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<AssignmentHistorySummaryDto>>> getHistory(
            @PathVariable Long gymId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = securityUtils.getCurrentUserId();
        Page<AssignmentHistorySummaryDto> history =
                historyService.getMemberHistory(gymId, userId, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.from(history)));
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
