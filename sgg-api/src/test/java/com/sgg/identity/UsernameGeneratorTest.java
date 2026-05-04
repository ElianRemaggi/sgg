package com.sgg.identity;

import com.sgg.common.BaseIntegrationTest;
import com.sgg.identity.entity.User;
import com.sgg.identity.repository.UserRepository;
import com.sgg.identity.service.UsernameGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class UsernameGeneratorTest extends BaseIntegrationTest {

    @Autowired
    private UsernameGenerator usernameGenerator;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void generate_simpleEmail_returnsPrefixLowercase() {
        assertThat(usernameGenerator.generateFromEmail("juan@gmail.com")).isEqualTo("juan");
    }

    @Test
    void generate_uppercaseAndDots_normalizes() {
        // "Juan.Perez" → lowercase "juan.perez" → replace dots → "juan_perez"
        assertThat(usernameGenerator.generateFromEmail("Juan.Perez@gmail.com")).isEqualTo("juan_perez");
    }

    @Test
    void generate_shortPrefix_paddsWithUnderscore() {
        // "ab" → length 2 < 3 → "ab_"
        assertThat(usernameGenerator.generateFromEmail("ab@test.com")).isEqualTo("ab_");
    }

    @Test
    void generate_singleChar_paddsToThree() {
        assertThat(usernameGenerator.generateFromEmail("a@test.com")).isEqualTo("a__");
    }

    @Test
    void generate_longPrefix_truncatesTo30() {
        // 35-char prefix should be truncated to 30
        String longEmail = "aaaaabbbbbcccccdddddeeeeefffff00@test.com";
        String result = usernameGenerator.generateFromEmail(longEmail);
        assertThat(result).hasSize(30);
        assertThat(result).isEqualTo("aaaaabbbbbcccccdddddeeeeefffff");
    }

    @Test
    void generate_collision_addsSuffix() {
        saveUser("gen1", "juan@a.com", "juan");
        assertThat(usernameGenerator.generateFromEmail("juan@b.com")).isEqualTo("juan2");
    }

    @Test
    void generate_multipleCollisions_incrementsSuffix() {
        saveUser("gen1", "juan@a.com", "juan");
        saveUser("gen2", "juan@b.com", "juan2");
        saveUser("gen3", "juan@c.com", "juan3");
        assertThat(usernameGenerator.generateFromEmail("juan@d.com")).isEqualTo("juan4");
    }

    @Test
    void generate_collisionWith30CharBase_truncatesBaseForSuffix() {
        // Base of exactly 30 chars → collision → suffix appended by truncating base
        String base30 = "aaaaabbbbbcccccdddddeeeeefffff";  // 30 chars
        saveUser("gen1", "x@x.com", base30);
        String result = usernameGenerator.generateFromEmail("aaaaabbbbbcccccdddddeeeeefffff00@test.com");
        assertThat(result).hasSize(30);
        assertThat(result).endsWith("2");
    }

    private void saveUser(String uid, String email, String username) {
        User u = new User();
        u.setSupabaseUid(uid);
        u.setEmail(email);
        u.setFullName("Test");
        u.setUsername(username);
        userRepository.save(u);
    }
}
