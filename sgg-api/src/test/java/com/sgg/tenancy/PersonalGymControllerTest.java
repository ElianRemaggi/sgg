package com.sgg.tenancy;

import com.sgg.common.BaseIntegrationTest;
import com.sgg.identity.entity.User;
import com.sgg.identity.repository.UserRepository;
import com.sgg.tenancy.entity.Gym;
import com.sgg.tenancy.entity.GymMember;
import com.sgg.tenancy.repository.GymMemberRepository;
import com.sgg.tenancy.repository.GymRepository;
import com.sgg.training.entity.RoutineTemplate;
import com.sgg.training.repository.RoutineAssignmentRepository;
import com.sgg.training.repository.TemplateBlockRepository;
import com.sgg.training.repository.TemplateExerciseRepository;
import com.sgg.training.repository.RoutineTemplateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Transactional
class PersonalGymControllerTest extends BaseIntegrationTest {

    @Autowired private GymRepository gymRepository;
    @Autowired private GymMemberRepository gymMemberRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private RoutineTemplateRepository templateRepository;
    @Autowired private RoutineAssignmentRepository assignmentRepository;
    @Autowired private TemplateBlockRepository blockRepository;
    @Autowired private TemplateExerciseRepository exerciseRepository;

    private User user;

    @BeforeEach
    void setUp() {
        assignmentRepository.deleteAll();
        exerciseRepository.deleteAll();
        blockRepository.deleteAll();
        templateRepository.deleteAll();
        gymMemberRepository.deleteAll();
        gymRepository.deleteAll();
        userRepository.deleteAll();

        user = new User();
        user.setSupabaseUid("user-personal-001");
        user.setEmail("personal@test.com");
        user.setFullName("Personal User");
        user.setUsername("personal_user_001");
        user = userRepository.save(user);
    }

    // ─── Ensure personal gym ───────────────────────────────────────────────

    @Test
    void ensurePersonalGym_firstCall_createsGymAndMembership() throws Exception {
        mockMvc.perform(post("/api/users/me/personal-gym")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("user-personal-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.gymId").isNumber());

        List<Gym> personalGyms = gymRepository.findAll().stream()
            .filter(g -> "PERSONAL".equals(g.getType()))
            .toList();
        assertThat(personalGyms).hasSize(1);
        assertThat(personalGyms.get(0).getOwnerUserId()).isEqualTo(user.getId());

        List<GymMember> members = gymMemberRepository.findByUserId(user.getId());
        assertThat(members).hasSize(1);
        assertThat(members.get(0).getRole()).isEqualTo("MEMBER");
        assertThat(members.get(0).getStatus()).isEqualTo("ACTIVE");
    }

    @Test
    void ensurePersonalGym_calledTwice_isIdempotent() throws Exception {
        // Primera llamada
        String firstResponse = mockMvc.perform(post("/api/users/me/personal-gym")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("user-personal-001"))))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        // Segunda llamada — no debe duplicar
        mockMvc.perform(post("/api/users/me/personal-gym")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("user-personal-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.gymId").isNumber());

        long personalGymCount = gymRepository.findAll().stream()
            .filter(g -> "PERSONAL".equals(g.getType()))
            .count();
        assertThat(personalGymCount).isEqualTo(1);

        assertThat(gymMemberRepository.findByUserId(user.getId())).hasSize(1);
    }

    @Test
    void ensurePersonalGym_withoutJwt_returns401() throws Exception {
        mockMvc.perform(post("/api/users/me/personal-gym"))
            .andExpect(status().isUnauthorized());
    }

    // ─── Owner puede crear plantillas en su gym personal ───────────────────

    @Test
    void personalGymOwner_canCreateTemplate() throws Exception {
        // Crear gym personal
        String gymResponse = mockMvc.perform(post("/api/users/me/personal-gym")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("user-personal-001"))))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        Long gymId = objectMapper.readTree(gymResponse).get("data").get("gymId").asLong();

        String templateJson = """
            {
                "name": "Mi Rutina Push",
                "description": "Rutina personal",
                "blocks": [{"name": "Bloque A", "dayNumber": 1, "sortOrder": 1, "exercises": []}]
            }
            """;

        mockMvc.perform(post("/api/gyms/{gymId}/coach/templates", gymId)
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("user-personal-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(templateJson))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.name").value("Mi Rutina Push"));
    }

    @Test
    void regularMemberOfStandardGym_cannotCreateTemplate() throws Exception {
        // Crear gym STANDARD con admin
        User admin = new User();
        admin.setSupabaseUid("admin-std-001");
        admin.setEmail("admin@std.com");
        admin.setFullName("Admin Std");
        admin.setUsername("admin_std_001");
        admin = userRepository.save(admin);

        Gym standardGym = new Gym();
        standardGym.setName("Gym Estandar");
        standardGym.setSlug("gym-estandar-test");
        standardGym.setOwnerUserId(admin.getId());
        standardGym.setStatus("ACTIVE");
        standardGym = gymRepository.save(standardGym);

        GymMember memberInStandard = new GymMember();
        memberInStandard.setGymId(standardGym.getId());
        memberInStandard.setUserId(user.getId());
        memberInStandard.setRole("MEMBER");
        memberInStandard.setStatus("ACTIVE");
        gymMemberRepository.save(memberInStandard);

        String templateJson = """
            { "name": "Intento crear", "description": null, "blocks": [{"name": "Bloque A", "dayNumber": 1, "exercises": []}] }
            """;

        mockMvc.perform(post("/api/gyms/{gymId}/coach/templates", standardGym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("user-personal-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(templateJson))
            .andExpect(status().isForbidden());
    }

    // ─── Auto-asignación en gym personal ───────────────────────────────────

    @Test
    void personalGymOwner_canSelfAssign() throws Exception {
        String gymResponse = mockMvc.perform(post("/api/users/me/personal-gym")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("user-personal-001"))))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        Long gymId = objectMapper.readTree(gymResponse).get("data").get("gymId").asLong();

        RoutineTemplate template = new RoutineTemplate();
        template.setGymId(gymId);
        template.setName("Mi Rutina");
        template.setCreatedBy(user.getId());
        template = templateRepository.save(template);

        String json = String.format("""
            {
                "templateId": %d,
                "memberUserId": %d,
                "startsAt": "2026-01-01T00:00:00"
            }
            """, template.getId(), user.getId());

        mockMvc.perform(post("/api/gyms/{gymId}/coach/assignments", gymId)
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("user-personal-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.templateName").value("Mi Rutina"));
    }

    // ─── Finalizar rutina activa ────────────────────────────────────────────

    @Test
    void finishActiveRoutine_thenCanStartAnother() throws Exception {
        String gymResponse = mockMvc.perform(post("/api/users/me/personal-gym")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("user-personal-001"))))
            .andReturn().getResponse().getContentAsString();

        Long gymId = objectMapper.readTree(gymResponse).get("data").get("gymId").asLong();

        RoutineTemplate template1 = new RoutineTemplate();
        template1.setGymId(gymId);
        template1.setName("Rutina 1");
        template1.setCreatedBy(user.getId());
        template1 = templateRepository.save(template1);

        RoutineTemplate template2 = new RoutineTemplate();
        template2.setGymId(gymId);
        template2.setName("Rutina 2");
        template2.setCreatedBy(user.getId());
        template2 = templateRepository.save(template2);

        // Asignar primera rutina
        String assignJson = String.format("""
            { "templateId": %d, "memberUserId": %d, "startsAt": "2026-01-01T00:00:00" }
            """, template1.getId(), user.getId());

        mockMvc.perform(post("/api/gyms/{gymId}/coach/assignments", gymId)
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("user-personal-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(assignJson))
            .andExpect(status().isCreated());

        // Finalizar rutina activa
        mockMvc.perform(post("/api/gyms/{gymId}/member/routine/finish", gymId)
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("user-personal-001"))))
            .andExpect(status().isOk());

        // Ahora puede asignar segunda rutina sin error BUG-05
        String assignJson2 = String.format("""
            { "templateId": %d, "memberUserId": %d, "startsAt": "2026-02-01T00:00:00" }
            """, template2.getId(), user.getId());

        mockMvc.perform(post("/api/gyms/{gymId}/coach/assignments", gymId)
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("user-personal-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(assignJson2))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.templateName").value("Rutina 2"));
    }

    @Test
    void finishActiveRoutine_noActiveRoutine_returns404() throws Exception {
        String gymResponse = mockMvc.perform(post("/api/users/me/personal-gym")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("user-personal-001"))))
            .andReturn().getResponse().getContentAsString();

        Long gymId = objectMapper.readTree(gymResponse).get("data").get("gymId").asLong();

        mockMvc.perform(post("/api/gyms/{gymId}/member/routine/finish", gymId)
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("user-personal-001"))))
            .andExpect(status().isNotFound());
    }
}
