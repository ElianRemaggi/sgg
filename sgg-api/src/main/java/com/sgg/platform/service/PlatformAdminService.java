package com.sgg.platform.service;

import com.sgg.platform.dto.SuperAdminDto;
import com.sgg.platform.dto.UserSearchDto;

import java.util.List;

public interface PlatformAdminService {

    List<SuperAdminDto> listSuperAdmins();

    void promoteToSuperAdmin(Long userId);

    void demoteSuperAdmin(Long userId, Long currentUserId);

    List<UserSearchDto> searchUsers(String search);
}
