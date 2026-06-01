package com.sgg.platform.repository;

import com.sgg.platform.entity.GymRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GymRequestRepository extends JpaRepository<GymRequest, Long> {

    Page<GymRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<GymRequest> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    long countByStatus(String status);
}
