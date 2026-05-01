package com.sgg.tenancy.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.common.dto.PageResponse;
import com.sgg.common.security.SecurityUtils;
import com.sgg.tenancy.dto.*;
import com.sgg.tenancy.service.GymMemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/gyms/{gymId}/admin/members")
@RequiredArgsConstructor
public class AdminMembersController {

    private final GymMemberService gymMemberService;
    private final SecurityUtils securityUtils;

    @GetMapping
    @PreAuthorize("@gymAccessChecker.isAdmin(#gymId) or @gymAccessChecker.isCoach(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<GymMemberDto>>> listMembers(
            @PathVariable Long gymId,
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "ALL") String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<GymMemberDto> members = gymMemberService.listMembers(gymId, status, role, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.from(members)));
    }

    @PutMapping("/{memberId}/approve")
    @PreAuthorize("@gymAccessChecker.isAdmin(#gymId) or @gymAccessChecker.isCoach(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable Long gymId, @PathVariable Long memberId) {
        gymMemberService.approveMember(gymId, memberId);
        return ResponseEntity.ok(ApiResponse.noContent());
    }

    @PutMapping("/{memberId}/reject")
    @PreAuthorize("@gymAccessChecker.isAdmin(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable Long gymId, @PathVariable Long memberId) {
        gymMemberService.rejectMember(gymId, memberId);
        return ResponseEntity.ok(ApiResponse.noContent());
    }

    @PutMapping("/{memberId}/block")
    @PreAuthorize("@gymAccessChecker.isAdmin(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<Void>> block(
            @PathVariable Long gymId, @PathVariable Long memberId) {
        gymMemberService.blockMember(gymId, memberId);
        return ResponseEntity.ok(ApiResponse.noContent());
    }

    @PutMapping("/{memberId}/expiry")
    @PreAuthorize("@gymAccessChecker.isAdmin(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<Void>> setExpiry(
            @PathVariable Long gymId, @PathVariable Long memberId,
            @Valid @RequestBody SetExpiryRequest request) {
        gymMemberService.setExpiry(gymId, memberId, request);
        return ResponseEntity.ok(ApiResponse.noContent());
    }

    @PatchMapping("/{memberId}/role")
    @PreAuthorize("@gymAccessChecker.isAdmin(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<Void>> changeRole(
            @PathVariable Long gymId, @PathVariable Long memberId,
            @Valid @RequestBody UpdateMemberRoleRequest request) {
        Long requestingUserId = securityUtils.getCurrentUserId();
        gymMemberService.changeRole(gymId, memberId, requestingUserId, request);
        return ResponseEntity.ok(ApiResponse.noContent());
    }
}
