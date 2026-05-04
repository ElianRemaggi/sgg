package com.sgg.tenancy;

import com.sgg.common.BaseIntegrationTest;
import com.sgg.identity.entity.User;
import com.sgg.identity.repository.UserRepository;
import com.sgg.tenancy.entity.Gym;
import com.sgg.tenancy.repository.GymMemberRepository;
import com.sgg.tenancy.repository.GymRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Transactional
class GymSearchControllerTest extends BaseIntegrationTest {

    @Autowired
    private GymRepository gymRepository;

    @Autowired
    private GymMemberRepository gymMemberRepository;

    @Autowired
    private UserRepository userRepository;

    private User owner;

    @BeforeEach
    void setUp() {
        gymMemberRepository.deleteAll();
        gymRepository.deleteAll();
        userRepository.deleteAll();

        owner = new User();
        owner.setSupabaseUid("owner-uid-001");
        owner.setEmail("owner@test.com");
        owner.setFullName("Gym Owner");
        owner.setUsername("owner_uid_001");
        owner = userRepository.save(owner);
    }

    @Test
    void searchBySlug_activeGym_returns200() throws Exception {
        Gym gym = new Gym();
        gym.setName("CrossFit Norte");
        gym.setSlug("crossfit-norte");
        gym.setDescription("El mejor gym del norte");
        gym.setOwnerUserId(owner.getId());
        gym.setStatus("ACTIVE");
        gymRepository.save(gym);

        mockMvc.perform(get("/api/gyms/search").param("slug", "crossfit-norte"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.name").value("CrossFit Norte"))
            .andExpect(jsonPath("$.data.slug").value("crossfit-norte"));
    }

    @Test
    void searchBySlug_nonExistent_returns404() throws Exception {
        mockMvc.perform(get("/api/gyms/search").param("slug", "no-existe"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void searchBySlug_suspendedGym_returns404() throws Exception {
        Gym gym = new Gym();
        gym.setName("Gym Suspendido");
        gym.setSlug("gym-suspendido");
        gym.setOwnerUserId(owner.getId());
        gym.setStatus("SUSPENDED");
        gymRepository.save(gym);

        mockMvc.perform(get("/api/gyms/search").param("slug", "gym-suspendido"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false));
    }

    // ─── Search by name ───

    @Test
    void searchByName_partialMatch_returnsResults() throws Exception {
        createActiveGym("CrossFit Norte", "crossfit-norte");
        createActiveGym("CrossFit Sur", "crossfit-sur");
        createActiveGym("Gym Power", "gym-power");

        mockMvc.perform(get("/api/gyms/search/by-name").param("q", "cross")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("owner-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(2))
            .andExpect(jsonPath("$.data[0].name").value("CrossFit Norte"))
            .andExpect(jsonPath("$.data[1].name").value("CrossFit Sur"));
    }

    @Test
    void searchByName_noResults_returnsEmptyList() throws Exception {
        createActiveGym("CrossFit Norte", "crossfit-norte");

        mockMvc.perform(get("/api/gyms/search/by-name").param("q", "yoga")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("owner-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void searchByName_onlyReturnsActiveGyms() throws Exception {
        createActiveGym("CrossFit Norte", "crossfit-norte");

        Gym suspended = new Gym();
        suspended.setName("CrossFit Suspendido");
        suspended.setSlug("crossfit-suspendido");
        suspended.setOwnerUserId(owner.getId());
        suspended.setStatus("SUSPENDED");
        gymRepository.save(suspended);

        mockMvc.perform(get("/api/gyms/search/by-name").param("q", "CrossFit")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("owner-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].name").value("CrossFit Norte"));
    }

    @Test
    void searchByName_shortQuery_returnsEmptyList() throws Exception {
        createActiveGym("CrossFit Norte", "crossfit-norte");

        mockMvc.perform(get("/api/gyms/search/by-name").param("q", "a")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("owner-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void searchByName_withoutJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/gyms/search/by-name").param("q", "cross"))
            .andExpect(status().isUnauthorized());
    }

    private Gym createActiveGym(String name, String slug) {
        Gym gym = new Gym();
        gym.setName(name);
        gym.setSlug(slug);
        gym.setOwnerUserId(owner.getId());
        gym.setStatus("ACTIVE");
        return gymRepository.save(gym);
    }
}
