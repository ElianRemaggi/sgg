package com.sgg.tenancy.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.common.security.SecurityUtils;
import com.sgg.tenancy.dto.MembershipDto;
import com.sgg.tenancy.service.GymMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class MembershipController {

    private final GymMemberService gymMemberService;
    private final SecurityUtils securityUtils;

    @GetMapping("/memberships")
    public ResponseEntity<ApiResponse<List<MembershipDto>>> getMemberships() {
        Long userId = securityUtils.getCurrentUserId();
        List<MembershipDto> memberships = gymMemberService.getUserMemberships(userId);
        return ResponseEntity.ok(ApiResponse.ok(memberships));
    }
}
