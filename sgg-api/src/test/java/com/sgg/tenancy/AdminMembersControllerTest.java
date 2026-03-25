package com.sgg.tenancy;

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
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Transactional
class AdminMembersControllerTest extends BaseIntegrationTest {

    @Autowired
    private GymRepository gymRepository;

    @Autowired
    private GymMemberRepository gymMemberRepository;

    @Autowired
    private UserRepository userRepository;

    private User admin;
    private User coach;
    private User memberUser;
    private Gym gym;
    private Gym otherGym;
    private GymMember adminMember;
    private GymMember pendingMember;

    @BeforeEach
    void setUp() {
        gymMemberRepository.deleteAll();
        gymRepository.deleteAll();
        userRepository.deleteAll();

        // Users
        admin = createUser("admin-uid-001", "admin@test.com", "Admin User");
        coach = createUser("coach-uid-001", "coach@test.com", "Coach User");
        memberUser = createUser("member-uid-001", "member@test.com", "Member User");

        // Gyms
        gym = createGym("CrossFit Norte", "crossfit-norte", admin.getId());
        otherGym = createGym("Otro Gym", "otro-gym", admin.getId());

        // Admin membership
        adminMember = createMembership(gym.getId(), admin.getId(), "ADMIN", "ACTIVE");

        // Coach membership
        createMembership(gym.getId(), coach.getId(), "COACH", "ACTIVE");

        // Pending member
        pendingMember = createMembership(gym.getId(), memberUser.getId(), "MEMBER", "PENDING");
    }

    @Test
    void listMembers_asAdmin_returns200() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/admin/members", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("admin-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.content").isArray())
            .andExpect(jsonPath("$.data.totalElements").value(3));
    }

    @Test
    void listMembers_otherGym_returns403() throws Exception {
        // Admin of gym tries to list members of otherGym (no membership there)
        mockMvc.perform(get("/api/gyms/{gymId}/admin/members", otherGym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("admin-uid-001"))))
            .andExpect(status().isForbidden());
    }

    @Test
    void listMembers_asCoach_returns200() throws Exception {
        // Coaches can list members (needed for routine assignment page)
        mockMvc.perform(get("/api/gyms/{gymId}/admin/members", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("coach-uid-001"))))
            .andExpect(status().isOk());
    }

    @Test
    void listMembers_withoutJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/admin/members", gym.getId()))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void listMembers_pagination_works() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/admin/members", gym.getId())
                .param("page", "0")
                .param("size", "2")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("admin-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.size").value(2))
            .andExpect(jsonPath("$.data.totalElements").value(3))
            .andExpect(jsonPath("$.data.totalPages").value(2));
    }

    @Test
    void listMembers_filterByStatus_works() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/admin/members", gym.getId())
                .param("status", "PENDING")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("admin-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.totalElements").value(1))
            .andExpect(jsonPath("$.data.content[0].status").value("PENDING"));
    }

    @Test
    void approve_changesMemberToActive() throws Exception {
        mockMvc.perform(put("/api/gyms/{gymId}/admin/members/{memberId}/approve", gym.getId(), pendingMember.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("admin-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void reject_changesPendingToRejected() throws Exception {
        mockMvc.perform(put("/api/gyms/{gymId}/admin/members/{memberId}/reject", gym.getId(), pendingMember.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("admin-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void block_changesMemberToBlocked() throws Exception {
        GymMember activeMember = createMembership(gym.getId(), createUser("block-uid", "block@test.com", "Block Me").getId(), "MEMBER", "ACTIVE");

        mockMvc.perform(put("/api/gyms/{gymId}/admin/members/{memberId}/block", gym.getId(), activeMember.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("admin-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void block_owner_returns403() throws Exception {
        mockMvc.perform(put("/api/gyms/{gymId}/admin/members/{memberId}/block", gym.getId(), adminMember.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("admin-uid-001"))))
            .andExpect(status().isForbidden());
    }

    @Test
    void changeRole_success() throws Exception {
        GymMember target = createMembership(gym.getId(), createUser("role-uid", "role@test.com", "Role User").getId(), "MEMBER", "ACTIVE");

        mockMvc.perform(patch("/api/gyms/{gymId}/admin/members/{memberId}/role", gym.getId(), target.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("admin-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\": \"COACH\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void changeRole_owner_returns403() throws Exception {
        mockMvc.perform(patch("/api/gyms/{gymId}/admin/members/{memberId}/role", gym.getId(), adminMember.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("admin-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\": \"MEMBER\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void changeRole_self_returns403() throws Exception {
        // Create a second admin to try to change their own role
        User admin2 = createUser("admin2-uid", "admin2@test.com", "Admin 2");
        GymMember admin2Member = createMembership(gym.getId(), admin2.getId(), "ADMIN", "ACTIVE");

        mockMvc.perform(patch("/api/gyms/{gymId}/admin/members/{memberId}/role", gym.getId(), admin2Member.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("admin2-uid")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\": \"MEMBER\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void changeRole_invalidRole_returns400() throws Exception {
        GymMember target = createMembership(gym.getId(), createUser("inv-uid", "inv@test.com", "Inv User").getId(), "MEMBER", "ACTIVE");

        mockMvc.perform(patch("/api/gyms/{gymId}/admin/members/{memberId}/role", gym.getId(), target.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("admin-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\": \"INVALID\"}"))
            .andExpect(status().isBadRequest());
    }

    // Helper methods
    private User createUser(String uid, String email, String name) {
        User user = new User();
        user.setSupabaseUid(uid);
        user.setEmail(email);
        user.setFullName(name);
        return userRepository.save(user);
    }

    private Gym createGym(String name, String slug, Long ownerId) {
        Gym g = new Gym();
        g.setName(name);
        g.setSlug(slug);
        g.setOwnerUserId(ownerId);
        g.setStatus("ACTIVE");
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
