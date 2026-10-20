package com.doro.interview.quiz;

import com.doro.interview.quiz.QuizPicker.Mode;
import com.doro.interview.quiz.QuizPicker.Stat;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

/** DESIGN §7 의 뽑기 규칙(풀 크기, 중복 금지, 가중치 공식, 모드, 재현성). */
class QuizPickerTest {

    private static final Instant NOW = Instant.parse("2026-10-20T00:00:00Z");
    private static final Map<String, Stat> NO_STATS = Map.of();
    private static final Set<String> NO_PREVIOUS = Set.of();

    private static List<String> slugs(int n) {
        List<String> list = new ArrayList<>();
        for (int i = 1; i <= n; i++) {
            list.add("q-" + i);
        }
        return list;
    }

    private static Stat asked(int ask, int miss, Duration ago) {
        return new Stat(ask, miss, NOW.minus(ago));
    }

    // -- 풀 크기

    @Test
    void 풀이_요청보다_작으면_있는_만큼만_낸다() {
        assertThat(QuizPicker.pick(slugs(3), NO_STATS, NO_PREVIOUS, 10, Mode.WEIGHTED, new Random(1), NOW)).hasSize(3);
    }

    @Test
    void 풀이_0이면_비어_있다() {
        assertThat(QuizPicker.pick(List.of(), NO_STATS, NO_PREVIOUS, 5, Mode.WEIGHTED, new Random(1), NOW)).isEmpty();
    }

    @Test
    void 요청_개수가_0이하이면_비어_있다() {
        assertThat(QuizPicker.pick(slugs(5), NO_STATS, NO_PREVIOUS, 0, Mode.WEIGHTED, new Random(1), NOW)).isEmpty();
        assertThat(QuizPicker.pick(slugs(5), NO_STATS, NO_PREVIOUS, -3, Mode.WEIGHTED, new Random(1), NOW)).isEmpty();
    }

    @Test
    void 요청한_개수만큼_낸다() {
        assertThat(QuizPicker.pick(slugs(20), NO_STATS, NO_PREVIOUS, 7, Mode.WEIGHTED, new Random(2), NOW)).hasSize(7);
    }

    // -- 중복 금지

    @Test
    void 같은_질문을_두_번_뽑지_않는다() {
        for (long seed = 0; seed < 200; seed++) {
            for (Mode mode : Mode.values()) {
                List<String> picked = QuizPicker.pick(slugs(12), NO_STATS, NO_PREVIOUS, 12, mode, new Random(seed), NOW);
                assertThat(picked).doesNotHaveDuplicates().hasSize(12);
            }
        }
    }

    @Test
    void 입력에_중복이_있어도_한_번만_뽑힌다() {
        List<String> pool = List.of("a", "a", "b", "b", "c");
        assertThat(QuizPicker.pick(pool, NO_STATS, NO_PREVIOUS, 5, Mode.WEIGHTED, new Random(3), NOW)).containsExactlyInAnyOrder("a", "b", "c");
    }

    @Test
    void 뽑힌_질문은_모두_풀_안에_있다() {
        List<String> pool = slugs(10);
        assertThat(QuizPicker.pick(pool, NO_STATS, NO_PREVIOUS, 6, Mode.WEIGHTED, new Random(4), NOW)).isSubsetOf(pool);
    }

    // -- 재현성

    @Test
    void 같은_시드는_같은_결과다() {
        Map<String, Stat> stats = Map.of("q-2", asked(3, 2, Duration.ofDays(5)), "q-5", asked(1, 0, Duration.ofDays(40)));
        List<String> a = QuizPicker.pick(slugs(15), stats, Set.of("q-1"), 8, Mode.WEIGHTED, new Random(42), NOW);
        List<String> b = QuizPicker.pick(slugs(15), stats, Set.of("q-1"), 8, Mode.WEIGHTED, new Random(42), NOW);
        assertThat(a).isEqualTo(b);
    }

    @Test
    void 시드가_다르면_순서가_달라질_수_있다() {
        List<List<String>> results = new ArrayList<>();
        for (long seed = 0; seed < 10; seed++) {
            results.add(QuizPicker.pick(slugs(15), NO_STATS, NO_PREVIOUS, 15, Mode.WEIGHTED, new Random(seed), NOW));
        }
        assertThat(results.stream().distinct().count()).isGreaterThan(1);
    }

    // -- 가중치 공식 (경계값)

    @Test
    void 통계가_없으면_한_번도_안_나온_질문이라_1_5배다() {
        assertThat(QuizPicker.weight(null, false, NOW)).isEqualTo(1.5);
        assertThat(QuizPicker.weight(new Stat(0, 0, null), false, NOW)).isEqualTo(1.5);
    }

    @Test
    void 방금_나온_질문은_기본_1_0이다() {
        assertThat(QuizPicker.weight(asked(1, 0, Duration.ZERO), false, NOW)).isEqualTo(1.0);
    }

    @Test
    void 오래될수록_늘어나고_30일에_최대_2_0배다() {
        assertThat(QuizPicker.weight(asked(1, 0, Duration.ofDays(15)), false, NOW)).isCloseTo(1.5, within(1e-9));
        assertThat(QuizPicker.weight(asked(1, 0, Duration.ofDays(30)), false, NOW)).isCloseTo(2.0, within(1e-9));
        assertThat(QuizPicker.weight(asked(1, 0, Duration.ofDays(300)), false, NOW)).isCloseTo(2.0, within(1e-9)); // 상한
    }

    @Test
    void 미래의_출제_시각은_오래된_것으로_세지_않는다() {
        assertThat(QuizPicker.weight(new Stat(1, 0, NOW.plus(Duration.ofDays(3))), false, NOW)).isEqualTo(1.0);
    }

    @Test
    void 틀린_횟수는_0_25씩_늘고_4회에서_멈춘다() {
        assertThat(QuizPicker.weight(asked(9, 0, Duration.ZERO), false, NOW)).isEqualTo(1.0);
        assertThat(QuizPicker.weight(asked(9, 1, Duration.ZERO), false, NOW)).isCloseTo(1.25, within(1e-9));
        assertThat(QuizPicker.weight(asked(9, 4, Duration.ZERO), false, NOW)).isCloseTo(2.0, within(1e-9));
        assertThat(QuizPicker.weight(asked(9, 5, Duration.ZERO), false, NOW)).isCloseTo(2.0, within(1e-9));
        assertThat(QuizPicker.weight(asked(9, 9, Duration.ZERO), false, NOW)).isCloseTo(2.0, within(1e-9));
    }

    @Test
    void 직전_세션에서_나온_질문은_절반이다() {
        assertThat(QuizPicker.weight(asked(1, 0, Duration.ZERO), true, NOW)).isEqualTo(0.5);
        assertThat(QuizPicker.weight(null, true, NOW)).isCloseTo(0.75, within(1e-9));
    }

    @Test
    void 가중치는_서로_곱해진다() {
        // 30일 전(×2.0) · 틀린 2회(×1.5) · 직전 세션(×0.5) = 1.5
        assertThat(QuizPicker.weight(asked(5, 2, Duration.ofDays(30)), true, NOW)).isCloseTo(1.5, within(1e-9));
    }

    // -- 가중치가 실제 뽑기에 반영된다 (통계적, 넉넉한 기준)

    @Test
    void 가중치가_큰_질문이_더_자주_첫번째로_뽑힌다() {
        Map<String, Stat> stats = new HashMap<>();
        stats.put("heavy", asked(10, 4, Duration.ofDays(60)));   // 2.0 · 2.0 = 4.0
        stats.put("light", asked(10, 0, Duration.ZERO));          // 1.0
        List<String> pool = List.of("heavy", "light");
        int heavyFirst = 0;
        Random rng = new Random(20261020L); // 한 난수 발생기를 계속 쓴다(연속된 시드의 첫 값은 서로 비슷해 표본이 치우친다)
        for (int i = 0; i < 2000; i++) {
            if (QuizPicker.pick(pool, stats, NO_PREVIOUS, 1, Mode.WEIGHTED, rng, NOW).get(0).equals("heavy")) {
                heavyFirst++;
            }
        }
        assertThat(heavyFirst / 2000.0).isBetween(0.74, 0.86); // 이론값 0.8
    }

    @Test
    void 완전_무작위_모드는_통계를_무시하고_균등하다() {
        Map<String, Stat> stats = Map.of("heavy", asked(10, 4, Duration.ofDays(60)), "light", asked(10, 0, Duration.ZERO));
        List<String> pool = List.of("heavy", "light");
        int heavyFirst = 0;
        Random rng = new Random(20261021L);
        for (int i = 0; i < 2000; i++) {
            if (QuizPicker.pick(pool, stats, NO_PREVIOUS, 1, Mode.RANDOM, rng, NOW).get(0).equals("heavy")) {
                heavyFirst++;
            }
        }
        assertThat(heavyFirst / 2000.0).isBetween(0.45, 0.55);
    }

    @Test
    void 직전_세션의_질문은_덜_나온다() {
        List<String> pool = List.of("prev", "other");
        int prevFirst = 0;
        Random rng = new Random(20261022L);
        for (int i = 0; i < 2000; i++) {
            if (QuizPicker.pick(pool, NO_STATS, Set.of("prev"), 1, Mode.WEIGHTED, rng, NOW).get(0).equals("prev")) {
                prevFirst++;
            }
        }
        assertThat(prevFirst / 2000.0).isBetween(0.28, 0.39); // 이론값 1/3
    }

    @Test
    void 가중치가_작아도_결국_모두_뽑힌다() {
        Map<String, Stat> stats = Map.of("x", asked(1, 0, Duration.ZERO));
        Set<String> previous = Set.of("x");
        assertThat(QuizPicker.pick(List.of("x", "y", "z"), stats, previous, 3, Mode.WEIGHTED, new Random(9), NOW)).containsExactlyInAnyOrder("x", "y", "z");
    }
}
