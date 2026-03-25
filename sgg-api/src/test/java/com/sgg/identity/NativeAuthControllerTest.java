package com.sgg.identity;

import com.sgg.common.BaseIntegrationTest;
import com.sgg.common.config.NativeJwtConfig;
import com.sgg.identity.dto.LoginRequest;
import com.sgg.identity.dto.RegisterRequest;
import com.sgg.identity.entity.User;
import com.sgg.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Transactional
class NativeAuthControllerTest extends BaseIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private NativeJwtConfig nativeJwtConfig;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void register_ok_createsUserAndReturnsToken() throws Exception {
        RegisterRequest request = new RegisterRequest("test@email.com", "Juan Pérez", "password123");

        mockMvc.perform(post("/api/public/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.token").isNotEmpty())
            .andExpect(jsonPath("$.data.user.email").value("test@email.com"))
            .andExpect(jsonPath("$.data.user.fullName").value("Juan Pérez"))
            .andExpect(jsonPath("$.data.user.platformRole").value("USER"));

        User saved = userRepository.findByEmail("test@email.com").orElseThrow();
        assertThat(saved.getPasswordHash()).isNotNull();
        assertThat(saved.getSupabaseUid()).isNull();
        assertThat(passwordEncoder.matches("password123", saved.getPasswordHash())).isTrue();
    }

    @Test
    void register_duplicateEmail_returns409() throws Exception {
        User existing = new User();
        existing.setEmail("test@email.com");
        existing.setFullName("Existente");
        existing.setPasswordHash(passwordEncoder.encode("pass"));
        userRepository.save(existing);

        RegisterRequest request = new RegisterRequest("test@email.com", "Otro", "password123");

        mockMvc.perform(post("/api/public/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("Ya existe una cuenta con ese email"));
    }

    @Test
    void register_invalidBody_returns400() throws Exception {
        RegisterRequest request = new RegisterRequest("not-an-email", "", "12");

        mockMvc.perform(post("/api/public/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void login_ok_returnsToken() throws Exception {
        User user = new User();
        user.setEmail("test@email.com");
        user.setFullName("Juan Pérez");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        userRepository.save(user);

        LoginRequest request = new LoginRequest("test@email.com", "password123");

        mockMvc.perform(post("/api/public/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.token").isNotEmpty())
            .andExpect(jsonPath("$.data.user.email").value("test@email.com"));
    }

    @Test
    void login_wrongPassword_returns409() throws Exception {
        User user = new User();
        user.setEmail("test@email.com");
        user.setFullName("Juan Pérez");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        userRepository.save(user);

        LoginRequest request = new LoginRequest("test@email.com", "wrongpassword");

        mockMvc.perform(post("/api/public/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Email o contraseña incorrectos"));
    }

    @Test
    void login_emailNotFound_returns409() throws Exception {
        LoginRequest request = new LoginRequest("noexiste@email.com", "password123");

        mockMvc.perform(post("/api/public/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Email o contraseña incorrectos"));
    }

    @Test
    void login_googleUser_returns409() throws Exception {
        User user = new User();
        user.setEmail("google@email.com");
        user.setFullName("Google User");
        user.setSupabaseUid("supabase-uid-google");
        userRepository.save(user);

        LoginRequest request = new LoginRequest("google@email.com", "anypassword");

        mockMvc.perform(post("/api/public/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Esta cuenta usa Google para ingresar"));
    }

    @Test
    void protectedEndpoint_withNativeToken_works() throws Exception {
        User user = new User();
        user.setEmail("test@email.com");
        user.setFullName("Juan Pérez");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user = userRepository.save(user);

        String token = nativeJwtConfig.generateToken(user);

        mockMvc.perform(get("/api/users/me")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.email").value("test@email.com"));
    }
}
