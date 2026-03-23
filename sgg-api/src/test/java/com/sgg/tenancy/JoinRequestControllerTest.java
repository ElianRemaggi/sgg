package com.sgg.tenancy;

import com.sgg.common.BaseIntegrationTest;
import com.sgg.identity.entity.User;
import com.sgg.identity.repository.UserRepository;
import com.sgg.tenancy.entity.Gym;
import com.sgg.tenancy.entity.GymMember;
import com.sgg.tenancy.repository.GymMemberRepository;
import com.sgg.tenancy.repository.GymRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Transactional
class JoinRequestControllerTest extends BaseIntegrationTest {

    @Autowired
    private GymRepository gymRepository;

    @Autowired
    private GymMemberRepository gymMemberRepository;

    @Autowired
    private UserRepository userRepository;

    private User owner;
    private User member;
    private Gym gym;

    @BeforeEach
    void setUp() {
        gymMemberRepository.deleteAll();
        gymRepository.deleteAll();
        userRepository.deleteAll();

        owner = new User();
        owner.setSupabaseUid("owner-uid-001");
        owner.setEmail("owner@test.com");
        owner.setFullName("Gym Owner");
        owner = userRepository.save(owner);

        member = new User();
        member.setSupabaseUid("member-uid-001");
        member.setEmail("member@test.com");
        member.setFullName("New Member");
        member = userRepository.save(member);

        gym = new Gym();
        gym.setName("CrossFit Norte");
        gym.setSlug("crossfit-norte");
        gym.setOwnerUserId(owner.getId());
        gym.setStatus("ACTIVE");
        gym = gymRepository.save(gym);
    }

    @Test
    void joinRequest_success_returns201() throws Exception {
        mockMvc.perform(post("/api/gyms/{gymId}/join-request", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001"))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.status").value("PENDING"))
            .andExpect(jsonPath("$.data.gymName").value("CrossFit Norte"));
    }

    @Test
    void joinRequest_duplicatePending_returns409() throws Exception {
        GymMember existing = new GymMember();
        existing.setGymId(gym.getId());
        existing.setUserId(member.getId());
        existing.setRole("MEMBER");
        existing.setStatus("PENDING");
        gymMemberRepository.save(existing);

        mockMvc.perform(post("/api/gyms/{gymId}/join-request", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001"))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void joinRequest_duplicateActive_returns409() throws Exception {
        GymMember existing = new GymMember();
        existing.setGymId(gym.getId());
        existing.setUserId(member.getId());
        existing.setRole("MEMBER");
        existing.setStatus("ACTIVE");
        gymMemberRepository.save(existing);

        mockMvc.perform(post("/api/gyms/{gymId}/join-request", gym.getId())
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001"))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void joinRequest_gymNotFound_returns404() throws Exception {
        mockMvc.perform(post("/api/gyms/99999/join-request")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("member-uid-001"))))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void joinRequest_withoutJwt_returns401() throws Exception {
        mockMvc.perform(post("/api/gyms/{gymId}/join-request", gym.getId()))
            .andExpect(status().isUnauthorized());
    }
}
