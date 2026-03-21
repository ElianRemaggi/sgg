package com.sgg.identity;

import com.sgg.common.BaseIntegrationTest;
import com.sgg.identity.dto.UpdateProfileRequest;
import com.sgg.identity.entity.User;
import com.sgg.identity.repository.AuthIdentityRepository;
import com.sgg.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Transactional
class UserControllerTest extends BaseIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthIdentityRepository authIdentityRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        authIdentityRepository.deleteAll();
        userRepository.deleteAll();

        testUser = new User();
        testUser.setSupabaseUid("test-uid-001");
        testUser.setEmail("usuario@test.com");
        testUser.setFullName("Usuario Test");
        testUser.setAvatarUrl("https://avatar.com/test.jpg");
        testUser = userRepository.save(testUser);
    }

    @Test
    void getMe_returnsAuthenticatedUserProfile() throws Exception {
        mockMvc.perform(get("/api/users/me")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("test-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.email").value("usuario@test.com"))
            .andExpect(jsonPath("$.data.fullName").value("Usuario Test"))
            .andExpect(jsonPath("$.data.platformRole").value("USER"));
    }

    @Test
    void getMe_withoutJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/users/me"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void updateProfile_updatesFullNameAndAvatar() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest(
            "Nombre Actualizado", "https://avatar.com/new.jpg"
        );

        mockMvc.perform(put("/api/users/me")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("test-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.fullName").value("Nombre Actualizado"))
            .andExpect(jsonPath("$.data.avatarUrl").value("https://avatar.com/new.jpg"));
    }

    @Test
    void updateProfile_blankFullName_returns400() throws Exception {
        String json = """
            {"fullName": "", "avatarUrl": null}
            """;

        mockMvc.perform(put("/api/users/me")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("test-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void updateProfile_invalidAvatarUrl_returns400() throws Exception {
        String json = """
            {"fullName": "Valid Name", "avatarUrl": "not-a-url"}
            """;

        mockMvc.perform(put("/api/users/me")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("test-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));
    }
}
