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
class RoutineTemplateControllerTest extends BaseIntegrationTest {

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
    private RoutineTemplate existingTemplate;

    private static final String VALID_TEMPLATE_JSON = """
        {
            "name": "Rutina Fuerza 4 días",
            "description": "Rutina de fuerza para nivel intermedio",
            "blocks": [
                {
                    "name": "Día 1 - Pecho y Tríceps",
                    "dayNumber": 1,
                    "sortOrder": 0,
                    "exercises": [
                        {
                            "name": "Press de Banca",
                            "sets": 4,
                            "reps": "8-10",
                            "restSeconds": 90,
                            "notes": "Bajar controlado",
                            "sortOrder": 0
                        },
                        {
                            "name": "Fondos en paralelas",
                            "sets": 3,
                            "reps": "10-12",
                            "restSeconds": 60,
                            "sortOrder": 10
                        }
                    ]
                },
                {
                    "name": "Día 2 - Espalda y Bíceps",
                    "dayNumber": 2,
                    "sortOrder": 10,
                    "exercises": [
                        {
                            "name": "Dominadas",
                            "sets": 4,
                            "reps": "6-8",
                            "restSeconds": 120,
                            "sortOrder": 0
                        }
                    ]
                }
            ]
        }
        """;

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

        // Create an existing template for GET/PUT/DELETE tests
        existingTemplate = new RoutineTemplate();
        existingTemplate.setGymId(gym.getId());
        existingTemplate.setName("Plantilla existente");
        existingTemplate.setDescription("Descripción");
        existingTemplate.setCreatedBy(coachUser.getId());
        existingTemplate = templateRepository.save(existingTemplate);

        TemplateBlock block = new TemplateBlock();
        block.setTemplateId(existingTemplate.getId());
        block.setName("Día 1");
        block.setDayNumber(1);
        block.setSortOrder(0);
        block = blockRepository.save(block);

        TemplateExercise exercise = new TemplateExercise();
        exercise.setBlockId(block.getId());
        exercise.setName("Sentadillas");
        exercise.setSets(4);
        exercise.setReps("8-10");
        exercise.setRestSeconds(90);
        exercise.setSortOrder(0);
        exerciseRepository.save(exercise);
    }

    // --- POST: Create template ---

    @Test
    void createTemplate_asCoach_returns201() throws Exception {
        mockMvc.perform(post("/api/gyms/{gymId}/coach/templates", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("coach-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(VALID_TEMPLATE_JSON))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.name").value("Rutina Fuerza 4 días"))
            .andExpect(jsonPath("$.data.blocks").isArray())
            .andExpect(jsonPath("$.data.blocks.length()").value(2))
            .andExpect(jsonPath("$.data.blocks[0].exercises.length()").value(2))
            .andExpect(jsonPath("$.data.blocks[1].exercises.length()").value(1));
    }

    @Test
    void createTemplate_blankName_returns400() throws Exception {
        String json = """
            {
                "name": "",
                "blocks": [{"name": "Día 1", "dayNumber": 1, "exercises": []}]
            }
            """;

        mockMvc.perform(post("/api/gyms/{gymId}/coach/templates", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("coach-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isBadRequest());
    }

    @Test
    void createTemplate_noBlocks_returns400() throws Exception {
        String json = """
            {
                "name": "Rutina sin bloques",
                "blocks": []
            }
            """;

        mockMvc.perform(post("/api/gyms/{gymId}/coach/templates", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("coach-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isBadRequest());
    }

    // --- GET: List templates ---

    @Test
    void listTemplates_tenantIsolation_onlyCurrentGym() throws Exception {
        // Create a template in otherGym
        User otherCoach = createUser("other-coach-uid", "other-coach@test.com", "Other Coach");
        createMembership(otherGym.getId(), otherCoach.getId(), "COACH", "ACTIVE");

        RoutineTemplate otherTemplate = new RoutineTemplate();
        otherTemplate.setGymId(otherGym.getId());
        otherTemplate.setName("Otra plantilla");
        otherTemplate.setCreatedBy(otherCoach.getId());
        templateRepository.save(otherTemplate);

        mockMvc.perform(get("/api/gyms/{gymId}/coach/templates", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("coach-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].name").value("Plantilla existente"));
    }

    // --- GET: Template detail ---

    @Test
    void getTemplateDetail_returns200WithBlocksAndExercises() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/coach/templates/{templateId}", gym.getId(), existingTemplate.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("coach-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.name").value("Plantilla existente"))
            .andExpect(jsonPath("$.data.blocks.length()").value(1))
            .andExpect(jsonPath("$.data.blocks[0].exercises.length()").value(1))
            .andExpect(jsonPath("$.data.blocks[0].exercises[0].name").value("Sentadillas"));
    }

    @Test
    void getTemplateDetail_otherGymTemplate_returns404() throws Exception {
        RoutineTemplate otherTemplate = new RoutineTemplate();
        otherTemplate.setGymId(otherGym.getId());
        otherTemplate.setName("Otra plantilla");
        otherTemplate.setCreatedBy(coachUser.getId());
        otherTemplate = templateRepository.save(otherTemplate);

        mockMvc.perform(get("/api/gyms/{gymId}/coach/templates/{templateId}", gym.getId(), otherTemplate.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("coach-uid-001"))))
            .andExpect(status().isNotFound());
    }

    // --- PUT: Update template ---

    @Test
    void updateTemplate_replacesBlocksAndExercises() throws Exception {
        String updateJson = """
            {
                "name": "Plantilla actualizada",
                "description": "Nueva descripción",
                "blocks": [
                    {
                        "name": "Nuevo Día 1",
                        "dayNumber": 1,
                        "sortOrder": 0,
                        "exercises": [
                            {"name": "Press Militar", "sets": 3, "reps": "10", "sortOrder": 0}
                        ]
                    }
                ]
            }
            """;

        mockMvc.perform(put("/api/gyms/{gymId}/coach/templates/{templateId}", gym.getId(), existingTemplate.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("coach-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.name").value("Plantilla actualizada"))
            .andExpect(jsonPath("$.data.blocks.length()").value(1))
            .andExpect(jsonPath("$.data.blocks[0].name").value("Nuevo Día 1"))
            .andExpect(jsonPath("$.data.blocks[0].exercises[0].name").value("Press Militar"));
    }

    @Test
    void updateTemplate_withActiveAssignments_returns409() throws Exception {
        RoutineAssignment assignment = new RoutineAssignment();
        assignment.setGymId(gym.getId());
        assignment.setTemplateId(existingTemplate.getId());
        assignment.setMemberUserId(memberUser.getId());
        assignment.setAssignedBy(coachUser.getId());
        assignment.setStartsAt(LocalDateTime.now().minusDays(1));
        assignmentRepository.save(assignment);

        mockMvc.perform(put("/api/gyms/{gymId}/coach/templates/{templateId}", gym.getId(), existingTemplate.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("coach-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(VALID_TEMPLATE_JSON))
            .andExpect(status().isConflict());
    }

    // --- DELETE: Soft delete ---

    @Test
    void deleteTemplate_softDeletes() throws Exception {
        mockMvc.perform(delete("/api/gyms/{gymId}/coach/templates/{templateId}", gym.getId(), existingTemplate.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("coach-uid-001"))))
            .andExpect(status().isNoContent());

        // Verify it's no longer returned in list
        mockMvc.perform(get("/api/gyms/{gymId}/coach/templates", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("coach-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void deleteTemplate_withActiveAssignments_returns409() throws Exception {
        RoutineAssignment assignment = new RoutineAssignment();
        assignment.setGymId(gym.getId());
        assignment.setTemplateId(existingTemplate.getId());
        assignment.setMemberUserId(memberUser.getId());
        assignment.setAssignedBy(coachUser.getId());
        assignment.setStartsAt(LocalDateTime.now().minusDays(1));
        assignmentRepository.save(assignment);

        mockMvc.perform(delete("/api/gyms/{gymId}/coach/templates/{templateId}", gym.getId(), existingTemplate.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("coach-uid-001"))))
            .andExpect(status().isConflict());
    }

    @Test
    void deleteTemplate_alreadyDeleted_returns404() throws Exception {
        existingTemplate.setDeletedAt(LocalDateTime.now());
        templateRepository.save(existingTemplate);

        mockMvc.perform(delete("/api/gyms/{gymId}/coach/templates/{templateId}", gym.getId(), existingTemplate.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("coach-uid-001"))))
            .andExpect(status().isNotFound());
    }

    // --- Auth tests ---

    @Test
    void allEndpoints_memberRole_returns403() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/coach/templates", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001"))))
            .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/gyms/{gymId}/coach/templates", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(VALID_TEMPLATE_JSON))
            .andExpect(status().isForbidden());
    }

    @Test
    void allEndpoints_withoutJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/coach/templates", gym.getId()))
            .andExpect(status().isUnauthorized());
    }

    // --- Helpers ---

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
