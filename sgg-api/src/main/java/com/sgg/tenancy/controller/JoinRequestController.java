package com.sgg.tenancy.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.common.security.SecurityUtils;
import com.sgg.tenancy.dto.JoinRequestResponse;
import com.sgg.tenancy.service.GymMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/gyms/{gymId}")
@RequiredArgsConstructor
public class JoinRequestController {

    private final GymMemberService gymMemberService;
    private final SecurityUtils securityUtils;

    @PostMapping("/join-request")
    public ResponseEntity<ApiResponse<JoinRequestResponse>> joinRequest(@PathVariable Long gymId) {
        Long userId = securityUtils.getCurrentUserId();
        JoinRequestResponse response = gymMemberService.requestJoin(gymId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response));
    }
}
