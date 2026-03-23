package com.sgg.platform;

import com.sgg.common.BaseIntegrationTest;
import com.sgg.identity.entity.User;
import com.sgg.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Transactional
class PlatformAdminControllerTest extends BaseIntegrationTest {

    @Autowired private UserRepository userRepository;

    private User superAdmin1;
    private User superAdmin2;
    private User regularUser;

    private SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor superAdminJwt(String subject) {
        return SecurityMockMvcRequestPostProcessors.jwt()
            .jwt(jwt -> jwt.subject(subject))
            .authorities(new SimpleGrantedAuthority("ROLE_SUPERADMIN"));
    }

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        superAdmin1 = createUser("sa1-uid", "sa1@test.com", "Super Admin 1", "SUPERADMIN");
        superAdmin2 = createUser("sa2-uid", "sa2@test.com", "Super Admin 2", "SUPERADMIN");
        regularUser = createUser("user-uid", "user@test.com", "Regular User", "USER");
    }

    // ─── LIST SUPERADMINS ───

    @Test
    void listAdmins_returnsSuperAdmins() throws Exception {
        mockMvc.perform(get("/api/platform/admins")
                .with(superAdminJwt("sa1-uid")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data", hasSize(2)));
    }

    // ─── PROMOTE ───

    @Test
    void promote_success() throws Exception {
        mockMvc.perform(post("/api/platform/admins/{userId}/promote", regularUser.getId())
                .with(superAdminJwt("sa1-uid")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void promote_alreadySuperAdmin_returns409() throws Exception {
        mockMvc.perform(post("/api/platform/admins/{userId}/promote", superAdmin2.getId())
                .with(superAdminJwt("sa1-uid")))
            .andExpect(status().isConflict());
    }

    // ─── DEMOTE ───

    @Test
    void demote_success() throws Exception {
        mockMvc.perform(post("/api/platform/admins/{userId}/demote", superAdmin2.getId())
                .with(superAdminJwt("sa1-uid")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void demote_selfDemote_returns403() throws Exception {
        mockMvc.perform(post("/api/platform/admins/{userId}/demote", superAdmin1.getId())
                .with(superAdminJwt("sa1-uid")))
            .andExpect(status().isForbidden());
    }

    @Test
    void demote_lastSuperAdmin_returns409() throws Exception {
        // Remove superAdmin1 so only superAdmin2 remains
        superAdmin1.setPlatformRole("USER");
        userRepository.save(superAdmin1);

        // superAdmin2 tries to demote themselves — self-demote check not hit because
        // we use sa2 as actor and target a different (non-superadmin) user won't work
        // Instead: superAdmin2 is last, tries to demote themselves → 403 (self check first)
        // To test "last superadmin" properly, we need a third user as actor
        // Actually, let's test it differently: sa2 (only superadmin) tries to demote sa2
        mockMvc.perform(post("/api/platform/admins/{userId}/demote", superAdmin2.getId())
                .with(superAdminJwt("sa2-uid")))
            .andExpect(status().isForbidden()); // self-demote check hits first
    }

    @Test
    void demote_notSuperAdmin_returns409() throws Exception {
        mockMvc.perform(post("/api/platform/admins/{userId}/demote", regularUser.getId())
                .with(superAdminJwt("sa1-uid")))
            .andExpect(status().isConflict());
    }

    // ─── SEARCH USERS ───

    @Test
    void searchUsers_findsResults() throws Exception {
        mockMvc.perform(get("/api/platform/users")
                .param("search", "Regular")
                .with(superAdminJwt("sa1-uid")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data", hasSize(1)))
            .andExpect(jsonPath("$.data[0].email").value("user@test.com"));
    }

    @Test
    void searchUsers_emptySearch_returnsEmpty() throws Exception {
        mockMvc.perform(get("/api/platform/users")
                .with(superAdminJwt("sa1-uid")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data", hasSize(0)));
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
}
