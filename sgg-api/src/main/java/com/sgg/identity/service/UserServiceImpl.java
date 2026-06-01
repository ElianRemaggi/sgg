package com.sgg.identity.service;

import com.sgg.common.exception.ResourceNotFoundException;
import com.sgg.identity.dto.SyncUserRequest;
import com.sgg.identity.dto.UpdateProfileRequest;
import com.sgg.identity.dto.UserDto;
import com.sgg.identity.entity.AuthIdentity;
import com.sgg.identity.entity.User;
import com.sgg.identity.mapper.UserMapper;
import com.sgg.identity.repository.AuthIdentityRepository;
import com.sgg.identity.repository.UserRepository;
import com.sgg.tenancy.entity.GymMember;
import com.sgg.tenancy.repository.GymMemberRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);

    private final UserRepository userRepository;
    private final AuthIdentityRepository authIdentityRepository;
    private final GymMemberRepository gymMemberRepository;
    private final UserMapper userMapper;
    private final UsernameGenerator usernameGenerator;

    @Override
    public UserDto syncUser(SyncUserRequest request) {
        User user = userRepository.findBySupabaseUidAndDeletedAtIsNull(request.supabaseUid())
            .map(existing -> {
                boolean changed = false;
                if (!existing.getFullName().equals(request.fullName())) {
                    existing.setFullName(request.fullName());
                    changed = true;
                }
                if (request.avatarUrl() != null && !request.avatarUrl().equals(existing.getAvatarUrl())) {
                    existing.setAvatarUrl(request.avatarUrl());
                    changed = true;
                }
                if (changed) {
                    log.info("Usuario actualizado: supabaseUid={}", request.supabaseUid());
                }
                return existing;
            })
            .orElseGet(() -> {
                User newUser = new User();
                newUser.setSupabaseUid(request.supabaseUid());
                newUser.setEmail(request.email());
                newUser.setFullName(request.fullName());
                newUser.setAvatarUrl(request.avatarUrl());
                newUser.setUsername(usernameGenerator.generateFromEmail(request.email()));
                newUser = userRepository.save(newUser);
                log.info("Usuario creado: id={}, email={}", newUser.getId(), newUser.getEmail());
                return newUser;
            });

        user = userRepository.save(user);

        if (!authIdentityRepository.existsByProviderAndProviderUid(request.provider(), request.providerUid())) {
            AuthIdentity identity = new AuthIdentity();
            identity.setUser(user);
            identity.setProvider(request.provider());
            identity.setProviderUid(request.providerUid());
            authIdentityRepository.save(identity);
            log.info("AuthIdentity creada: provider={}, userId={}", request.provider(), user.getId());
        }

        return userMapper.toDto(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        return userMapper.toDto(user);
    }

    @Override
    public UserDto updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        user.setFullName(request.fullName());
        user.setAvatarUrl(request.avatarUrl());
        user = userRepository.save(user);

        log.info("Perfil actualizado: userId={}", user.getId());
        return userMapper.toDto(user);
    }

    @Override
    public void deleteCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        if (user.getDeletedAt() != null) {
            return;
        }

        List<GymMember> memberships = gymMemberRepository.findByUserId(userId);
        for (GymMember m : memberships) {
            if ("ACTIVE".equals(m.getStatus()) || "PENDING".equals(m.getStatus())) {
                m.setStatus("INACTIVE");
            }
        }
        gymMemberRepository.saveAll(memberships);

        authIdentityRepository.deleteByUser_Id(userId);

        long epochMillis = System.currentTimeMillis();
        user.setEmail("deleted_" + userId + "_" + epochMillis + "@deleted.sgg");
        user.setUsername("deleted_" + userId + "_" + epochMillis);
        user.setFullName("Cuenta eliminada");
        user.setAvatarUrl(null);
        user.setSupabaseUid(null);
        user.setPasswordHash(null);
        user.setDeletedAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("Cuenta eliminada (soft): userId={}", userId);
    }
}
