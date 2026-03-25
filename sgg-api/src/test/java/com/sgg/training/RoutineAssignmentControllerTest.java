package com.sgg.training;

import com.sgg.common.BaseIntegrationTest;
import com.sgg.identity.entity.User;
import com.sgg.identity.repository.UserRepository;
import com.sgg.tenancy.entity.Gym;
import com.sgg.tenancy.entity.GymMember;
import com.sgg.tenancy.repository.GymMemberRepository;
import com.sgg.tenancy.repository.GymRepository;
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
class RoutineAssignmentControllerTest extends BaseIntegrationTest {

    @Autowired private GymRepository gymRepository;
    @Autowired private GymMemberRepository gymMemberRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private RoutineTemplateRepository templateRepository;
    @Autowired private TemplateBlockRepository blockRepository;
    @Autowired private TemplateExerciseRepository exerciseRepository;
    @Autowired private RoutineAssignmentRepository assignmentRepository;

    private User coachUser;
    private User memberUser;
    private Gym gym;
    private Gym otherGym;
    private RoutineTemplate template;

    @BeforeEach
    void setUp() {
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

        // Create template with blocks and exercises
        template = new RoutineTemplate();
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

        TemplateExercise exercise = new TemplateExercise();
        exercise.setBlockId(block.getId());
        exercise.setName("Sentadillas");
        exercise.setSets(4);
        exercise.setReps("8-10");
        exercise.setSortOrder(0);
        exerciseRepository.save(exercise);
    }

    // --- POST: Assign routine ---

    @Test
    void assignRoutine_asCoach_returns201() throws Exception {
        String json = String.format("""
            {
                "templateId": %d,
                "memberUserId": %d,
                "startsAt": "2026-04-01T00:00:00",
                "endsAt": "2026-04-30T23:59:59"
            }
            """, template.getId(), memberUser.getId());

        mockMvc.perform(post("/api/gyms/{gymId}/coach/assignments", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("coach-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.templateName").value("Rutina Test"));
    }

    @Test
    void assignRoutine_templateFromOtherGym_returns404() throws Exception {
        RoutineTemplate otherTemplate = new RoutineTemplate();
        otherTemplate.setGymId(otherGym.getId());
        otherTemplate.setName("Otra plantilla");
        otherTemplate.setCreatedBy(coachUser.getId());
        otherTemplate = templateRepository.save(otherTemplate);

        String json = String.format("""
            {
                "templateId": %d,
                "memberUserId": %d,
                "startsAt": "2026-04-01T00:00:00"
            }
            """, otherTemplate.getId(), memberUser.getId());

        mockMvc.perform(post("/api/gyms/{gymId}/coach/assignments", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("coach-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isNotFound());
    }

    @Test
    void assignRoutine_memberNotInGym_returns400() throws Exception {
        User outsider = createUser("outsider-uid", "outsider@test.com", "Outsider");

        String json = String.format("""
            {
                "templateId": %d,
                "memberUserId": %d,
                "startsAt": "2026-04-01T00:00:00"
            }
            """, template.getId(), outsider.getId());

        mockMvc.perform(post("/api/gyms/{gymId}/coach/assignments", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("coach-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isConflict());
    }

    // --- GET: Member routine ---

    @Test
    void getActiveRoutine_withAssignment_returns200() throws Exception {
        RoutineAssignment assignment = new RoutineAssignment();
        assignment.setGymId(gym.getId());
        assignment.setTemplateId(template.getId());
        assignment.setMemberUserId(memberUser.getId());
        assignment.setAssignedBy(coachUser.getId());
        assignment.setStartsAt(LocalDateTime.now().minusDays(1));
        assignmentRepository.save(assignment);

        mockMvc.perform(get("/api/gyms/{gymId}/member/routine", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.templateName").value("Rutina Test"))
            .andExpect(jsonPath("$.data.blocks.length()").value(1))
            .andExpect(jsonPath("$.data.blocks[0].exercises.length()").value(1));
    }

    @Test
    void getActiveRoutine_noAssignment_returns404() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/member/routine", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001"))))
            .andExpect(status().isNotFound());
    }

    @Test
    void getRoutineHistory_returnsList() throws Exception {
        RoutineAssignment assignment = new RoutineAssignment();
        assignment.setGymId(gym.getId());
        assignment.setTemplateId(template.getId());
        assignment.setMemberUserId(memberUser.getId());
        assignment.setAssignedBy(coachUser.getId());
        assignment.setStartsAt(LocalDateTime.now().minusDays(30));
        assignment.setEndsAt(LocalDateTime.now().minusDays(1));
        assignmentRepository.save(assignment);

        mockMvc.perform(get("/api/gyms/{gymId}/member/routine/history", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].templateName").value("Rutina Test"));
    }

    @Test
    void memberRoutine_coachTriesToAccess_returns403() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/member/routine", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("coach-uid-001"))))
            .andExpect(status().isForbidden());
    }

    // --- Helpers ---

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
