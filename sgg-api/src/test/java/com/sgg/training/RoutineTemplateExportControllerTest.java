package com.sgg.training;

import com.sgg.common.BaseIntegrationTest;
import com.sgg.identity.entity.User;
import com.sgg.identity.repository.UserRepository;
import com.sgg.tenancy.entity.Gym;
import com.sgg.tenancy.entity.GymMember;
import com.sgg.tenancy.repository.GymMemberRepository;
import com.sgg.tenancy.repository.GymRepository;
import com.sgg.training.entity.RoutineTemplate;
import com.sgg.training.entity.TemplateBlock;
import com.sgg.training.entity.TemplateExercise;
import com.sgg.training.repository.RoutineTemplateRepository;
import com.sgg.training.repository.TemplateBlockRepository;
import com.sgg.training.repository.TemplateExerciseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Transactional
class RoutineTemplateExportControllerTest extends BaseIntegrationTest {

    @Autowired private GymRepository gymRepository;
    @Autowired private GymMemberRepository gymMemberRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private RoutineTemplateRepository templateRepository;
    @Autowired private TemplateBlockRepository blockRepository;
    @Autowired private TemplateExerciseRepository exerciseRepository;

    private User coachUser;
    private User memberUser;
    private Gym gym;
    private RoutineTemplate template;

    @BeforeEach
    void setUp() {
        exerciseRepository.deleteAll();
        blockRepository.deleteAll();
        templateRepository.deleteAll();
        gymMemberRepository.deleteAll();
        gymRepository.deleteAll();
        userRepository.deleteAll();

        User admin = createUser("admin-exp-001", "admin-exp@test.com", "Admin Export");
        coachUser  = createUser("coach-exp-001", "coach-exp@test.com", "Coach Export");
        memberUser = createUser("member-exp-001", "member-exp@test.com", "Member Export");

        gym = createGym("Export Gym", "export-gym", admin.getId());

        createMembership(gym.getId(), admin.getId(),  "ADMIN",  "ACTIVE");
        createMembership(gym.getId(), coachUser.getId(), "COACH", "ACTIVE");
        createMembership(gym.getId(), memberUser.getId(), "MEMBER", "ACTIVE");

        // Plantilla con un bloque y un ejercicio
        template = new RoutineTemplate();
        template.setGymId(gym.getId());
        template.setName("Rutina Fuerza");
        template.setDescription("Rutina de fuerza básica");
        template.setCreatedBy(coachUser.getId());
        template = templateRepository.save(template);

        TemplateBlock block = new TemplateBlock();
        block.setTemplateId(template.getId());
        block.setName("Pecho y Tríceps");
        block.setDayNumber(1);
        block.setSortOrder(0);
        block = blockRepository.save(block);

        TemplateExercise exercise = new TemplateExercise();
        exercise.setBlockId(block.getId());
        exercise.setName("Press de Banca");
        exercise.setSets(4);
        exercise.setReps("8-10");
        exercise.setRestSeconds(90);
        exercise.setNotes("Bajar controlado");
        exercise.setSortOrder(0);
        exerciseRepository.save(exercise);
    }

    // ── xlsx ──────────────────────────────────────────────────────────────

    @Test
    void export_xlsx_asCoach_returns200WithCorrectContentType() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/coach/templates/{templateId}/export",
                        gym.getId(), template.getId())
                .param("format", "xlsx")
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                        .jwt(j -> j.subject("coach-exp-001"))))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Type",
                containsString("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")))
            .andExpect(header().string("Content-Disposition", containsString("attachment")))
            .andExpect(header().string("Content-Disposition", containsString(".xlsx")));
    }

    @Test
    void export_xlsx_defaultFormat_returnsXlsx() throws Exception {
        // sin param format → default xlsx
        mockMvc.perform(get("/api/gyms/{gymId}/coach/templates/{templateId}/export",
                        gym.getId(), template.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                        .jwt(j -> j.subject("coach-exp-001"))))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Type",
                containsString("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")));
    }

    // ── csv ───────────────────────────────────────────────────────────────

    @Test
    void export_csv_asCoach_returns200WithCsvContentAndHeaders() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/coach/templates/{templateId}/export",
                        gym.getId(), template.getId())
                .param("format", "csv")
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                        .jwt(j -> j.subject("coach-exp-001"))))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Type", containsString("text/csv")))
            .andExpect(header().string("Content-Disposition", containsString("attachment")))
            .andExpect(header().string("Content-Disposition", containsString(".csv")))
            // el cuerpo debe contener el nombre del ejercicio y las cabeceras de columna
            .andExpect(content().string(containsString("Press de Banca")))
            .andExpect(content().string(containsString("Ejercicio")))
            .andExpect(content().string(containsString("Series")));
    }

    // ── formato inválido ──────────────────────────────────────────────────

    @Test
    void export_invalidFormat_returns409() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/coach/templates/{templateId}/export",
                        gym.getId(), template.getId())
                .param("format", "pdf")
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                        .jwt(j -> j.subject("coach-exp-001"))))
            .andExpect(status().isConflict());
    }

    // ── autorización ─────────────────────────────────────────────────────

    @Test
    void export_asMember_returns403() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/coach/templates/{templateId}/export",
                        gym.getId(), template.getId())
                .param("format", "xlsx")
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                        .jwt(j -> j.subject("member-exp-001"))))
            .andExpect(status().isForbidden());
    }

    @Test
    void export_withoutJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/coach/templates/{templateId}/export",
                        gym.getId(), template.getId())
                .param("format", "xlsx"))
            .andExpect(status().isUnauthorized());
    }

    // ── template inexistente ──────────────────────────────────────────────

    @Test
    void export_templateNotFound_returns404() throws Exception {
        mockMvc.perform(get("/api/gyms/{gymId}/coach/templates/{templateId}/export",
                        gym.getId(), 99999L)
                .param("format", "xlsx")
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                        .jwt(j -> j.subject("coach-exp-001"))))
            .andExpect(status().isNotFound());
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private User createUser(String uid, String email, String name) {
        User user = new User();
        user.setSupabaseUid(uid);
        user.setEmail(email);
        user.setFullName(name);
        user.setUsername(uid.replace("-", "_").substring(0, Math.min(30, uid.replace("-", "_").length())));
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
