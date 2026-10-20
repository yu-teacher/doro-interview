package com.doro.interview.quiz;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.random.RandomGenerator;

/**
 * 랜덤 면접의 문제 뽑기(docs/DESIGN.md §7). **순수 함수**다: 난수·현재 시각을 주입받아 같은 입력이면 같은 결과가 나온다(시험이 재현 가능).
 *
 * <p>가중치(WEIGHTED 모드): 기본 1.0, 한 번도 안 나온 질문 ×1.5, 마지막 출제가 오래될수록 ×(1 + 최대 1.0)(30일에 최대),
 * 틀린 횟수가 많을수록 ×(1 + 0.25·min(miss, 4)), 직전 세션에서 나온 질문은 ×0.5. RANDOM 모드는 가중 없이 균등하다.
 * 뽑힌 질문은 다시 뽑지 않는다(같은 세션 중복 금지).
 */
public final class QuizPicker {

    public enum Mode { WEIGHTED, RANDOM }

    /** 질문 하나에 대한 이 사용자의 출제 통계. 한 번도 안 나왔으면 통계 자체가 없다(맵에 없음). */
    public record Stat(int askCount, int missCount, Instant lastAskedAt) {
    }

    static final double NEVER_ASKED = 1.5;
    static final double MAX_STALENESS_BONUS = 1.0;
    static final Duration STALENESS_FULL = Duration.ofDays(30);
    static final double MISS_STEP = 0.25;
    static final int MISS_CAP = 4;
    static final double PREVIOUS_SESSION = 0.5;

    private QuizPicker() {
    }

    /** 질문 하나의 가중치. {@code stat} 이 null 이면 한 번도 안 나온 질문이다. */
    public static double weight(Stat stat, boolean inPreviousSession, Instant now) {
        double w = 1.0;
        if (stat == null || stat.askCount() == 0) {
            w *= NEVER_ASKED;
        } else if (stat.lastAskedAt() != null) {
            double fraction = (double) Duration.between(stat.lastAskedAt(), now).toMillis() / STALENESS_FULL.toMillis();
            w *= 1.0 + MAX_STALENESS_BONUS * Math.min(1.0, Math.max(0.0, fraction));
        }
        if (stat != null) {
            w *= 1.0 + MISS_STEP * Math.min(stat.missCount(), MISS_CAP);
        }
        if (inPreviousSession) {
            w *= PREVIOUS_SESSION;
        }
        return w;
    }

    /**
     * @param pool            후보(순서가 곧 입력 순서이고 같은 시드면 결과도 같다). 중복이 있어도 한 번만 뽑힌다.
     * @param stats           질문 slug → 통계(없으면 한 번도 안 나온 질문)
     * @param previousSession 직전 세션에서 나온 질문
     * @param n               원하는 개수. 풀이 더 작으면 있는 만큼만 돌려준다.
     */
    public static List<String> pick(List<String> pool, Map<String, Stat> stats, Set<String> previousSession, int n, Mode mode,
                                    RandomGenerator rng, Instant now) {
        List<String> remaining = new ArrayList<>(pool.stream().distinct().toList());
        List<Double> weights = new ArrayList<>(remaining.size());
        for (String slug : remaining) {
            weights.add(mode == Mode.RANDOM ? 1.0 : weight(stats.get(slug), previousSession.contains(slug), now));
        }
        int count = Math.max(0, Math.min(n, remaining.size()));
        List<String> picked = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            double total = 0;
            for (double w : weights) {
                total += w;
            }
            double r = rng.nextDouble() * total;
            int chosen = remaining.size() - 1; // 부동소수점 오차로 못 고르는 일이 없게 마지막이 기본값이다
            double acc = 0;
            for (int j = 0; j < remaining.size(); j++) {
                acc += weights.get(j);
                if (r < acc) {
                    chosen = j;
                    break;
                }
            }
            picked.add(remaining.remove(chosen));
            weights.remove(chosen);
        }
        return List.copyOf(picked);
    }
}
