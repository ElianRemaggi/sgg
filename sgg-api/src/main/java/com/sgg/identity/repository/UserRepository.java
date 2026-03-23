package com.sgg.identity.repository;

import com.sgg.identity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findBySupabaseUid(String supabaseUid);

    Optional<User> findByEmail(String email);

    List<User> findByPlatformRole(String platformRole);

    long countByPlatformRole(String platformRole);

    @Query("""
        SELECT u FROM User u
        WHERE LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
           OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
        ORDER BY u.fullName
    """)
    List<User> searchByNameOrEmail(@Param("search") String search);
}
