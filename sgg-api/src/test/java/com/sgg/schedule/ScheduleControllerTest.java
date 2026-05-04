package com.sgg.schedule;

import com.sgg.common.BaseIntegrationTest;
import com.sgg.identity.entity.User;
import com.sgg.identity.repository.UserRepository;
import com.sgg.schedule.entity.ScheduleActivity;
import com.sgg.schedule.repository.ScheduleActivityRepository;
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

import java.time.LocalTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Transactional
class ScheduleControllerTest extends BaseIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private GymRepository gymRepository;
    @Autowired private GymMemberRepository gymMemberRepository;
    @Autowired private ScheduleActivityRepository activityRepository;

    private User adminUser;
    private User memberUser;
    private Gym gym;
    private Gym otherGym;

    @BeforeEach
    void setUp() {
        activityRepository.deleteAll();
        gymMemberRepository.deleteAll();
        gymRepository.deleteAll();
        userRepository.deleteAll();

        adminUser = createUser("admin-uid-001", "admin@test.com", "Admin");
        memberUser = createUser("member-uid-001", "member@test.com", "Member");

        gym = createGym("Gym Test", "gym-test", adminUser.getId());
        otherGym = createGym("Otro Gym", "otro-gym", adminUser.getId());

        createMembership(gym.getId(), adminUser.getId(), "ADMIN", "ACTIVE");
        createMembership(gym.getId(), memberUser.getId(), "MEMBER", "ACTIVE");
    }

    @Test
    void getSchedule_asAuthenticated_returns200() throws Exception {
        createActivity(gym.getId(), "Yoga", 1, "08:00", "09:00");
        createActivity(gym.getId(), "Crossfit", 1, "09:30", "10:30");

        mockMvc.perform(get("/api/gyms/{gymId}/schedule", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(2))
            .andExpect(jsonPath("$.data[0].name").value("Yoga"))
            .andExpect(jsonPath("$.data[0].dayName").value("Lunes"));
    }

    @Test
    void createActivity_asAdmin_returns201() throws Exception {
        String json = """
            {
                "name": "Pilates",
                "description": "Clase de pilates",
                "dayOfWeek": 3,
                "startTime": "10:00",
                "endTime": "11:00"
            }
            """;

        mockMvc.perform(post("/api/gyms/{gymId}/admin/schedule", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("admin-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.name").value("Pilates"))
            .andExpect(jsonPath("$.data.dayName").value("Miércoles"))
            .andExpect(jsonPath("$.data.startTime").value("10:00"))
            .andExpect(jsonPath("$.data.isActive").value(true));
    }

    @Test
    void createActivity_memberCantCreate_returns403() throws Exception {
        String json = """
            {"name": "Yoga", "dayOfWeek": 1, "startTime": "08:00", "endTime": "09:00"}
            """;

        mockMvc.perform(post("/api/gyms/{gymId}/admin/schedule", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isForbidden());
    }

    @Test
    void createActivity_endTimeBeforeStart_returns409() throws Exception {
        String json = """
            {"name": "Yoga", "dayOfWeek": 1, "startTime": "10:00", "endTime": "09:00"}
            """;

        mockMvc.perform(post("/api/gyms/{gymId}/admin/schedule", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("admin-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isConflict());
    }

    @Test
    void updateActivity_asAdmin_returns200() throws Exception {
        ScheduleActivity activity = createActivity(gym.getId(), "Yoga", 1, "08:00", "09:00");

        String json = """
            {
                "name": "Yoga Avanzado",
                "dayOfWeek": 2,
                "startTime": "09:00",
                "endTime": "10:00"
            }
            """;

        mockMvc.perform(put("/api/gyms/{gymId}/admin/schedule/{id}", gym.getId(), activity.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("admin-uid-001")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.name").value("Yoga Avanzado"))
            .andExpect(jsonPath("$.data.dayName").value("Martes"));
    }

    @Test
    void deactivateActivity_asAdmin_returns200() throws Exception {
        ScheduleActivity activity = createActivity(gym.getId(), "Yoga", 1, "08:00", "09:00");

        mockMvc.perform(delete("/api/gyms/{gymId}/admin/schedule/{id}", gym.getId(), activity.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("admin-uid-001"))))
            .andExpect(status().isOk());

        // Should not appear in list anymore
        mockMvc.perform(get("/api/gyms/{gymId}/schedule", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001"))))
            .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void tenantIsolation_cantSeeOtherGymActivities() throws Exception {
        // Activity in otherGym — member is not in otherGym, should get 403 (tenant violation)
        mockMvc.perform(get("/api/gyms/{gymId}/schedule", otherGym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001"))))
            .andExpect(status().isForbidden());
    }

    // ── Helpers ──

    private ScheduleActivity createActivity(Long gymId, String name, int day, String start, String end) {
        ScheduleActivity a = new ScheduleActivity();
        a.setGymId(gymId);
        a.setName(name);
        a.setDayOfWeek(day);
        a.setStartTime(LocalTime.parse(start));
        a.setEndTime(LocalTime.parse(end));
        a.setIsActive(true);
        return activityRepository.save(a);
    }

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
