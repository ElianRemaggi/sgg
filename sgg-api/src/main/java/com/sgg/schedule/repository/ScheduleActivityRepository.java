package com.sgg.schedule.repository;

import com.sgg.schedule.entity.ScheduleActivity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ScheduleActivityRepository extends JpaRepository<ScheduleActivity, Long> {

    List<ScheduleActivity> findByGymIdAndIsActiveTrueOrderByDayOfWeekAscStartTimeAsc(Long gymId);

    Optional<ScheduleActivity> findByIdAndGymId(Long id, Long gymId);
}
