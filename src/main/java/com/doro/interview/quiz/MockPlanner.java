package com.doro.interview.quiz;

import com.doro.interview.quiz.QuizPicker.Mode;
import com.doro.interview.quiz.QuizPicker.Stat;
import com.doro.interview.quiz.QuizService.Result;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.random.RandomGenerator;

/**
 * 모의면접의 다음 턴 결정(docs/M7-PLAN.md D3). **순수 함수**다: 난수·시각을 주입받아 같은 입력이면 같은 결과가 나온다.
 *
 * <ul>
 *   <li>맞음 → 이 세션에 아직 안 나온 FOLLOWUP(꼬리질문) 하나, 깊이가 {@code maxDepth} 보다 작을 때만.</li>
 *   <li>틀림 → 이 세션에 아직 안 나온 PREREQ(기초 확인) 하나. 깊이를 쓰지 않고, 그 턴 뒤에는 줄기를 끝낸다.</li>
 *   <li>건너뜀, 기초 확인 턴의 답, 후보 없음 → 줄기를 끝내고 아직 안 나온 다음 본 질문으로 간다.</li>
 *   <li>본 질문도 남지 않으면 끝({@link Optional#empty()}).</li>
 * </ul>
 * 후보가 여럿이면 시험과 같은 가중 랜덤({@link QuizPicker})으로 하나를 고른다(오래 안 나왔거나 자주 틀린 질문이 더 잘 나온다).
 */
public final class MockPlanner {

    public enum Origin { MAIN, LINK, PREREQ, AI_PROBE }

    /** 방금 답한 턴. */
    public record Answered(int seq, String questionSlug, Origin origin, int depth) {
    }

    /** 다음에 물을 턴. 본 질문이면 {@code parentSeq} 가 null 이다. */
    public record Next(String questionSlug, Origin origin, int depth, Integer parentSeq) {
    }

    private MockPlanner() {
    }

    /**
     * @param mains     시작할 때 정한 본 질문 순서
     * @param followups 질문 → FOLLOWUP 대상(보이는 질문만)
     * @param prereqs   질문 → PREREQ 대상(보이는 질문만)
     * @param used      이 세션에 이미 나온 질문(방금 답한 질문 포함)
     */
    public static Optional<Next> next(Answered answered, Result result, List<String> mains, Map<String, List<String>> followups,
                                      Map<String, List<String>> prereqs, Set<String> used, int maxDepth, Map<String, Stat> stats,
                                      RandomGenerator rng, Instant now) {
        boolean chainable = answered.origin() == Origin.MAIN || answered.origin() == Origin.LINK;
        if (chainable && result == Result.CORRECT && answered.depth() < maxDepth) {
            Optional<String> slug = pickUnused(followups.get(answered.questionSlug()), used, stats, rng, now);
            if (slug.isPresent()) {
                return Optional.of(new Next(slug.get(), Origin.LINK, answered.depth() + 1, answered.seq()));
            }
        }
        if (chainable && result == Result.WRONG) {
            Optional<String> slug = pickUnused(prereqs.get(answered.questionSlug()), used, stats, rng, now);
            if (slug.isPresent()) {
                return Optional.of(new Next(slug.get(), Origin.PREREQ, answered.depth(), answered.seq()));
            }
        }
        return mains.stream().filter(m -> !used.contains(m)).findFirst().map(m -> new Next(m, Origin.MAIN, 0, null));
    }

    private static Optional<String> pickUnused(List<String> candidates, Set<String> used, Map<String, Stat> stats, RandomGenerator rng, Instant now) {
        if (candidates == null) {
            return Optional.empty();
        }
        List<String> fresh = candidates.stream().filter(c -> !used.contains(c)).toList();
        if (fresh.isEmpty()) {
            return Optional.empty();
        }
        return QuizPicker.pick(fresh, stats, Set.of(), 1, Mode.WEIGHTED, rng, now).stream().findFirst();
    }
}
