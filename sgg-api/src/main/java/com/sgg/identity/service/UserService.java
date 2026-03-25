package com.sgg.identity.service;

import com.sgg.identity.dto.SyncUserRequest;
import com.sgg.identity.dto.UpdateProfileRequest;
import com.sgg.identity.dto.UserDto;

public interface UserService {

    UserDto syncUser(SyncUserRequest request);

    UserDto getProfile(Long userId);

    UserDto updateProfile(Long userId, UpdateProfileRequest request);
}
