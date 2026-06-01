package com.sgg.common;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    // TEST_DB_URL env var bypasses Testcontainers (útil cuando Docker API version
    // es incompatible con docker-java, ej: Docker Engine 29 + docker-java 3.4.x)
    private static final String EXTERNAL_DB_URL = System.getenv("TEST_DB_URL");
    private static final String EXTERNAL_DB_USER = System.getenv("TEST_DB_USERNAME");
    private static final String EXTERNAL_DB_PASS = System.getenv("TEST_DB_PASSWORD");

    static final PostgreSQLContainer<?> postgres;

    static {
        if (EXTERNAL_DB_URL != null) {
            postgres = null;
        } else {
            postgres = new PostgreSQLContainer<>("postgres:16-alpine");
            postgres.start();
        }
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        if (EXTERNAL_DB_URL != null) {
            registry.add("spring.datasource.url", () -> EXTERNAL_DB_URL);
            registry.add("spring.datasource.username", () -> EXTERNAL_DB_USER != null ? EXTERNAL_DB_USER : "sgg_admin");
            registry.add("spring.datasource.password", () -> EXTERNAL_DB_PASS != null ? EXTERNAL_DB_PASS : "sgg_prod_password");
        } else {
            registry.add("spring.datasource.url", postgres::getJdbcUrl);
            registry.add("spring.datasource.username", postgres::getUsername);
            registry.add("spring.datasource.password", postgres::getPassword);
        }
    }

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;
}
