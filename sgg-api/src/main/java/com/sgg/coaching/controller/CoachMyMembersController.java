package com.sgg.coaching.controller;

import com.sgg.coaching.dto.AssignedMemberDto;
import com.sgg.coaching.service.CoachAssignmentService;
import com.sgg.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gyms/{gymId}/coach")
@RequiredArgsConstructor
public class CoachMyMembersController {

    private final CoachAssignmentService coachAssignmentService;

    @GetMapping("/my-members")
    @PreAuthorize("@gymAccessChecker.isCoach(#gymId)")
    public ResponseEntity<ApiResponse<List<AssignedMemberDto>>> getMyMembers(
            @PathVariable Long gymId) {
        return ResponseEntity.ok(ApiResponse.ok(coachAssignmentService.getMyMembers(gymId)));
    }
}
