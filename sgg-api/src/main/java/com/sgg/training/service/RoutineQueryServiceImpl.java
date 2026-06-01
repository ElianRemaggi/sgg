package com.sgg.training.service;

import com.sgg.common.exception.ResourceNotFoundException;
import com.sgg.training.dto.AssignmentInfo;
import com.sgg.training.dto.BlockWithExercisesInfo;
import com.sgg.training.dto.ExerciseInfo;
import com.sgg.training.dto.ExerciseWithBlockInfo;
import com.sgg.training.entity.RoutineAssignment;
import com.sgg.training.entity.TemplateBlock;
import com.sgg.training.entity.TemplateExercise;
import com.sgg.training.repository.RoutineAssignmentRepository;
import com.sgg.training.repository.RoutineTemplateRepository;
import com.sgg.training.repository.TemplateBlockRepository;
import com.sgg.training.repository.TemplateExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoutineQueryServiceImpl implements RoutineQueryService {

    private final RoutineAssignmentRepository assignmentRepository;
    private final RoutineTemplateRepository templateRepository;
    private final TemplateBlockRepository blockRepository;
    private final TemplateExerciseRepository exerciseRepository;

    @Override
    public Optional<AssignmentInfo> findActiveAssignment(Long userId, Long gymId) {
        return assignmentRepository.findActiveByMemberAndGym(userId, gymId).map(this::toInfo);
    }

    @Override
    public Optional<AssignmentInfo> findAssignmentById(Long assignmentId) {
        return assignmentRepository.findById(assignmentId).map(this::toInfo);
    }

    @Override
    public List<AssignmentInfo> findMemberAssignments(Long userId, Long gymId) {
        return assignmentRepository.findByMemberUserIdAndGymIdOrderByStartsAtDesc(userId, gymId)
                .stream().map(this::toInfo).toList();
    }

    @Override
    public Map<Long, String> findTemplateNames(List<Long> templateIds) {
        if (templateIds.isEmpty()) return Map.of();
        return templateRepository.findByIdIn(templateIds).stream()
                .collect(Collectors.toMap(t -> t.getId(), t -> t.getName()));
    }

    @Override
    public List<ExerciseInfo> findExercisesByTemplateId(Long templateId) {
        List<TemplateBlock> blocks = blockRepository.findByTemplateIdOrderBySortOrder(templateId);
        if (blocks.isEmpty()) return List.of();
        List<Long> blockIds = blocks.stream().map(TemplateBlock::getId).toList();
        return exerciseRepository.findByBlockIdInOrderBySortOrder(blockIds).stream()
                .map(this::toExerciseInfo).toList();
    }

    @Override
    public boolean exerciseBelongsToTemplate(Long exerciseId, Long templateId) {
        return exerciseRepository.existsByIdAndTemplateId(exerciseId, templateId);
    }

    @Override
    public List<BlockWithExercisesInfo> findBlocksWithExercises(Long templateId) {
        List<TemplateBlock> blocks = blockRepository.findByTemplateIdOrderBySortOrder(templateId);
        if (blocks.isEmpty()) return List.of();
        List<Long> blockIds = blocks.stream().map(TemplateBlock::getId).toList();
        Map<Long, List<ExerciseInfo>> exercisesByBlock = exerciseRepository
                .findByBlockIdInOrderBySortOrder(blockIds).stream()
                .collect(Collectors.groupingBy(
                        TemplateExercise::getBlockId,
                        Collectors.mapping(this::toExerciseInfo, Collectors.toList())
                ));
        return blocks.stream()
                .map(b -> new BlockWithExercisesInfo(
                        b.getId(), b.getTemplateId(), b.getName(), b.getDayNumber(), b.getSortOrder(),
                        exercisesByBlock.getOrDefault(b.getId(), List.of())))
                .toList();
    }

    @Override
    public Optional<ExerciseWithBlockInfo> findExerciseWithBlock(Long exerciseId) {
        return exerciseRepository.findById(exerciseId)
                .flatMap(ex -> blockRepository.findById(ex.getBlockId())
                        .map(b -> new ExerciseWithBlockInfo(
                                ex.getId(), ex.getName(),
                                b.getId(), b.getName(), b.getDayNumber(), b.getTemplateId())));
    }

    private AssignmentInfo toInfo(RoutineAssignment a) {
        return new AssignmentInfo(a.getId(), a.getTemplateId(), a.getMemberUserId(),
                a.getGymId(), a.getStartsAt(), a.getEndsAt());
    }

    private ExerciseInfo toExerciseInfo(TemplateExercise e) {
        return new ExerciseInfo(e.getId(), e.getBlockId(), e.getName(),
                e.getSets(), e.getReps(), e.getRestSeconds(), e.getNotes(), e.getSortOrder());
    }
}
