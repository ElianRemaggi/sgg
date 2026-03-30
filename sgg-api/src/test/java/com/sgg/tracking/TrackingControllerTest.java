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
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Transactional
class TrackingControllerTest extends BaseIntegrationTest {

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
    private Gym gym;
    private Gym otherGym;
    private RoutineAssignment assignment;
    private TemplateExercise exercise1;
    private TemplateExercise exercise2;

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

        User admin = createUser("admin-uid-001", "admin@test.com", "Admin User");
        coachUser = createUser("coach-uid-001", "coach@test.com", "Coach User");
        memberUser = createUser("member-uid-001", "member@test.com", "Member User");

        gym = createGym("CrossFit Norte", "crossfit-norte", admin.getId());
        otherGym = createGym("Otro Gym", "otro-gym", admin.getId());

        createMembership(gym.getId(), admin.getId(), "ADMIN", "ACTIVE");
        createMembership(gym.getId(), coachUser.getId(), "COACH", "ACTIVE");
        createMembership(gym.getId(), memberUser.getId(), "MEMBER", "ACTIVE");

        // Create template with block and exercises
        RoutineTemplate template = new RoutineTemplate();
        template.setGymId(gym.getId());
        template.setName("Rutina Test");
        template.setCreatedBy(coachUser.getId());
        template = templateRepository.save(template);

        TemplateBlock block = new TemplateBlock();
        block.setTemplateId(template.getId());
        block.setName("Día 1");
        block.setDayNumber(1);
        block.setSortOrder(0);
        block = blockRepository.save(block);

        exercise1 = new TemplateExercise();
        exercise1.setBlockId(block.getId());
        exercise1.setName("Sentadillas");
        exercise1.setSets(4);
        exercise1.setReps("8-10");
        exercise1.setSortOrder(0);
        exercise1 = exerciseRepository.save(exercise1);

        exercise2 = new TemplateExercise();
        exercise2.setBlockId(block.getId());
        exercise2.setName("Press Banca");
        exercise2.setSets(3);
        exercise2.setReps("10");
        exercise2.setSortOrder(1);
        exercise2 = exerciseRepository.save(exercise2);

        // Assignment active now
        assignment = new RoutineAssignment();
        assignment.setGymId(gym.getId());
        assignment.setTemplateId(template.getId());
        assignment.setMemberUserId(memberUser.getId());
        assignment.setAssignedBy(coachUser.getId());
        assignment.setStartsAt(LocalDateTime.now().minusDays(1));
        assignment.setEndsAt(LocalDateTime.now().plusDays(30));
        assignment = assignmentRepository.save(assignment);
    }

    @Test
    void completeExercise_happyPath_returns200() throws Exception {
        String json = String.format("""
            {
                "assignmentId": %d,
                "exerciseId": %d
            }
            """, assignment.getId(), exercise1.getId());

        mockMvc.perform(post("/api/gyms/{gymId}/member/tracking/complete", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.exerciseId").value(exercise1.getId()))
            .andExpect(jsonPath("$.data.isCompleted").value(true));
    }

    @Test
    void completeExercise_withWeightAndReps_returns200() throws Exception {
        String json = String.format("""
            {
                "assignmentId": %d,
                "exerciseId": %d,
                "weightKg": 80.5,
                "actualReps": 8,
                "notes": "Buena forma"
            }
            """, assignment.getId(), exercise1.getId());

        mockMvc.perform(post("/api/gyms/{gymId}/member/tracking/complete", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.weightKg").value(80.5))
            .andExpect(jsonPath("$.data.actualReps").value(8))
            .andExpect(jsonPath("$.data.notes").value("Buena forma"));
    }

    @Test
    void completeExercise_idempotent_updatesExisting() throws Exception {
        // Complete first time
        String json = String.format("""
            {"assignmentId": %d, "exerciseId": %d, "weightKg": 60.0}
            """, assignment.getId(), exercise1.getId());

        mockMvc.perform(post("/api/gyms/{gymId}/member/tracking/complete", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isOk());

        // Complete again with different weight
        String json2 = String.format("""
            {"assignmentId": %d, "exerciseId": %d, "weightKg": 70.0}
            """, assignment.getId(), exercise1.getId());

        mockMvc.perform(post("/api/gyms/{gymId}/member/tracking/complete", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json2))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.weightKg").value(70.0));
    }

    @Test
    void completeExercise_exerciseNotInAssignment_returns409() throws Exception {
        // Create exercise in other gym
        RoutineTemplate otherTemplate = new RoutineTemplate();
        otherTemplate.setGymId(otherGym.getId());
        otherTemplate.setName("Otra");
        otherTemplate.setCreatedBy(coachUser.getId());
        otherTemplate = templateRepository.save(otherTemplate);

        TemplateBlock otherBlock = new TemplateBlock();
        otherBlock.setTemplateId(otherTemplate.getId());
        otherBlock.setName("B1");
        otherBlock.setDayNumber(1);
        otherBlock.setSortOrder(0);
        otherBlock = blockRepository.save(otherBlock);

        TemplateExercise otherExercise = new TemplateExercise();
        otherExercise.setBlockId(otherBlock.getId());
        otherExercise.setName("Otro ejercicio");
        otherExercise.setSets(3);
        otherExercise.setReps("10");
        otherExercise.setSortOrder(0);
        otherExercise = exerciseRepository.save(otherExercise);

        String json = String.format("""
            {"assignmentId": %d, "exerciseId": %d}
            """, assignment.getId(), otherExercise.getId());

        mockMvc.perform(post("/api/gyms/{gymId}/member/tracking/complete", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isConflict());
    }

    @Test
    void undoExercise_happyPath_returns200() throws Exception {
        // First complete
        ExerciseCompletion completion = new ExerciseCompletion();
        completion.setGymId(gym.getId());
        completion.setAssignmentId(assignment.getId());
        completion.setExerciseId(exercise1.getId());
        completion.setUserId(memberUser.getId());
        completion.setIsCompleted(true);
        completion.setCompletedAt(LocalDateTime.now());
        completionRepository.save(completion);

        String json = String.format("""
            {"assignmentId": %d, "exerciseId": %d}
            """, assignment.getId(), exercise1.getId());

        mockMvc.perform(post("/api/gyms/{gymId}/member/tracking/undo", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void undoExercise_noRecord_idempotent_returns200() throws Exception {
        String json = String.format("""
            {"assignmentId": %d, "exerciseId": %d}
            """, assignment.getId(), exercise1.getId());

        mockMvc.perform(post("/api/gyms/{gymId}/member/tracking/undo", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void getProgress_withCompletions_returnsStats() throws Exception {
        // Complete exercise1
        ExerciseCompletion c = new ExerciseCompletion();
        c.setGymId(gym.getId());
        c.setAssignmentId(assignment.getId());
        c.setExerciseId(exercise1.getId());
        c.setUserId(memberUser.getId());
        c.setIsCompleted(true);
        c.setWeightKg(new java.math.BigDecimal("80.00"));
        c.setActualReps(8);
        c.setCompletedAt(LocalDateTime.now());
        completionRepository.save(c);

        mockMvc.perform(get("/api/gyms/{gymId}/member/tracking/progress", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.assignmentId").value(assignment.getId()))
            .andExpect(jsonPath("$.data.totalExercises").value(2))
            .andExpect(jsonPath("$.data.completedTotal").value(1))
            .andExpect(jsonPath("$.data.completedToday").value(1))
            .andExpect(jsonPath("$.data.progressPercent").value(50))
            .andExpect(jsonPath("$.data.completions").isArray())
            .andExpect(jsonPath("$.data.completions[0].weightKg").value(80.0));
    }

    @Test
    void coachTracking_happyPath_returns200() throws Exception {
        // Complete exercise for member
        ExerciseCompletion c = new ExerciseCompletion();
        c.setGymId(gym.getId());
        c.setAssignmentId(assignment.getId());
        c.setExerciseId(exercise1.getId());
        c.setUserId(memberUser.getId());
        c.setIsCompleted(true);
        c.setCompletedAt(LocalDateTime.now());
        completionRepository.save(c);

        mockMvc.perform(get("/api/gyms/{gymId}/coach/tracking/{memberId}", gym.getId(), memberUser.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("coach-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.totalExercises").value(2))
            .andExpect(jsonPath("$.data.completedTotal").value(1));
    }

    @Test
    void coachTracking_memberCantAccessCoachEndpoint_returns403() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/coach/tracking/{memberId}", gym.getId(), memberUser.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001"))))
            .andExpect(status().isForbidden());
    }

    @Test
    void tenantIsolation_memberInOtherGym_returns403() throws Exception {
        // Member is not a member of otherGym
        String json = String.format("""
            {"assignmentId": %d, "exerciseId": %d}
            """, assignment.getId(), exercise1.getId());

        mockMvc.perform(post("/api/gyms/{gymId}/member/tracking/complete", otherGym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isForbidden());
    }

    // ── Helpers ──

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
