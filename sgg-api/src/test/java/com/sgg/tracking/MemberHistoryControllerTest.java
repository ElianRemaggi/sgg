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
class MemberHistoryControllerTest extends BaseIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private GymRepository gymRepository;
    @Autowired private GymMemberRepository gymMemberRepository;
    @Autowired private RoutineTemplateRepository templateRepository;
    @Autowired private TemplateBlockRepository blockRepository;
    @Autowired private TemplateExerciseRepository exerciseRepository;
    @Autowired private RoutineAssignmentRepository assignmentRepository;
    @Autowired private ExerciseCompletionRepository completionRepository;

    private User memberUser;
    private User coachUser;
    private User otherMember;
    private Gym gym;
    private RoutineAssignment assignment;
    private TemplateExercise exercise1;
    private TemplateExercise exercise2;
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

        User admin = createUser("admin-hist-001", "admin-hist@test.com", "Admin");
        coachUser = createUser("coach-hist-001", "coach-hist@test.com", "Coach");
        memberUser = createUser("member-hist-001", "member-hist@test.com", "Member");
        otherMember = createUser("other-hist-001", "other-hist@test.com", "Other");

        gym = createGym("Gym Historia", "gym-historia", admin.getId());

        createMembership(gym.getId(), admin.getId(), "ADMIN", "ACTIVE");
        createMembership(gym.getId(), coachUser.getId(), "COACH", "ACTIVE");
        createMembership(gym.getId(), memberUser.getId(), "MEMBER", "ACTIVE");
        createMembership(gym.getId(), otherMember.getId(), "MEMBER", "ACTIVE");

        RoutineTemplate template = new RoutineTemplate();
        template.setGymId(gym.getId());
        template.setName("Fuerza Base");
        template.setCreatedBy(coachUser.getId());
        template = templateRepository.save(template);

        block = new TemplateBlock();
        block.setTemplateId(template.getId());
        block.setName("Día A");
        block.setDayNumber(1);
        block.setSortOrder(0);
        block = blockRepository.save(block);

        exercise1 = new TemplateExercise();
        exercise1.setBlockId(block.getId());
        exercise1.setName("Sentadilla");
        exercise1.setSets(4);
        exercise1.setReps("5");
        exercise1.setSortOrder(0);
        exercise1 = exerciseRepository.save(exercise1);

        exercise2 = new TemplateExercise();
        exercise2.setBlockId(block.getId());
        exercise2.setName("Peso Muerto");
        exercise2.setSets(3);
        exercise2.setReps("3");
        exercise2.setSortOrder(1);
        exercise2 = exerciseRepository.save(exercise2);

        assignment = new RoutineAssignment();
        assignment.setGymId(gym.getId());
        assignment.setTemplateId(template.getId());
        assignment.setMemberUserId(memberUser.getId());
        assignment.setAssignedBy(coachUser.getId());
        assignment.setStartsAt(LocalDateTime.now().minusDays(10));
        assignment.setEndsAt(LocalDateTime.now().plusDays(20));
        assignment = assignmentRepository.save(assignment);
    }

    // ── GET /assignments ──────────────────────────────────────────────────────

    @Test
    void getHistory_happyPath_returnsAssignmentList() throws Exception {
        saveCompletion(exercise1.getId(), LocalDate.now().minusDays(3), new BigDecimal("80.00"));

        mockMvc.perform(get("/api/gyms/{gymId}/member/history/assignments", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j.subject("member-hist-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data[0].id").value(assignment.getId()))
            .andExpect(jsonPath("$.data[0].templateName").value("Fuerza Base"))
            .andExpect(jsonPath("$.data[0].isActive").value(true))
            .andExpect(jsonPath("$.data[0].totalCompletions").value(1))
            .andExpect(jsonPath("$.data[0].totalSessionDays").value(1));
    }

    @Test
    void getHistory_noCompletions_returnsAssignmentWithZeroStats() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/member/history/assignments", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j.subject("member-hist-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].totalCompletions").value(0))
            .andExpect(jsonPath("$.data[0].totalSessionDays").value(0));
    }

    @Test
    void getHistory_noAssignments_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/member/history/assignments", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j.subject("other-hist-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    void getHistory_coachCantAccessMemberEndpoint_returns403() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/member/history/assignments", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j.subject("coach-hist-001"))))
            .andExpect(status().isForbidden());
    }

    @Test
    void getHistory_twoAssignments_statsIsolatedPerAssignment() throws Exception {
        // Asignación anterior (finalizada)
        RoutineAssignment olderAssignment = new RoutineAssignment();
        olderAssignment.setGymId(gym.getId());
        olderAssignment.setTemplateId(assignment.getTemplateId());
        olderAssignment.setMemberUserId(memberUser.getId());
        olderAssignment.setAssignedBy(coachUser.getId());
        olderAssignment.setStartsAt(LocalDateTime.now().minusDays(60));
        olderAssignment.setEndsAt(LocalDateTime.now().minusDays(30));
        olderAssignment = assignmentRepository.save(olderAssignment);

        // Asignación activa: 2 completions en 2 días distintos
        saveCompletionForAssignment(assignment.getId(), exercise1.getId(),
                LocalDate.now().minusDays(3), new BigDecimal("80.00"));
        saveCompletionForAssignment(assignment.getId(), exercise1.getId(),
                LocalDate.now().minusDays(1), new BigDecimal("85.00"));

        // Asignación anterior: 3 completions en 2 días distintos
        saveCompletionForAssignment(olderAssignment.getId(), exercise1.getId(),
                LocalDate.now().minusDays(45), new BigDecimal("70.00"));
        saveCompletionForAssignment(olderAssignment.getId(), exercise2.getId(),
                LocalDate.now().minusDays(45), new BigDecimal("120.00"));
        saveCompletionForAssignment(olderAssignment.getId(), exercise2.getId(),
                LocalDate.now().minusDays(40), new BigDecimal("125.00"));

        Long olderAssignmentId = olderAssignment.getId();
        mockMvc.perform(get("/api/gyms/{gymId}/member/history/assignments", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j.subject("member-hist-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(2))
            // La más reciente (activa) va primero
            .andExpect(jsonPath("$.data[0].id").value(assignment.getId()))
            .andExpect(jsonPath("$.data[0].isActive").value(true))
            .andExpect(jsonPath("$.data[0].totalCompletions").value(2))
            .andExpect(jsonPath("$.data[0].totalSessionDays").value(2))
            // La anterior (finalizada) va segunda con sus propios stats
            .andExpect(jsonPath("$.data[1].id").value(olderAssignmentId))
            .andExpect(jsonPath("$.data[1].isActive").value(false))
            .andExpect(jsonPath("$.data[1].totalCompletions").value(3))
            .andExpect(jsonPath("$.data[1].totalSessionDays").value(2));
    }

    // ── GET /assignments/{assignmentId} ───────────────────────────────────────

    @Test
    void getAssignmentDetail_happyPath_returnsBlocksAndStats() throws Exception {
        saveCompletion(exercise1.getId(), LocalDate.now().minusDays(5), new BigDecimal("60.00"));
        saveCompletion(exercise1.getId(), LocalDate.now().minusDays(2), new BigDecimal("65.00"));
        saveCompletion(exercise2.getId(), LocalDate.now().minusDays(2), new BigDecimal("100.00"));

        mockMvc.perform(get("/api/gyms/{gymId}/member/history/assignments/{assignmentId}",
                    gym.getId(), assignment.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j.subject("member-hist-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.id").value(assignment.getId()))
            .andExpect(jsonPath("$.data.templateName").value("Fuerza Base"))
            .andExpect(jsonPath("$.data.isActive").value(true))
            .andExpect(jsonPath("$.data.blocks").isArray())
            .andExpect(jsonPath("$.data.blocks[0].name").value("Día A"))
            .andExpect(jsonPath("$.data.blocks[0].exercises").isArray())
            .andExpect(jsonPath("$.data.blocks[0].exercises[0].name").value("Sentadilla"))
            .andExpect(jsonPath("$.data.blocks[0].exercises[0].sessionsCount").value(2))
            .andExpect(jsonPath("$.data.blocks[0].exercises[0].bestWeightKg").value(65.0))
            .andExpect(jsonPath("$.data.stats.totalDistinctDays").value(2))
            .andExpect(jsonPath("$.data.stats.totalCompletions").value(3));
    }

    @Test
    void getAssignmentDetail_otherMembersAssignment_returns404() throws Exception {
        // otherMember intenta ver el historial del assignment de memberUser
        mockMvc.perform(get("/api/gyms/{gymId}/member/history/assignments/{assignmentId}",
                    gym.getId(), assignment.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j.subject("other-hist-001"))))
            .andExpect(status().isNotFound());
    }

    // ── GET /assignments/{assignmentId}/exercises/{exerciseId} ───────────────

    @Test
    void getExerciseProgress_happyPath_returnsSessions() throws Exception {
        saveCompletion(exercise1.getId(), LocalDate.now().minusDays(7), new BigDecimal("70.00"));
        saveCompletion(exercise1.getId(), LocalDate.now().minusDays(3), new BigDecimal("75.00"));

        mockMvc.perform(get("/api/gyms/{gymId}/member/history/assignments/{assignmentId}/exercises/{exerciseId}",
                    gym.getId(), assignment.getId(), exercise1.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j.subject("member-hist-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.exerciseId").value(exercise1.getId()))
            .andExpect(jsonPath("$.data.exerciseName").value("Sentadilla"))
            .andExpect(jsonPath("$.data.blockName").value("Día A"))
            .andExpect(jsonPath("$.data.sessions").isArray())
            .andExpect(jsonPath("$.data.sessions.length()").value(2))
            .andExpect(jsonPath("$.data.stats.sessionsCount").value(2))
            .andExpect(jsonPath("$.data.stats.bestWeightKg").value(75.0))
            .andExpect(jsonPath("$.data.stats.firstWeightKg").value(70.0))
            .andExpect(jsonPath("$.data.stats.lastWeightKg").value(75.0));
    }

    @Test
    void getExerciseProgress_multipleSessionDates_returnsAllSessions() throws Exception {
        // Tres sesiones en días distintos — verifica que session_date permite historial completo
        saveCompletion(exercise1.getId(), LocalDate.now().minusDays(14), new BigDecimal("60.00"));
        saveCompletion(exercise1.getId(), LocalDate.now().minusDays(7),  new BigDecimal("65.00"));
        saveCompletion(exercise1.getId(), LocalDate.now().minusDays(1),  new BigDecimal("70.00"));

        mockMvc.perform(get("/api/gyms/{gymId}/member/history/assignments/{assignmentId}/exercises/{exerciseId}",
                    gym.getId(), assignment.getId(), exercise1.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j.subject("member-hist-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.sessions.length()").value(3))
            .andExpect(jsonPath("$.data.stats.sessionsCount").value(3))
            .andExpect(jsonPath("$.data.stats.bestWeightKg").value(70.0))
            .andExpect(jsonPath("$.data.stats.firstWeightKg").value(60.0))
            .andExpect(jsonPath("$.data.stats.lastWeightKg").value(70.0))
            .andExpect(jsonPath("$.data.stats.deltaPercent").value(16.67));
    }

    @Test
    void getExerciseProgress_noSessions_returnsEmptySessions() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/member/history/assignments/{assignmentId}/exercises/{exerciseId}",
                    gym.getId(), assignment.getId(), exercise1.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j.subject("member-hist-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.sessions").isEmpty())
            .andExpect(jsonPath("$.data.stats.sessionsCount").value(0));
    }

    @Test
    void getExerciseProgress_otherMembersAssignment_returns404() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/member/history/assignments/{assignmentId}/exercises/{exerciseId}",
                    gym.getId(), assignment.getId(), exercise1.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j.subject("other-hist-001"))))
            .andExpect(status().isNotFound());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void saveCompletion(Long exerciseId, LocalDate sessionDate, BigDecimal weight) {
        saveCompletionForAssignment(assignment.getId(), exerciseId, sessionDate, weight);
    }

    private void saveCompletionForAssignment(Long assignmentId, Long exerciseId,
                                              LocalDate sessionDate, BigDecimal weight) {
        ExerciseCompletion c = new ExerciseCompletion();
        c.setGymId(gym.getId());
        c.setAssignmentId(assignmentId);
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
