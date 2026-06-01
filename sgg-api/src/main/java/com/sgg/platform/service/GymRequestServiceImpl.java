package com.sgg.platform.service;

import com.sgg.common.exception.ResourceNotFoundException;
import com.sgg.platform.dto.GymRequestDto;
import com.sgg.platform.dto.GymRequestSubmission;
import com.sgg.platform.entity.GymRequest;
import com.sgg.platform.repository.GymRequestRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class GymRequestServiceImpl implements GymRequestService {

    private static final Logger log = LoggerFactory.getLogger(GymRequestServiceImpl.class);

    private final GymRequestRepository gymRequestRepository;

    @Override
    public GymRequestDto submit(GymRequestSubmission submission) {
        GymRequest request = new GymRequest();
        request.setGymName(submission.gymName());
        request.setContactName(submission.contactName());
        request.setEmail(submission.email());
        request.setPhone(submission.phone());
        request.setMessage(submission.message());
        request = gymRequestRepository.save(request);

        log.info("Gym request submitted: gymName='{}', email='{}'",
            request.getGymName(), request.getEmail());

        return toDto(request);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<GymRequestDto> list(String status, Pageable pageable) {
        if (status != null && !status.isBlank()) {
            return gymRequestRepository
                .findByStatusOrderByCreatedAtDesc(status, pageable)
                .map(this::toDto);
        }
        return gymRequestRepository
            .findAllByOrderByCreatedAtDesc(pageable)
            .map(this::toDto);
    }

    @Override
    public GymRequestDto updateStatus(Long id, String status) {
        GymRequest request = gymRequestRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Solicitud no encontrada: id=" + id));

        request.setStatus(status);
        request = gymRequestRepository.save(request);

        log.info("Gym request {} status updated to '{}'", id, status);

        return toDto(request);
    }

    private GymRequestDto toDto(GymRequest r) {
        return new GymRequestDto(
            r.getId(),
            r.getGymName(),
            r.getContactName(),
            r.getEmail(),
            r.getPhone(),
            r.getMessage(),
            r.getStatus(),
            r.getCreatedAt()
        );
    }
}
