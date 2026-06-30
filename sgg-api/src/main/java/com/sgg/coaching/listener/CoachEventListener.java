package com.sgg.coaching.listener;

import com.sgg.coaching.entity.CoachAssignment;
import com.sgg.coaching.repository.CoachAssignmentRepository;
import com.sgg.tenancy.event.CoachDeactivatedEvent;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class CoachEventListener {

    private static final Logger log = LoggerFactory.getLogger(CoachEventListener.class);

    private final CoachAssignmentRepository coachAssignmentRepository;

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onCoachDeactivated(CoachDeactivatedEvent event) {
        List<CoachAssignment> active = coachAssignmentRepository
            .findByGymIdAndCoachUserIdAndUnassignedAtIsNull(event.gymId(), event.coachUserId());
        if (active.isEmpty()) return;
        LocalDateTime now = LocalDateTime.now();
        active.forEach(a -> a.setUnassignedAt(now));
        coachAssignmentRepository.saveAll(active);
        log.info("Coach assignments unassigned via event: gymId={}, coachUserId={}, count={}",
            event.gymId(), event.coachUserId(), active.size());
    }
}
