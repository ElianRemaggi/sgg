package com.sgg.training;

import com.sgg.common.BaseIntegrationTest;
import com.sgg.identity.entity.User;
import com.sgg.identity.repository.UserRepository;
import com.sgg.tenancy.entity.Gym;
import com.sgg.tenancy.entity.GymMember;
import com.sgg.tenancy.repository.GymMemberRepository;
import com.sgg.tenancy.repository.GymRepository;
import com.sgg.training.dto.AssignmentInfo;
import com.sgg.training.dto.BlockWithExercisesInfo;
import com.sgg.training.dto.ExerciseWithBlockInfo;
import com.sgg.training.entity.RoutineAssignment;
import com.sgg.training.entity.RoutineTemplate;
import com.sgg.training.entity.TemplateBlock;
import com.sgg.training.entity.TemplateExercise;
import com.sgg.training.repository.RoutineAssignmentRepository;
import com.sgg.training.repository.RoutineTemplateRepository;
import com.sgg.training.repository.TemplateBlockRepository;
import com.sgg.training.repository.TemplateExerciseRepository;
import com.sgg.training.service.RoutineQueryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class RoutineQueryServiceTest extends BaseIntegrationTest {

    @Autowired private RoutineQueryService routineQueryService;

    @Autowired private UserRepository userRepository;
    @Autowired private GymRepository gymRepository;
    @Autowired private GymMemberRepository gymMemberRepository;
    @Autowired private RoutineTemplateRepository templateRepository;
    @Autowired private TemplateBlockRepository blockRepository;
    @Autowired private TemplateExerciseRepository exerciseRepository;
    @Autowired private RoutineAssignmentRepository assignmentRepository;

    private User member;
    private Gym gym;
    private RoutineTemplate template;
    private TemplateBlock block;
    private TemplateExercise exercise1;
    private TemplateExercise exercise2;
    private RoutineAssignment activeAssignment;

    @BeforeEach
    void setUp() {
        assignmentRepository.deleteAll();
        exerciseRepository.deleteAll();
        blockRepository.deleteAll();
        templateRepository.deleteAll();
        gymMemberRepository.deleteAll();
        gymRepository.deleteAll();
        userRepository.deleteAll();

        User coach = createUser("coach-qsvc-001", "coach-qsvc@test.com", "Coach");
        member = createUser("member-qsvc-001", "member-qsvc@test.com", "Member");

        gym = createGym("Gym QueryService", "gym-qs", coach.getId());
        createMembership(gym.getId(), coach.getId(), "COACH", "ACTIVE");
        createMembership(gym.getId(), member.getId(), "MEMBER", "ACTIVE");

        template = new RoutineTemplate();
        template.setGymId(gym.getId());
        template.setName("Fuerza 3x");
        template.setCreatedBy(coach.getId());
        template = templateRepository.save(template);

        block = new TemplateBlock();
        block.setTemplateId(template.getId());
        block.setName("Día 1");
        block.setDayNumber(1);
        block.setSortOrder(0);
        block = blockRepository.save(block);

        exercise1 = new TemplateExercise();
        exercise1.setBlockId(block.getId());
        exercise1.setName("Sentadilla");
        exercise1.setSets(5);
        exercise1.setReps("5");
        exercise1.setSortOrder(0);
        exercise1 = exerciseRepository.save(exercise1);

        exercise2 = new TemplateExercise();
        exercise2.setBlockId(block.getId());
        exercise2.setName("Peso Muerto");
        exercise2.setSets(3);
        exercise2.setReps("3");
        exercise2.setSortOrder(1);
        exercise2 = exerciseRepository.save(exercise2);

        activeAssignment = createAssignment(
                member.getId(), template.getId(),
                LocalDateTime.now().minusDays(5), LocalDateTime.now().plusDays(30));
    }

    // ── findActiveAssignment ───────────────────────────────────────────────────

    @Test
    void findActiveAssignment_activeExists_returnsInfo() {
        Optional<AssignmentInfo> result = routineQueryService.findActiveAssignment(member.getId(), gym.getId());

        assertThat(result).isPresent();
        AssignmentInfo info = result.get();
        assertThat(info.id()).isEqualTo(activeAssignment.getId());
        assertThat(info.templateId()).isEqualTo(template.getId());
        assertThat(info.memberUserId()).isEqualTo(member.getId());
        assertThat(info.gymId()).isEqualTo(gym.getId());
    }

    @Test
    void findActiveAssignment_noActive_returnsEmpty() {
        // Assignment que ya terminó
        createAssignment(member.getId(), template.getId(),
                LocalDateTime.now().minusDays(30), LocalDateTime.now().minusDays(1));
        assignmentRepository.delete(activeAssignment);

        Optional<AssignmentInfo> result = routineQueryService.findActiveAssignment(member.getId(), gym.getId());

        assertThat(result).isEmpty();
    }

    // ── exerciseBelongsToTemplate ──────────────────────────────────────────────

    @Test
    void exerciseBelongsToTemplate_validExercise_returnsTrue() {
        boolean result = routineQueryService.exerciseBelongsToTemplate(exercise1.getId(), template.getId());
        assertThat(result).isTrue();
    }

    @Test
    void exerciseBelongsToTemplate_exerciseFromOtherTemplate_returnsFalse() {
        // Otra plantilla con su propio ejercicio
        RoutineTemplate otherTemplate = new RoutineTemplate();
        otherTemplate.setGymId(gym.getId());
        otherTemplate.setName("Otra Plantilla");
        otherTemplate.setCreatedBy(member.getId());
        otherTemplate = templateRepository.save(otherTemplate);

        TemplateBlock otherBlock = new TemplateBlock();
        otherBlock.setTemplateId(otherTemplate.getId());
        otherBlock.setName("Bloque B");
        otherBlock.setDayNumber(1);
        otherBlock.setSortOrder(0);
        otherBlock = blockRepository.save(otherBlock);

        TemplateExercise otherExercise = new TemplateExercise();
        otherExercise.setBlockId(otherBlock.getId());
        otherExercise.setName("Press Banca");
        otherExercise.setSets(3);
        otherExercise.setReps("8");
        otherExercise.setSortOrder(0);
        otherExercise = exerciseRepository.save(otherExercise);

        // El ejercicio de la otra plantilla NO pertenece a template
        boolean result = routineQueryService.exerciseBelongsToTemplate(otherExercise.getId(), template.getId());
        assertThat(result).isFalse();
    }

    // ── findBlocksWithExercises ────────────────────────────────────────────────

    @Test
    void findBlocksWithExercises_returnsNestedStructure() {
        List<BlockWithExercisesInfo> blocks = routineQueryService.findBlocksWithExercises(template.getId());

        assertThat(blocks).hasSize(1);
        BlockWithExercisesInfo b = blocks.get(0);
        assertThat(b.id()).isEqualTo(block.getId());
        assertThat(b.name()).isEqualTo("Día 1");
        assertThat(b.dayNumber()).isEqualTo(1);
        assertThat(b.templateId()).isEqualTo(template.getId());
        assertThat(b.exercises()).hasSize(2);
        assertThat(b.exercises().get(0).name()).isEqualTo("Sentadilla");
        assertThat(b.exercises().get(1).name()).isEqualTo("Peso Muerto");
    }

    @Test
    void findBlocksWithExercises_emptyTemplate_returnsEmpty() {
        RoutineTemplate emptyTemplate = new RoutineTemplate();
        emptyTemplate.setGymId(gym.getId());
        emptyTemplate.setName("Vacía");
        emptyTemplate.setCreatedBy(member.getId());
        emptyTemplate = templateRepository.save(emptyTemplate);

        List<BlockWithExercisesInfo> blocks = routineQueryService.findBlocksWithExercises(emptyTemplate.getId());

        assertThat(blocks).isEmpty();
    }

    // ── findExerciseWithBlock ──────────────────────────────────────────────────

    @Test
    void findExerciseWithBlock_returnsExerciseAndBlockInfo() {
        Optional<ExerciseWithBlockInfo> result = routineQueryService.findExerciseWithBlock(exercise1.getId());

        assertThat(result).isPresent();
        ExerciseWithBlockInfo info = result.get();
        assertThat(info.exerciseId()).isEqualTo(exercise1.getId());
        assertThat(info.exerciseName()).isEqualTo("Sentadilla");
        assertThat(info.blockId()).isEqualTo(block.getId());
        assertThat(info.blockName()).isEqualTo("Día 1");
        assertThat(info.dayNumber()).isEqualTo(1);
        assertThat(info.templateId()).isEqualTo(template.getId());
    }

    // ── findMemberAssignments ──────────────────────────────────────────────────

    @Test
    void findMemberAssignments_multipleAssignments_returnsDescOrder() {
        // Crear una asignación pasada
        RoutineAssignment older = createAssignment(
                member.getId(), template.getId(),
                LocalDateTime.now().minusDays(60), LocalDateTime.now().minusDays(31));

        List<AssignmentInfo> results = routineQueryService.findMemberAssignments(member.getId(), gym.getId());

        assertThat(results).hasSize(2);
        // La asignación activa (más reciente) debe ser la primera
        assertThat(results.get(0).id()).isEqualTo(activeAssignment.getId());
        assertThat(results.get(1).id()).isEqualTo(older.getId());
    }

    // ── findTemplateNames ──────────────────────────────────────────────────────

    @Test
    void findTemplateNames_batchFetch_returnsMapWithAllNames() {
        RoutineTemplate template2 = new RoutineTemplate();
        template2.setGymId(gym.getId());
        template2.setName("Hipertrofia 4x");
        template2.setCreatedBy(member.getId());
        template2 = templateRepository.save(template2);

        Map<Long, String> names = routineQueryService.findTemplateNames(
                List.of(template.getId(), template2.getId()));

        assertThat(names).hasSize(2);
        assertThat(names.get(template.getId())).isEqualTo("Fuerza 3x");
        assertThat(names.get(template2.getId())).isEqualTo("Hipertrofia 4x");
    }

    @Test
    void findTemplateNames_emptyList_returnsEmptyMap() {
        Map<Long, String> names = routineQueryService.findTemplateNames(List.of());
        assertThat(names).isEmpty();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private RoutineAssignment createAssignment(Long userId, Long templateId,
                                               LocalDateTime startsAt, LocalDateTime endsAt) {
        RoutineAssignment a = new RoutineAssignment();
        a.setGymId(gym.getId());
        a.setTemplateId(templateId);
        a.setMemberUserId(userId);
        a.setAssignedBy(userId);
        a.setStartsAt(startsAt);
        a.setEndsAt(endsAt);
        return assignmentRepository.save(a);
    }

    private User createUser(String uid, String email, String name) {
        User user = new User();
        user.setSupabaseUid(uid);
        user.setEmail(email);
        user.setFullName(name);
        user.setUsername(uid.replace("-", "_").substring(0, Math.min(uid.length(), 30)));
        return userRepository.save(user);
    }

    private Gym createGym(String name, String slug, Long ownerId) {
        Gym g = new Gym();
        g.setName(name);
        g.setSlug(slug);
        g.setOwnerUserId(ownerId);
        g.setStatus("ACTIVE");
        return gymRepository.save(g);
    }

    private void createMembership(Long gymId, Long userId, String role, String status) {
        GymMember m = new GymMember();
        m.setGymId(gymId);
        m.setUserId(userId);
        m.setRole(role);
        m.setStatus(status);
        gymMemberRepository.save(m);
    }
}
