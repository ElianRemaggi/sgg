package com.sgg.platform;

import com.sgg.common.BaseIntegrationTest;
import com.sgg.identity.entity.User;
import com.sgg.identity.repository.UserRepository;
import com.sgg.tenancy.entity.Gym;
import com.sgg.tenancy.entity.GymMember;
import com.sgg.tenancy.repository.GymMemberRepository;
import com.sgg.tenancy.repository.GymRepository;
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
class PlatformGymControllerTest extends BaseIntegrationTest {

    @Autowired private GymRepository gymRepository;
    @Autowired private GymMemberRepository gymMemberRepository;
    @Autowired private UserRepository userRepository;

    private User superAdmin;
    private User regularUser;
    private Gym activeGym;
    private Gym suspendedGym;

    private SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor superAdminJwt() {
        return SecurityMockMvcRequestPostProcessors.jwt()
            .jwt(jwt -> jwt.subject("sa-uid-001"))
            .authorities(new SimpleGrantedAuthority("ROLE_SUPERADMIN"));
    }

    private SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor regularJwt() {
        return SecurityMockMvcRequestPostProcessors.jwt()
            .jwt(jwt -> jwt.subject("user-uid-001"));
    }

    @BeforeEach
    void setUp() {
        gymMemberRepository.deleteAll();
        gymRepository.deleteAll();
        userRepository.deleteAll();

        superAdmin = createUser("sa-uid-001", "superadmin@test.com", "Super Admin", "SUPERADMIN");
        regularUser = createUser("user-uid-001", "user@test.com", "Regular User", "USER");

        activeGym = createGym("CrossFit Norte", "crossfit-norte", superAdmin.getId(), "ACTIVE");
        suspendedGym = createGym("Gym Suspendido", "gym-suspendido", superAdmin.getId(), "SUSPENDED");

        createMembership(activeGym.getId(), regularUser.getId(), "MEMBER", "ACTIVE");
    }

    // ─── LIST GYMS ───

    @Test
    void listGyms_asSuperAdmin_returns200() throws Exception {
        mockMvc.perform(get("/api/platform/gyms").with(superAdminJwt()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.totalElements").value(2));
    }

    @Test
    void listGyms_filterByStatus_works() throws Exception {
        mockMvc.perform(get("/api/platform/gyms")
                .param("status", "SUSPENDED")
                .with(superAdminJwt()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.totalElements").value(1))
            .andExpect(jsonPath("$.data.content[0].slug").value("gym-suspendido"));
    }

    @Test
    void listGyms_asRegularUser_returns403() throws Exception {
        mockMvc.perform(get("/api/platform/gyms").with(regularJwt()))
            .andExpect(status().isForbidden());
    }

    @Test
    void listGyms_withoutJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/platform/gyms"))
            .andExpect(status().isUnauthorized());
    }

    // ─── CREATE GYM ───

    @Test
    void createGym_success_returns201() throws Exception {
        String body = """
            {
                "name": "Iron Gym",
                "slug": "iron-gym",
                "description": "Un gym de fierro",
                "routineCycle": "WEEKLY",
                "ownerUserId": %d
            }
            """.formatted(regularUser.getId());

        mockMvc.perform(post("/api/platform/gyms")
                .with(superAdminJwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.name").value("Iron Gym"))
            .andExpect(jsonPath("$.data.slug").value("iron-gym"))
            .andExpect(jsonPath("$.data.owner.id").value(regularUser.getId()));
    }

    @Test
    void createGym_createsOwnerAsMember() throws Exception {
        String body = """
            {
                "name": "New Gym",
                "slug": "new-gym",
                "routineCycle": "MONTHLY",
                "ownerUserId": %d
            }
            """.formatted(regularUser.getId());

        mockMvc.perform(post("/api/platform/gyms")
                .with(superAdminJwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isCreated());

        Gym newGym = gymRepository.findBySlugAndStatus("new-gym", "ACTIVE").orElseThrow();
        GymMember ownerMember = gymMemberRepository.findByGymIdAndUserIdAndStatus(
            newGym.getId(), regularUser.getId(), "ACTIVE").orElseThrow();
        assert ownerMember.getRole().equals("ADMIN");
    }

    @Test
    void createGym_duplicateSlug_returns409() throws Exception {
        String body = """
            {
                "name": "Otro Gym",
                "slug": "crossfit-norte",
                "routineCycle": "WEEKLY",
                "ownerUserId": %d
            }
            """.formatted(regularUser.getId());

        mockMvc.perform(post("/api/platform/gyms")
                .with(superAdminJwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isConflict());
    }

    @Test
    void createGym_invalidSlug_returns400() throws Exception {
        String body = """
            {
                "name": "Bad Slug Gym",
                "slug": "Invalid Slug!",
                "routineCycle": "WEEKLY",
                "ownerUserId": %d
            }
            """.formatted(regularUser.getId());

        mockMvc.perform(post("/api/platform/gyms")
                .with(superAdminJwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isBadRequest());
    }

    @Test
    void createGym_ownerNotFound_returns404() throws Exception {
        String body = """
            {
                "name": "Orphan Gym",
                "slug": "orphan-gym",
                "routineCycle": "WEEKLY",
                "ownerUserId": 99999
            }
            """;

        mockMvc.perform(post("/api/platform/gyms")
                .with(superAdminJwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isNotFound());
    }

    // ─── GET GYM DETAIL ───

    @Test
    void getGymDetail_returnsDetailWithStats() throws Exception {
        mockMvc.perform(get("/api/platform/gyms/{gymId}", activeGym.getId())
                .with(superAdminJwt()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.name").value("CrossFit Norte"))
            .andExpect(jsonPath("$.data.owner.fullName").value("Super Admin"))
            .andExpect(jsonPath("$.data.stats.activeMembers").value(1));
    }

    // ─── UPDATE GYM ───

    @Test
    void updateGym_success() throws Exception {
        String body = """
            {
                "name": "CrossFit Norte Updated",
                "slug": "crossfit-norte",
                "description": "Updated desc",
                "routineCycle": "MONTHLY"
            }
            """;

        mockMvc.perform(put("/api/platform/gyms/{gymId}", activeGym.getId())
                .with(superAdminJwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.name").value("CrossFit Norte Updated"))
            .andExpect(jsonPath("$.data.routineCycle").value("MONTHLY"));
    }

    @Test
    void updateGym_duplicateSlugOfOtherGym_returns409() throws Exception {
        String body = """
            {
                "name": "Renamed",
                "slug": "gym-suspendido",
                "routineCycle": "WEEKLY"
            }
            """;

        mockMvc.perform(put("/api/platform/gyms/{gymId}", activeGym.getId())
                .with(superAdminJwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isConflict());
    }

    // ─── CHANGE STATUS ───

    @Test
    void changeStatus_suspendActiveGym_returns200() throws Exception {
        mockMvc.perform(patch("/api/platform/gyms/{gymId}/status", activeGym.getId())
                .with(superAdminJwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\": \"SUSPENDED\"}"))
            .andExpect(status().isOk());
    }

    @Test
    void changeStatus_suspendAlreadySuspended_returns409() throws Exception {
        mockMvc.perform(patch("/api/platform/gyms/{gymId}/status", suspendedGym.getId())
                .with(superAdminJwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\": \"SUSPENDED\"}"))
            .andExpect(status().isConflict());
    }

    @Test
    void changeStatus_activateSuspended_returns200() throws Exception {
        mockMvc.perform(patch("/api/platform/gyms/{gymId}/status", suspendedGym.getId())
                .with(superAdminJwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\": \"ACTIVE\"}"))
            .andExpect(status().isOk());
    }

    // ─── DELETE GYM ───

    @Test
    void deleteGym_noActiveMembers_softDeletes() throws Exception {
        Gym emptyGym = createGym("Empty Gym", "empty-gym", superAdmin.getId(), "ACTIVE");

        mockMvc.perform(delete("/api/platform/gyms/{gymId}", emptyGym.getId())
                .with(superAdminJwt()))
            .andExpect(status().isOk());
    }

    @Test
    void deleteGym_withActiveMembers_returns409() throws Exception {
        mockMvc.perform(delete("/api/platform/gyms/{gymId}", activeGym.getId())
                .with(superAdminJwt()))
            .andExpect(status().isConflict());
    }

    @Test
    void deleteGym_withForceFlag_softDeletes() throws Exception {
        mockMvc.perform(delete("/api/platform/gyms/{gymId}", activeGym.getId())
                .param("force", "true")
                .with(superAdminJwt()))
            .andExpect(status().isOk());
    }

    // ─── HELPERS ───

    private User createUser(String uid, String email, String name, String platformRole) {
        User user = new User();
        user.setSupabaseUid(uid);
        user.setEmail(email);
        user.setFullName(name);
        user.setPlatformRole(platformRole);
        return userRepository.save(user);
    }

    private Gym createGym(String name, String slug, Long ownerId, String status) {
        Gym g = new Gym();
        g.setName(name);
        g.setSlug(slug);
        g.setOwnerUserId(ownerId);
        g.setStatus(status);
        return gymRepository.save(g);
    }

    private GymMember createMembership(Long gymId, Long userId, String role, String status) {
        GymMember m = new GymMember();
        m.setGymId(gymId);
        m.setUserId(userId);
        m.setRole(role);
        m.setStatus(status);
        return gymMemberRepository.save(m);
    }
}
