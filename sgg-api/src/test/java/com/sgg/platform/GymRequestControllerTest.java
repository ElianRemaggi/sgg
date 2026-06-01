package com.sgg.platform;

import com.sgg.common.BaseIntegrationTest;
import com.sgg.platform.entity.GymRequest;
import com.sgg.platform.repository.GymRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Transactional
class GymRequestControllerTest extends BaseIntegrationTest {

    @Autowired
    private GymRequestRepository gymRequestRepository;

    @BeforeEach
    void setUp() {
        gymRequestRepository.deleteAll();
    }

    // ─── POST /api/public/gym-requests ───────────────────────────────────────

    @Test
    void submit_validRequest_returns201() throws Exception {
        String body = """
            {
              "gymName": "CrossFit Norte",
              "contactName": "Juan Pérez",
              "email": "juan@crossfit.com",
              "phone": "+5491155550000",
              "message": "Tenemos 80 socios y queremos digitalizar la gestión."
            }
            """;

        mockMvc.perform(post("/api/public/gym-requests")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.gymName").value("CrossFit Norte"))
            .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    void submit_withoutMessage_returns201() throws Exception {
        String body = """
            {
              "gymName": "Box Centro",
              "contactName": "María López",
              "email": "maria@box.com",
              "phone": "+5491166660000"
            }
            """;

        mockMvc.perform(post("/api/public/gym-requests")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    void submit_invalidEmail_returns400() throws Exception {
        String body = """
            {
              "gymName": "Gym X",
              "contactName": "Ana",
              "email": "no-es-un-email",
              "phone": "+54911"
            }
            """;

        mockMvc.perform(post("/api/public/gym-requests")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void submit_missingRequiredFields_returns400() throws Exception {
        String body = """
            {
              "gymName": "Gym Sin Email"
            }
            """;

        mockMvc.perform(post("/api/public/gym-requests")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isBadRequest());
    }

    // ─── GET /api/platform/gym-requests ──────────────────────────────────────

    @Test
    void list_asSuperAdmin_returns200WithAllRequests() throws Exception {
        createRequest("Gym A", "PENDING");
        createRequest("Gym B", "CONTACTED");

        mockMvc.perform(get("/api/platform/gym-requests")
                .with(superAdminJwt()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.totalElements").value(2));
    }

    @Test
    void list_withStatusFilter_returnsOnlyMatching() throws Exception {
        createRequest("Gym A", "PENDING");
        createRequest("Gym B", "CONTACTED");
        createRequest("Gym C", "PENDING");

        mockMvc.perform(get("/api/platform/gym-requests")
                .param("status", "PENDING")
                .with(superAdminJwt()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.totalElements").value(2));
    }

    @Test
    void list_withoutJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/platform/gym-requests"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void list_withRegularJwt_returns403() throws Exception {
        mockMvc.perform(get("/api/platform/gym-requests")
                .with(regularJwt()))
            .andExpect(status().isForbidden());
    }

    // ─── PATCH /api/platform/gym-requests/{id}/status ────────────────────────

    @Test
    void updateStatus_validTransition_returns200() throws Exception {
        GymRequest saved = createRequest("Gym X", "PENDING");

        mockMvc.perform(patch("/api/platform/gym-requests/{id}/status", saved.getId())
                .with(superAdminJwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\": \"CONTACTED\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("CONTACTED"));
    }

    @Test
    void updateStatus_invalidStatus_returns400() throws Exception {
        GymRequest saved = createRequest("Gym Y", "PENDING");

        mockMvc.perform(patch("/api/platform/gym-requests/{id}/status", saved.getId())
                .with(superAdminJwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\": \"INVALIDO\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void updateStatus_notFound_returns404() throws Exception {
        mockMvc.perform(patch("/api/platform/gym-requests/{id}/status", 99999L)
                .with(superAdminJwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\": \"CONTACTED\"}"))
            .andExpect(status().isNotFound());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private GymRequest createRequest(String gymName, String status) {
        GymRequest r = new GymRequest();
        r.setGymName(gymName);
        r.setContactName("Contacto Test");
        r.setEmail("test@gym.com");
        r.setPhone("+5491100000000");
        r.setStatus(status);
        return gymRequestRepository.save(r);
    }

    private SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor superAdminJwt() {
        return SecurityMockMvcRequestPostProcessors.jwt()
            .jwt(jwt -> jwt.subject("sa-uid-001"))
            .authorities(new SimpleGrantedAuthority("ROLE_SUPERADMIN"));
    }

    private SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor regularJwt() {
        return SecurityMockMvcRequestPostProcessors.jwt()
            .jwt(jwt -> jwt.subject("user-uid-001"));
    }
}
