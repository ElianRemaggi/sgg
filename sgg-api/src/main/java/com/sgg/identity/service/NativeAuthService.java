package com.sgg.identity.service;

import com.sgg.common.config.NativeJwtConfig;
import com.sgg.common.exception.BusinessException;
import com.sgg.identity.dto.AuthResponse;
import com.sgg.identity.dto.LoginRequest;
import com.sgg.identity.dto.RegisterRequest;
import com.sgg.identity.dto.UserDto;
import com.sgg.identity.entity.User;
import com.sgg.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NativeAuthService {

    private static final Logger log = LoggerFactory.getLogger(NativeAuthService.class);

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final NativeJwtConfig nativeJwtConfig;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new BusinessException("Ya existe una cuenta con ese email");
        }

        User user = new User();
        user.setEmail(request.email());
        user.setFullName(request.fullName());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user = userRepository.save(user);

        log.info("Usuario registrado nativamente: {}", user.getEmail());

        String token = nativeJwtConfig.generateToken(user);
        return new AuthResponse(token, toDto(user));
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new BusinessException("Email o contraseña incorrectos"));

        if (user.getPasswordHash() == null) {
            throw new BusinessException("Esta cuenta usa Google para ingresar");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessException("Email o contraseña incorrectos");
        }

        log.info("Login nativo exitoso: {}", user.getEmail());

        String token = nativeJwtConfig.generateToken(user);
        return new AuthResponse(token, toDto(user));
    }

    private UserDto toDto(User user) {
        return new UserDto(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getAvatarUrl(),
            user.getPlatformRole()
        );
    }
}
