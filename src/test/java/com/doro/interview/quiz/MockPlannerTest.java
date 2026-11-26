package com.doro.interview.quiz;

import com.doro.interview.quiz.MockPlanner.Answered;
import com.doro.interview.quiz.MockPlanner.Next;
import com.doro.interview.quiz.MockPlanner.Origin;
import com.doro.interview.quiz.QuizService.Result;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.SplittableRandom;

import static org.assertj.core.api.Assertions.assertThat;

/** 모의면접의 다음 턴 규칙(docs/M7-PLAN.md D3). 순수 함수라 DB 없이 돈다. */
class MockPlannerTest {

    private static final Instant NOW = Instant.parse("2026-11-26T00:00:00Z");
    private static final List<String> MAINS = List.of("m1", "m2", "m3");
    private static final Map<String, List<String>> FOLLOWUPS = Map.of(
            "m1", List.of("f1"),
            "f1", List.of("f2"),
            "f2", List.of("f3"),
            "f3", List.of("f4"));
    private static final Map<String, List<String>> PREREQS = Map.of(
            "m1", List.of("p1"),
            "f1", List.of("p2"),
            "p1", List.of("p0"));

    private static Optional<Next> next(Answered answered, Result result, Set<String> used, int maxDepth) {
        return MockPlanner.next(answered, result, MAINS, FOLLOWUPS, PREREQS, used, maxDepth, Map.of(), new SplittableRandom(1), NOW);
    }

    private static Set<String> used(String... slugs) {
        return new HashSet<>(List.of(slugs));
    }

    @Test
    void 맞으면_꼬리질문으로_한_단계_파고든다() {
        var n = next(new Answered(1, "m1", Origin.MAIN, 0), Result.CORRECT, used("m1"), 2);
        assertThat(n).contains(new Next("f1", Origin.LINK, 1, 1));
    }

    @Test
    void 깊이_상한에_닿으면_다음_본_질문으로_간다() {
        assertThat(next(new Answered(3, "f2", Origin.LINK, 2), Result.CORRECT, used("m1", "f1", "f2"), 2))
                .contains(new Next("m2", Origin.MAIN, 0, null));
        // 깊이 0 이면 꼬리질문 없이 본 질문만 낸다
        assertThat(next(new Answered(1, "m1", Origin.MAIN, 0), Result.CORRECT, used("m1"), 0))
                .contains(new Next("m2", Origin.MAIN, 0, null));
    }

    @Test
    void 깊이_3_까지_이어진다() {
        assertThat(next(new Answered(3, "f2", Origin.LINK, 2), Result.CORRECT, used("m1", "f1", "f2"), 3))
                .contains(new Next("f3", Origin.LINK, 3, 3));
    }

    @Test
    void 틀리면_기초_질문으로_한_번_내려가고_깊이를_쓰지_않는다() {
        assertThat(next(new Answered(1, "m1", Origin.MAIN, 0), Result.WRONG, used("m1"), 2))
                .contains(new Next("p1", Origin.PREREQ, 0, 1));
        assertThat(next(new Answered(2, "f1", Origin.LINK, 1), Result.WRONG, used("m1", "f1"), 2))
                .contains(new Next("p2", Origin.PREREQ, 1, 2));
    }

    @Test
    void 기초_확인_턴_뒤에는_맞든_틀리든_줄기를_끝낸다() {
        for (Result r : Result.values()) {
            assertThat(next(new Answered(2, "p1", Origin.PREREQ, 0), r, used("m1", "p1"), 2))
                    .as(r.name()).contains(new Next("m2", Origin.MAIN, 0, null));
        }
    }

    @Test
    void 건너뛰면_줄기를_끝낸다() {
        assertThat(next(new Answered(1, "m1", Origin.MAIN, 0), Result.SKIPPED, used("m1"), 2))
                .contains(new Next("m2", Origin.MAIN, 0, null));
    }

    @Test
    void 후보가_없거나_모두_나왔으면_다음_본_질문으로_간다() {
        // m2 는 꼬리질문도 기초 질문도 없다
        assertThat(next(new Answered(4, "m2", Origin.MAIN, 0), Result.CORRECT, used("m1", "m2"), 2)).contains(new Next("m3", Origin.MAIN, 0, null));
        assertThat(next(new Answered(4, "m2", Origin.MAIN, 0), Result.WRONG, used("m1", "m2"), 2)).contains(new Next("m3", Origin.MAIN, 0, null));
        // 꼬리질문 f1 이 이미 나왔으면 다시 묻지 않는다
        assertThat(next(new Answered(1, "m1", Origin.MAIN, 0), Result.CORRECT, used("m1", "f1"), 2)).contains(new Next("m2", Origin.MAIN, 0, null));
    }

    @Test
    void 이미_나온_본_질문은_건너뛰고_더_없으면_끝난다() {
        assertThat(next(new Answered(5, "m3", Origin.MAIN, 0), Result.SKIPPED, used("m1", "m2", "m3"), 2)).isEmpty();
        // m2 가 다른 줄기의 꼬리질문으로 이미 나왔다면 본 질문으로 다시 묻지 않는다
        assertThat(next(new Answered(1, "m1", Origin.MAIN, 0), Result.SKIPPED, used("m1", "m2"), 2))
                .contains(new Next("m3", Origin.MAIN, 0, null));
    }

    @Test
    void 연결에_순환이_있어도_같은_세션에서_같은_질문은_다시_나오지_않는다() {
        Map<String, List<String>> cyclic = Map.of("a", List.of("b"), "b", List.of("a"));
        Set<String> used = used("a");
        Answered at = new Answered(1, "a", Origin.MAIN, 0);
        int turns = 1;
        Optional<Next> n;
        while ((n = MockPlanner.next(at, Result.CORRECT, List.of("a"), cyclic, Map.of(), used, 3, Map.of(), new SplittableRandom(7), NOW)).isPresent()) {
            assertThat(used.add(n.get().questionSlug())).as("중복 출제").isTrue();
            at = new Answered(++turns, n.get().questionSlug(), n.get().origin(), n.get().depth());
        }
        assertThat(used).containsExactlyInAnyOrder("a", "b");
    }

    @Test
    void AI_탐침_턴_뒤에는_연결을_따라가지_않는다() {
        assertThat(next(new Answered(2, null, Origin.AI_PROBE, 1), Result.CORRECT, used("m1"), 3)).contains(new Next("m2", Origin.MAIN, 0, null));
    }

    @Test
    void 같은_난수면_같은_후보를_고른다() {
        Map<String, List<String>> many = Map.of("m1", List.of("x1", "x2", "x3", "x4", "x5"));
        var first = MockPlanner.next(new Answered(1, "m1", Origin.MAIN, 0), Result.CORRECT, MAINS, many, Map.of(), used("m1"), 2, Map.of(), new SplittableRandom(42), NOW);
        var again = MockPlanner.next(new Answered(1, "m1", Origin.MAIN, 0), Result.CORRECT, MAINS, many, Map.of(), used("m1"), 2, Map.of(), new SplittableRandom(42), NOW);
        assertThat(first).isEqualTo(again);
        assertThat(first.orElseThrow().questionSlug()).isIn("x1", "x2", "x3", "x4", "x5");
    }
}
