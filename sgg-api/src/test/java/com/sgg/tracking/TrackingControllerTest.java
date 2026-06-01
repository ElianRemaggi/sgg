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

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.hasSize;
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
            .andExpect(jsonPath("$.data.completions[0].weightKg").value(80.0))
            .andExpect(jsonPath("$.data.previousNotesByExerciseId").isMap());
    }

    @Test
    void getProgress_previousNotesByExerciseId_returnsPriorSessionNotes() throws Exception {
        // Completion de ayer con notas
        ExerciseCompletion yesterday = new ExerciseCompletion();
        yesterday.setGymId(gym.getId());
        yesterday.setAssignmentId(assignment.getId());
        yesterday.setExerciseId(exercise1.getId());
        yesterday.setUserId(memberUser.getId());
        yesterday.setSessionDate(LocalDate.now().minusDays(1));
        yesterday.setIsCompleted(true);
        yesterday.setNotes("Subir 2.5 kg la próxima");
        yesterday.setCompletedAt(LocalDateTime.now().minusDays(1));
        completionRepository.save(yesterday);

        mockMvc.perform(get("/api/gyms/{gymId}/member/tracking/progress", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.previousNotesByExerciseId." + exercise1.getId())
                .value("Subir 2.5 kg la próxima"));
    }

    @Test
    void getProgress_previousNotesByExerciseId_excludesTodaysCompletion() throws Exception {
        // Completion de hoy con notas — NO debe aparecer como observación
        ExerciseCompletion today = new ExerciseCompletion();
        today.setGymId(gym.getId());
        today.setAssignmentId(assignment.getId());
        today.setExerciseId(exercise1.getId());
        today.setUserId(memberUser.getId());
        today.setSessionDate(LocalDate.now());
        today.setIsCompleted(true);
        today.setNotes("Nota de hoy");
        today.setCompletedAt(LocalDateTime.now());
        completionRepository.save(today);

        mockMvc.perform(get("/api/gyms/{gymId}/member/tracking/progress", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.previousNotesByExerciseId." + exercise1.getId()).doesNotExist());
    }

    @Test
    void getProgress_previousNotesByExerciseId_returnsLatestWhenMultiplePriorSessions() throws Exception {
        // Completion de hace 3 días — nota vieja
        ExerciseCompletion older = new ExerciseCompletion();
        older.setGymId(gym.getId());
        older.setAssignmentId(assignment.getId());
        older.setExerciseId(exercise1.getId());
        older.setUserId(memberUser.getId());
        older.setSessionDate(LocalDate.now().minusDays(3));
        older.setIsCompleted(true);
        older.setNotes("Nota vieja");
        older.setCompletedAt(LocalDateTime.now().minusDays(3));
        completionRepository.save(older);

        // Completion de ayer — nota más reciente
        ExerciseCompletion newer = new ExerciseCompletion();
        newer.setGymId(gym.getId());
        newer.setAssignmentId(assignment.getId());
        newer.setExerciseId(exercise1.getId());
        newer.setUserId(memberUser.getId());
        newer.setSessionDate(LocalDate.now().minusDays(1));
        newer.setIsCompleted(true);
        newer.setNotes("Nota reciente");
        newer.setCompletedAt(LocalDateTime.now().minusDays(1));
        completionRepository.save(newer);

        mockMvc.perform(get("/api/gyms/{gymId}/member/tracking/progress", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.previousNotesByExerciseId." + exercise1.getId())
                .value("Nota reciente"));
    }

    @Test
    void getProgress_previousNotesByExerciseId_ignoresCompletionsWithoutNotes() throws Exception {
        // Completion de ayer sin notas
        ExerciseCompletion noNotes = new ExerciseCompletion();
        noNotes.setGymId(gym.getId());
        noNotes.setAssignmentId(assignment.getId());
        noNotes.setExerciseId(exercise1.getId());
        noNotes.setUserId(memberUser.getId());
        noNotes.setSessionDate(LocalDate.now().minusDays(1));
        noNotes.setIsCompleted(true);
        noNotes.setNotes(null);
        noNotes.setCompletedAt(LocalDateTime.now().minusDays(1));
        completionRepository.save(noNotes);

        mockMvc.perform(get("/api/gyms/{gymId}/member/tracking/progress", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.previousNotesByExerciseId." + exercise1.getId()).doesNotExist());
    }

    @Test
    void getProgress_previousNotesByExerciseId_crossAssignmentLookup() throws Exception {
        // Crear una segunda asignación (nueva rutina)
        RoutineAssignment newAssignment = new RoutineAssignment();
        newAssignment.setGymId(gym.getId());
        newAssignment.setTemplateId(assignment.getTemplateId());
        newAssignment.setMemberUserId(memberUser.getId());
        newAssignment.setAssignedBy(coachUser.getId());
        newAssignment.setStartsAt(LocalDateTime.now().minusHours(1));
        newAssignment = assignmentRepository.save(newAssignment);

        // Completion de ayer en la asignación ANTERIOR
        ExerciseCompletion priorAssignmentCompletion = new ExerciseCompletion();
        priorAssignmentCompletion.setGymId(gym.getId());
        priorAssignmentCompletion.setAssignmentId(assignment.getId());
        priorAssignmentCompletion.setExerciseId(exercise1.getId());
        priorAssignmentCompletion.setUserId(memberUser.getId());
        priorAssignmentCompletion.setSessionDate(LocalDate.now().minusDays(1));
        priorAssignmentCompletion.setIsCompleted(true);
        priorAssignmentCompletion.setNotes("Nota de asignación anterior");
        priorAssignmentCompletion.setCompletedAt(LocalDateTime.now().minusDays(1));
        completionRepository.save(priorAssignmentCompletion);

        // Marcar la asignación original como expirada para que la nueva sea la activa
        assignment.setEndsAt(LocalDateTime.now().minusHours(2));
        assignmentRepository.save(assignment);

        mockMvc.perform(get("/api/gyms/{gymId}/member/tracking/progress", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.previousNotesByExerciseId." + exercise1.getId())
                .value("Nota de asignación anterior"));
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
    void completeExercise_sameExerciseDifferentDays_createsTwoRecords() throws Exception {
        // Simular un registro de ayer insertándolo directamente
        ExerciseCompletion yesterday = new ExerciseCompletion();
        yesterday.setGymId(gym.getId());
        yesterday.setAssignmentId(assignment.getId());
        yesterday.setExerciseId(exercise1.getId());
        yesterday.setUserId(memberUser.getId());
        yesterday.setSessionDate(LocalDate.now().minusDays(1));
        yesterday.setIsCompleted(true);
        yesterday.setWeightKg(new java.math.BigDecimal("60.00"));
        yesterday.setCompletedAt(LocalDateTime.now().minusDays(1));
        completionRepository.save(yesterday);

        // Completar hoy — debe crear un segundo registro, no pisarse
        String json = String.format("""
            {"assignmentId": %d, "exerciseId": %d, "weightKg": 65.0}
            """, assignment.getId(), exercise1.getId());

        mockMvc.perform(post("/api/gyms/{gymId}/member/tracking/complete", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001")))
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.weightKg").value(65.0));

        // Verificar que hay 2 registros para el mismo ejercicio en días distintos
        var records = completionRepository
                .findByAssignmentIdAndExerciseIdAndUserIdOrderBySessionDateAsc(
                        assignment.getId(), exercise1.getId(), memberUser.getId());
        org.junit.jupiter.api.Assertions.assertEquals(2, records.size());
        org.junit.jupiter.api.Assertions.assertEquals(
                LocalDate.now().minusDays(1), records.get(0).getSessionDate());
        org.junit.jupiter.api.Assertions.assertEquals(
                LocalDate.now(), records.get(1).getSessionDate());
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
        user.setUsername(uid.replace("-", "_").substring(0, Math.min(uid.replace("-", "_").length(), 30)));
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
