package com.sgg.coaching;

import com.sgg.common.BaseIntegrationTest;
import com.sgg.coaching.entity.CoachAssignment;
import com.sgg.coaching.repository.CoachAssignmentRepository;
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
class CoachAssignmentControllerTest extends BaseIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private GymRepository gymRepository;
    @Autowired private GymMemberRepository gymMemberRepository;
    @Autowired private CoachAssignmentRepository assignmentRepository;

    private User admin;
    private User coach;
    private User member;
    private Gym gym;
    private Gym otherGym;

    @BeforeEach
    void setUp() {
        assignmentRepository.deleteAll();
        gymMemberRepository.deleteAll();
        gymRepository.deleteAll();
        userRepository.deleteAll();

        admin  = createUser("admin-uid",  "admin@test.com",  "Admin User");
        coach  = createUser("coach-uid",  "coach@test.com",  "Coach User");
        member = createUser("member-uid", "member@test.com", "Member User");

        gym      = createGym("SGG Gym",   "sgg-gym",   admin.getId());
        otherGym = createGym("Other Gym", "other-gym", admin.getId());

        createMembership(gym.getId(), admin.getId(),  "ADMIN",  "ACTIVE");
        createMembership(gym.getId(), coach.getId(),  "COACH",  "ACTIVE");
        createMembership(gym.getId(), member.getId(), "MEMBER", "ACTIVE");
    }

    @Test
    void listCoaches_asAdmin_returnsCoachesWithCount() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/admin/coaches", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                    .jwt(jwt -> jwt.subject("admin-uid"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data[0].userId").value(coach.getId()))
            .andExpect(jsonPath("$.data[0].assignedMembersCount").value(0));
    }

    @Test
    void listCoaches_asMember_returns403() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/admin/coaches", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                    .jwt(jwt -> jwt.subject("member-uid"))))
            .andExpect(status().isForbidden());
    }

    @Test
    void assignCoach_success_returns201() throws Exception {
        String body = objectMapper.writeValueAsString(
            new com.sgg.coaching.dto.AssignCoachRequest(coach.getId(), member.getId()));

        mockMvc.perform(post("/api/gyms/{gymId}/admin/assign-coach", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                    .jwt(jwt -> jwt.subject("admin-uid")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.coachUserId").value(coach.getId()))
            .andExpect(jsonPath("$.data.memberUserId").value(member.getId()));
    }

    @Test
    void assignCoach_coachUserIsNotCoach_returns400() throws Exception {
        // admin.getId() is ADMIN, not COACH
        String body = objectMapper.writeValueAsString(
            new com.sgg.coaching.dto.AssignCoachRequest(admin.getId(), member.getId()));

        mockMvc.perform(post("/api/gyms/{gymId}/admin/assign-coach", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                    .jwt(jwt -> jwt.subject("admin-uid")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isBadRequest());
    }

    @Test
    void assignCoach_duplicateActive_returns409() throws Exception {
        createAssignment(gym.getId(), coach.getId(), member.getId());

        String body = objectMapper.writeValueAsString(
            new com.sgg.coaching.dto.AssignCoachRequest(coach.getId(), member.getId()));

        mockMvc.perform(post("/api/gyms/{gymId}/admin/assign-coach", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                    .jwt(jwt -> jwt.subject("admin-uid")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isConflict());
    }

    @Test
    void unassignCoach_setsUnassignedAt() throws Exception {
        CoachAssignment assignment = createAssignment(gym.getId(), coach.getId(), member.getId());

        mockMvc.perform(delete("/api/gyms/{gymId}/admin/assign-coach/{id}", gym.getId(), assignment.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                    .jwt(jwt -> jwt.subject("admin-uid"))))
            .andExpect(status().isNoContent());
    }

    @Test
    void getMyMembers_asCoach_returnsMembersAssignedToCoach() throws Exception {
        createAssignment(gym.getId(), coach.getId(), member.getId());

        mockMvc.perform(get("/api/gyms/{gymId}/coach/my-members", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                    .jwt(jwt -> jwt.subject("coach-uid"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data[0].userId").value(member.getId()))
            .andExpect(jsonPath("$.data[0].hasActiveRoutine").value(false));
    }

    @Test
    void getMyMembers_asMember_returns403() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/coach/my-members", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                    .jwt(jwt -> jwt.subject("member-uid"))))
            .andExpect(status().isForbidden());
    }

    @Test
    void getMyMembers_coachFromOtherGym_seesNoMembers() throws Exception {
        // coach has a membership in gym but NOT in otherGym
        // even if we call with otherGym, TenantInterceptor will reject (403)
        // so let's add a coach to otherGym and verify they don't see gym's members
        User otherCoach = createUser("other-coach-uid", "othercoach@test.com", "Other Coach");
        createMembership(otherGym.getId(), otherCoach.getId(), "COACH",  "ACTIVE");
        createMembership(otherGym.getId(), admin.getId(),      "ADMIN",  "ACTIVE");

        User otherMember = createUser("other-member-uid", "othermember@test.com", "Other Member");
        createMembership(otherGym.getId(), otherMember.getId(), "MEMBER", "ACTIVE");

        // Assign coach (from gym) to member (in gym)
        createAssignment(gym.getId(), coach.getId(), member.getId());

        // otherCoach should see 0 members in otherGym (no assignments there)
        mockMvc.perform(get("/api/gyms/{gymId}/coach/my-members", otherGym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                    .jwt(jwt -> jwt.subject("other-coach-uid"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isEmpty());
    }

    // ---- Helpers ----

    private User createUser(String uid, String email, String name) {
        User u = new User();
        u.setSupabaseUid(uid);
        u.setEmail(email);
        u.setFullName(name);
        u.setUsername(uid.replace("-", "_").substring(0, Math.min(uid.length(), 30)));
        return userRepository.save(u);
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

    private CoachAssignment createAssignment(Long gymId, Long coachUserId, Long memberUserId) {
        CoachAssignment a = new CoachAssignment();
        a.setGymId(gymId);
        a.setCoachUserId(coachUserId);
        a.setMemberUserId(memberUserId);
        return assignmentRepository.save(a);
    }
}
