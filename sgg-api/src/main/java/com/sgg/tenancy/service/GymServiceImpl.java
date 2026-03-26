package com.sgg.tenancy.service;

import com.sgg.common.exception.ResourceNotFoundException;
import com.sgg.tenancy.dto.GymDto;
import com.sgg.tenancy.dto.GymPublicDto;
import com.sgg.tenancy.entity.Gym;
import com.sgg.tenancy.mapper.GymMapper;
import com.sgg.tenancy.repository.GymRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GymServiceImpl implements GymService {

    private final GymRepository gymRepository;
    private final GymMapper gymMapper;

    @Override
    public GymPublicDto searchBySlug(String slug) {
        return gymRepository.findBySlugAndStatus(slug, "ACTIVE")
            .map(gymMapper::toPublicDto)
            .orElseThrow(() -> new ResourceNotFoundException("Gym no encontrado"));
    }

    @Override
    public List<GymPublicDto> searchByName(String query) {
        if (query == null || query.trim().length() < 2) {
            return List.of();
        }
        return gymRepository.findTop10ByNameContainingIgnoreCaseAndStatusAndDeletedAtIsNullOrderByNameAsc(query.trim(), "ACTIVE")
            .stream()
            .map(gymMapper::toPublicDto)
            .toList();
    }

    @Override
    public GymDto getGymInfo(Long gymId) {
        return gymRepository.findByIdAndDeletedAtIsNull(gymId)
            .map(gymMapper::toDto)
            .orElseThrow(() -> new ResourceNotFoundException("Gym no encontrado"));
    }

    @Override
    @Transactional
    public void updateAutoAccept(Long gymId, boolean autoAccept) {
        Gym gym = gymRepository.findByIdAndDeletedAtIsNull(gymId)
            .orElseThrow(() -> new ResourceNotFoundException("Gym no encontrado"));
        gym.setAutoAcceptMembers(autoAccept);
        gymRepository.save(gym);
    }
}
