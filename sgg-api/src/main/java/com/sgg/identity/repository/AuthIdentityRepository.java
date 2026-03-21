package com.sgg.identity.repository;

import com.sgg.identity.entity.AuthIdentity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuthIdentityRepository extends JpaRepository<AuthIdentity, Long> {

    Optional<AuthIdentity> findByProviderAndProviderUid(String provider, String providerUid);

    boolean existsByProviderAndProviderUid(String provider, String providerUid);
}
