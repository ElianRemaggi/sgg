package com.sgg.tenancy.service;

import com.sgg.tenancy.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface GymMemberService {

    JoinRequestResponse requestJoin(Long gymId, Long userId);

    Page<GymMemberDto> listMembers(Long gymId, String status, String role, Pageable pageable);

    void approveMember(Long gymId, Long memberId);

    void rejectMember(Long gymId, Long memberId);

    void blockMember(Long gymId, Long memberId);

    void setExpiry(Long gymId, Long memberId, SetExpiryRequest request);

    void changeRole(Long gymId, Long memberId, Long requestingUserId, UpdateMemberRoleRequest request);

    List<MembershipDto> getUserMemberships(Long userId);
}
