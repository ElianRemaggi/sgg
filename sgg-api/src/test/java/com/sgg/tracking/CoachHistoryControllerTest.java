package com.sgg.tracking;

import com.sgg.common.BaseIntegrationTest;
import com.sgg.identity.entity.User;
import com.sgg.identity.repository.UserRepository;
import com.sgg.tenancy.entity.Gym;
import com.sgg.tenancy.entity.GymMember;
import com.sgg.tenancy.repository.GymMemberRepository;
import com.sgg.tenancy.repository.GymRepository;
import com.sgg.tracking.entity.ExerciseCompletion;
import com.sgg.tracking.repository.ExerciseCompletionRepository;
import com.sgg.training.entity.RoutineAssignment;
import com.sgg.training.entity.RoutineTemplate;
import com.sgg.training.entity.TemplateBlock;
import com.sgg.training.entity.TemplateExercise;
import com.sgg.training.repository.RoutineAssignmentRepository;
import com.sgg.training.repository.RoutineTemplateRepository;
import com.sgg.training.repository.TemplateBlockRepository;
import com.sgg.training.repository.TemplateExerciseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Transactional
class CoachHistoryControllerTest extends BaseIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private GymRepository gymRepository;
    @Autowired private GymMemberRepository gymMemberRepository;
    @Autowired private RoutineTemplateRepository templateRepository;
    @Autowired private TemplateBlockRepository blockRepository;
    @Autowired private TemplateExerciseRepository exerciseRepository;
    @Autowired private RoutineAssignmentRepository assignmentRepository;
    @Autowired private ExerciseCompletionRepository completionRepository;

    private User coachUser;
    private User memberUser;
    private User coachOtherGym;
    private Gym gym;
    private Gym otherGym;
    private RoutineAssignment assignment;
    private TemplateExercise exercise1;
    private TemplateBlock block;

    @BeforeEach
    void setUp() {
        completionRepository.deleteAll();
        assignmentRepository.deleteAll();
        exerciseRepository.deleteAll();
        blockRepository.deleteAll();
        templateRepository.deleteAll();
        gymMemberRepository.deleteAll();
        gymRepository.deleteAll();
        userRepository.deleteAll();

        User admin = createUser("admin-coach-hist-001", "admin-ch@test.com", "Admin");
        coachUser = createUser("coach-ch-001", "coach-ch@test.com", "Coach");
        memberUser = createUser("member-ch-001", "member-ch@test.com", "Member");
        coachOtherGym = createUser("coach-other-001", "coach-other@test.com", "Coach Other");

        gym = createGym("Gym Coach Hist", "gym-coach-hist", admin.getId());
        otherGym = createGym("Otro Gym", "otro-gym-ch", admin.getId());

        createMembership(gym.getId(), admin.getId(), "ADMIN", "ACTIVE");
        createMembership(gym.getId(), coachUser.getId(), "COACH", "ACTIVE");
        createMembership(gym.getId(), memberUser.getId(), "MEMBER", "ACTIVE");
        createMembership(otherGym.getId(), coachOtherGym.getId(), "COACH", "ACTIVE");

        RoutineTemplate template = new RoutineTemplate();
        template.setGymId(gym.getId());
        template.setName("Hipertrofia");
        template.setCreatedBy(coachUser.getId());
        template = templateRepository.save(template);

        block = new TemplateBlock();
        block.setTemplateId(template.getId());
        block.setName("Upper");
        block.setDayNumber(1);
        block.setSortOrder(0);
        block = blockRepository.save(block);

        exercise1 = new TemplateExercise();
        exercise1.setBlockId(block.getId());
        exercise1.setName("Press Banca");
        exercise1.setSets(4);
        exercise1.setReps("8-10");
        exercise1.setSortOrder(0);
        exercise1 = exerciseRepository.save(exercise1);

        assignment = new RoutineAssignment();
        assignment.setGymId(gym.getId());
        assignment.setTemplateId(template.getId());
        assignment.setMemberUserId(memberUser.getId());
        assignment.setAssignedBy(coachUser.getId());
        assignment.setStartsAt(LocalDateTime.now().minusDays(7));
        assignment.setEndsAt(LocalDateTime.now().plusDays(23));
        assignment = assignmentRepository.save(assignment);
    }

    // ── GET /{memberId}/assignments ───────────────────────────────────────────

    @Test
    void getHistory_asCoach_returnsAssignmentList() throws Exception {
        saveCompletion(exercise1.getId(), LocalDate.now().minusDays(2), new BigDecimal("90.00"));

        mockMvc.perform(get("/api/gyms/{gymId}/coach/history/{memberId}/assignments",
                    gym.getId(), memberUser.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j.subject("coach-ch-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data[0].id").value(assignment.getId()))
            .andExpect(jsonPath("$.data[0].templateName").value("Hipertrofia"))
            .andExpect(jsonPath("$.data[0].totalCompletions").value(1));
    }

    @Test
    void getHistory_memberCantAccessCoachEndpoint_returns403() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/coach/history/{memberId}/assignments",
                    gym.getId(), memberUser.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j.subject("member-ch-001"))))
            .andExpect(status().isForbidden());
    }

    @Test
    void getHistory_coachFromOtherGym_returns403() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/coach/history/{memberId}/assignments",
                    gym.getId(), memberUser.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j.subject("coach-other-001"))))
            .andExpect(status().isForbidden());
    }

    // ── GET /{memberId}/assignments/{assignmentId} ────────────────────────────

    @Test
    void getAssignmentDetail_asCoach_returnsDetail() throws Exception {
        saveCompletion(exercise1.getId(), LocalDate.now().minusDays(5), new BigDecimal("85.00"));
        saveCompletion(exercise1.getId(), LocalDate.now().minusDays(2), new BigDecimal("90.00"));

        mockMvc.perform(get("/api/gyms/{gymId}/coach/history/{memberId}/assignments/{assignmentId}",
                    gym.getId(), memberUser.getId(), assignment.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j.subject("coach-ch-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.id").value(assignment.getId()))
            .andExpect(jsonPath("$.data.templateName").value("Hipertrofia"))
            .andExpect(jsonPath("$.data.blocks[0].name").value("Upper"))
            .andExpect(jsonPath("$.data.blocks[0].exercises[0].sessionsCount").value(2))
            .andExpect(jsonPath("$.data.blocks[0].exercises[0].bestWeightKg").value(90.0))
            .andExpect(jsonPath("$.data.stats.totalDistinctDays").value(2))
            .andExpect(jsonPath("$.data.stats.totalCompletions").value(2));
    }

    @Test
    void getAssignmentDetail_coachFromOtherGym_returns403() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/coach/history/{memberId}/assignments/{assignmentId}",
                    gym.getId(), memberUser.getId(), assignment.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j.subject("coach-other-001"))))
            .andExpect(status().isForbidden());
    }

    // ── GET /{memberId}/assignments/{assignmentId}/exercises/{exerciseId} ─────

    @Test
    void getExerciseProgress_asCoach_returnsProgress() throws Exception {
        saveCompletion(exercise1.getId(), LocalDate.now().minusDays(6), new BigDecimal("80.00"));
        saveCompletion(exercise1.getId(), LocalDate.now().minusDays(3), new BigDecimal("82.50"));
        saveCompletion(exercise1.getId(), LocalDate.now().minusDays(1), new BigDecimal("85.00"));

        mockMvc.perform(get("/api/gyms/{gymId}/coach/history/{memberId}/assignments/{assignmentId}/exercises/{exerciseId}",
                    gym.getId(), memberUser.getId(), assignment.getId(), exercise1.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j.subject("coach-ch-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.exerciseName").value("Press Banca"))
            .andExpect(jsonPath("$.data.blockName").value("Upper"))
            .andExpect(jsonPath("$.data.sessions.length()").value(3))
            .andExpect(jsonPath("$.data.stats.sessionsCount").value(3))
            .andExpect(jsonPath("$.data.stats.bestWeightKg").value(85.0))
            .andExpect(jsonPath("$.data.stats.firstWeightKg").value(80.0))
            .andExpect(jsonPath("$.data.stats.lastWeightKg").value(85.0));
    }

    @Test
    void getExerciseProgress_memberCantAccessCoachEndpoint_returns403() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/coach/history/{memberId}/assignments/{assignmentId}/exercises/{exerciseId}",
                    gym.getId(), memberUser.getId(), assignment.getId(), exercise1.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j.subject("member-ch-001"))))
            .andExpect(status().isForbidden());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void saveCompletion(Long exerciseId, LocalDate sessionDate, BigDecimal weight) {
        ExerciseCompletion c = new ExerciseCompletion();
        c.setGymId(gym.getId());
        c.setAssignmentId(assignment.getId());
        c.setExerciseId(exerciseId);
        c.setUserId(memberUser.getId());
        c.setSessionDate(sessionDate);
        c.setIsCompleted(true);
        c.setWeightKg(weight);
        c.setCompletedAt(sessionDate.atTime(10, 0));
        completionRepository.save(c);
    }

    private User createUser(String uid, String email, String name) {
        User user = new User();
        user.setSupabaseUid(uid);
        user.setEmail(email);
        user.setFullName(name);
        user.setUsername(uid.replace("-", "_").substring(0, Math.min(uid.length(), 30)));
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

    private void createMembership(Long gymId, Long userId, String role, String status) {
        GymMember m = new GymMember();
        m.setGymId(gymId);
        m.setUserId(userId);
        m.setRole(role);
        m.setStatus(status);
        gymMemberRepository.save(m);
    }
}
