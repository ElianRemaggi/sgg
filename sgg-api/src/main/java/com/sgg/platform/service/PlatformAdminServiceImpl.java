package com.sgg.platform.service;

import com.sgg.common.exception.AccessDeniedException;
import com.sgg.common.exception.BusinessException;
import com.sgg.common.exception.ResourceNotFoundException;
import com.sgg.identity.entity.User;
import com.sgg.identity.repository.UserRepository;
import com.sgg.platform.dto.SuperAdminDto;
import com.sgg.platform.dto.UserSearchDto;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PlatformAdminServiceImpl implements PlatformAdminService {

    private static final Logger log = LoggerFactory.getLogger(PlatformAdminServiceImpl.class);

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SuperAdminDto> listSuperAdmins() {
        return userRepository.findByPlatformRole("SUPERADMIN").stream()
            .map(u -> new SuperAdminDto(u.getId(), u.getFullName(), u.getEmail()))
            .toList();
    }

    @Override
    public void promoteToSuperAdmin(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        if ("SUPERADMIN".equals(user.getPlatformRole())) {
            throw new BusinessException("El usuario ya es SUPERADMIN");
        }

        user.setPlatformRole("SUPERADMIN");
        userRepository.save(user);

        log.info("Usuario promovido a SUPERADMIN: {} (id={})", user.getFullName(), user.getId());
    }

    @Override
    public void demoteSuperAdmin(Long userId, Long currentUserId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        if (!"SUPERADMIN".equals(user.getPlatformRole())) {
            throw new BusinessException("El usuario no es SUPERADMIN");
        }

        if (userId.equals(currentUserId)) {
            throw new AccessDeniedException("No podés quitarte el rol de SUPERADMIN a vos mismo");
        }

        long superAdminCount = userRepository.countByPlatformRole("SUPERADMIN");
        if (superAdminCount <= 1) {
            throw new BusinessException("No se puede quitar el último SUPERADMIN");
        }

        user.setPlatformRole("USER");
        userRepository.save(user);

        log.info("Usuario degradado de SUPERADMIN: {} (id={})", user.getFullName(), user.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSearchDto> searchUsers(String search) {
        if (search == null || search.isBlank()) {
            return List.of();
        }
        return userRepository.searchByNameOrEmail(search).stream()
            .map(u -> new UserSearchDto(u.getId(), u.getFullName(), u.getEmail()))
            .limit(20)
            .toList();
    }
}
