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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Transactional
class MembershipControllerTest extends BaseIntegrationTest {

    @Autowired
    private GymRepository gymRepository;

    @Autowired
    private GymMemberRepository gymMemberRepository;

    @Autowired
    private UserRepository userRepository;

    private User user;

    @BeforeEach
    void setUp() {
        gymMemberRepository.deleteAll();
        gymRepository.deleteAll();
        userRepository.deleteAll();

        user = new User();
        user.setSupabaseUid("user-uid-001");
        user.setEmail("user@test.com");
        user.setFullName("Test User");
        user.setUsername("user_uid_001");
        user = userRepository.save(user);
    }

    @Test
    void getMemberships_withActiveMembership_returnsList() throws Exception {
        User owner = new User();
        owner.setSupabaseUid("owner-uid-001");
        owner.setEmail("owner@test.com");
        owner.setFullName("Owner");
        owner.setUsername("owner_uid_001");
        owner = userRepository.save(owner);

        Gym gym = new Gym();
        gym.setName("CrossFit Norte");
        gym.setSlug("crossfit-norte");
        gym.setOwnerUserId(owner.getId());
        gym.setStatus("ACTIVE");
        gym = gymRepository.save(gym);

        GymMember membership = new GymMember();
        membership.setGymId(gym.getId());
        membership.setUserId(user.getId());
        membership.setRole("MEMBER");
        membership.setStatus("ACTIVE");
        gymMemberRepository.save(membership);

        mockMvc.perform(get("/api/users/me/memberships")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("user-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data[0].gymName").value("CrossFit Norte"))
            .andExpect(jsonPath("$.data[0].role").value("MEMBER"))
            .andExpect(jsonPath("$.data[0].status").value("ACTIVE"));
    }

    @Test
    void getMemberships_noMemberships_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/users/me/memberships")
                .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("user-uid-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data").isEmpty());
    }
}
