package com.sgg.identity;

import com.sgg.common.BaseIntegrationTest;
import com.sgg.identity.dto.SyncUserRequest;
import com.sgg.identity.entity.User;
import com.sgg.identity.repository.AuthIdentityRepository;
import com.sgg.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Transactional
class AuthSyncControllerTest extends BaseIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthIdentityRepository authIdentityRepository;

    @BeforeEach
    void setUp() {
        authIdentityRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void sync_newUser_createsUserAndAuthIdentity() throws Exception {
        SyncUserRequest request = new SyncUserRequest(
            "supabase-uid-123", "test@email.com", "Juan Pérez",
            "https://avatar.com/photo.jpg", "google", "google-uid-123"
        );

        mockMvc.perform(post("/api/auth/sync")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("supabase-uid-123")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.email").value("test@email.com"))
            .andExpect(jsonPath("$.data.fullName").value("Juan Pérez"))
            .andExpect(jsonPath("$.data.platformRole").value("USER"));

        assertThat(userRepository.findBySupabaseUid("supabase-uid-123")).isPresent();
        assertThat(authIdentityRepository.existsByProviderAndProviderUid("google", "google-uid-123")).isTrue();
    }

    @Test
    void sync_existingUser_updatesNameAndAvatar() throws Exception {
        // Create existing user
        User existing = new User();
        existing.setSupabaseUid("supabase-uid-123");
        existing.setEmail("test@email.com");
        existing.setFullName("Nombre Viejo");
        existing.setAvatarUrl("https://old-avatar.com/photo.jpg");
        userRepository.save(existing);

        SyncUserRequest request = new SyncUserRequest(
            "supabase-uid-123", "test@email.com", "Nombre Nuevo",
            "https://new-avatar.com/photo.jpg", "google", "google-uid-123"
        );

        mockMvc.perform(post("/api/auth/sync")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("supabase-uid-123")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.fullName").value("Nombre Nuevo"))
            .andExpect(jsonPath("$.data.avatarUrl").value("https://new-avatar.com/photo.jpg"));

        assertThat(userRepository.count()).isEqualTo(1);
    }

    @Test
    void sync_withoutJwt_returns401() throws Exception {
        SyncUserRequest request = new SyncUserRequest(
            "supabase-uid-123", "test@email.com", "Juan Pérez",
            null, "google", "google-uid-123"
        );

        mockMvc.perform(post("/api/auth/sync")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void sync_invalidBody_returns400() throws Exception {
        SyncUserRequest request = new SyncUserRequest(
            "supabase-uid-123", "", "Juan Pérez",
            null, "google", "google-uid-123"
        );

        mockMvc.perform(post("/api/auth/sync")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("supabase-uid-123")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void sync_sameProviderTwice_doesNotDuplicateAuthIdentity() throws Exception {
        SyncUserRequest request = new SyncUserRequest(
            "supabase-uid-123", "test@email.com", "Juan Pérez",
            null, "google", "google-uid-123"
        );

        // First sync
        mockMvc.perform(post("/api/auth/sync")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("supabase-uid-123")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk());

        // Second sync
        mockMvc.perform(post("/api/auth/sync")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("supabase-uid-123")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk());

        assertThat(authIdentityRepository.count()).isEqualTo(1);
    }
}
