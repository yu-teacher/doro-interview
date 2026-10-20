package com.doro.interview.quiz;

import com.doro.interview.quiz.QuizPicker.Mode;
import com.doro.interview.quiz.QuizService.Result;
import com.doro.interview.quiz.QuizService.Scope;
import com.doro.interview.quiz.read.QuizStatsReader;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/** 현황(최근 30일 수치·자주 틀린 질문), 다시 공부 후보의 원본(마지막 결과가 틀림), 설정. */
class QuizStatsTest extends AbstractQuizTest {

    @Autowired
    QuizStatsReader reader;

    private UUID session(UUID user) {
        UUID id = UUID.randomUUID();
        quiz.start(user, id, Scope.all(), false, 30, Mode.RANDOM);
        return id;
    }

    private void answer(UUID user, UUID session, String slug, Result r) {
        int seq = quiz.get(user, session).items().stream().filter(i -> i.questionSlug().equals(slug)).findFirst().orElseThrow().seq();
        quiz.record(user, session, seq, r, 5, null);
    }

    // -- 마지막 결과가 틀림

    @Test
    void 마지막_결과가_틀림인_질문만_나온다() {
        learn(alice, "aa-01", "aa-02", "aa-03");
        UUID s = session(alice);
        answer(alice, s, "aa-01", Result.WRONG);
        answer(alice, s, "aa-02", Result.CORRECT);
        answer(alice, s, "aa-03", Result.SKIPPED);
        assertThat(reader.lastWrong(alice)).containsExactly("aa-01");
        assertThat(reader.lastWrongAmong(alice, List.of("aa-01", "aa-02", "aa-03", "dd-01"))).containsExactly("aa-01");
    }

    @Test
    void 이후_맞으면_사라지고_다시_틀리면_다시_나온다() {
        learn(alice, "aa-01");
        UUID first = session(alice);
        answer(alice, first, "aa-01", Result.WRONG);
        assertThat(reader.lastWrong(alice)).containsExactly("aa-01");
        UUID second = session(alice);
        answer(alice, second, "aa-01", Result.CORRECT);
        assertThat(reader.lastWrong(alice)).isEmpty();
        UUID third = session(alice);
        answer(alice, third, "aa-01", Result.WRONG);
        assertThat(reader.lastWrong(alice)).containsExactly("aa-01");
    }

    @Test
    void 건너뛰기는_마지막_결과를_바꾸지_않는다() {
        learn(alice, "aa-01");
        UUID first = session(alice);
        answer(alice, first, "aa-01", Result.WRONG);
        UUID second = session(alice);
        answer(alice, second, "aa-01", Result.SKIPPED);
        assertThat(reader.lastWrong(alice)).containsExactly("aa-01");
    }

    @Test
    void 사용자_통계는_섞이지_않고_빈_목록은_빈_집합이다() {
        learn(alice, "aa-01");
        learn(bob, "aa-01");
        answer(alice, session(alice), "aa-01", Result.WRONG);
        assertThat(reader.lastWrong(bob)).isEmpty();
        assertThat(reader.lastWrongAmong(alice, List.of())).isEmpty();
        assertThat(reader.lastWrongAmong(bob, List.of("aa-01"))).isEmpty();
    }

    // -- 현황

    @Test
    void 처음_사용자의_현황은_모두_0이다() {
        var s = quiz.stats(alice);
        assertThat(s.askedLast30Days()).isZero();
        assertThat(s.sessionsLast30Days()).isZero();
        assertThat(s.mostMissed()).isEmpty();
    }

    @Test
    void 최근_30일_수치는_손으로_센_값과_같다() {
        learn(alice, "aa-01", "aa-02", "aa-03", "aa-04");
        UUID s1 = session(alice);
        answer(alice, s1, "aa-01", Result.CORRECT);
        answer(alice, s1, "aa-02", Result.CORRECT);
        answer(alice, s1, "aa-03", Result.WRONG);
        answer(alice, s1, "aa-04", Result.SKIPPED);
        UUID s2 = session(alice);
        answer(alice, s2, "aa-01", Result.WRONG);
        var s = quiz.stats(alice);
        assertThat(s.sessionsLast30Days()).isEqualTo(2);
        assertThat(s.askedLast30Days()).isEqualTo(4); // 맞음 2 + 틀림 2 (건너뜀은 출제로 세지 않는다)
        assertThat(s.correctLast30Days()).isEqualTo(2);
        assertThat(s.wrongLast30Days()).isEqualTo(2);
        assertThat(s.skippedLast30Days()).isEqualTo(1);
    }

    @Test
    void 삼십일_보다_오래된_기록은_수치에서_빠진다() {
        learn(alice, "aa-01", "aa-02");
        UUID s1 = session(alice);
        answer(alice, s1, "aa-01", Result.WRONG);
        answer(alice, s1, "aa-02", Result.CORRECT);
        jdbc.update("update quiz_item set answered_at = now() - interval '31 days' where session_id = ?", s1);
        jdbc.update("update quiz_session set started_at = now() - interval '31 days' where id = ?", s1);
        var s = quiz.stats(alice);
        assertThat(s.askedLast30Days()).isZero();
        assertThat(s.sessionsLast30Days()).isZero();
        // 자주 틀린 질문은 기간과 무관한 누적 통계다
        assertThat(s.mostMissed()).extracting(QuizService.MissedQuestion::questionSlug).containsExactly("aa-01");
    }

    @Test
    void 자주_틀린_질문은_틀린_횟수_순이고_틀린_적_없는_질문은_없다() {
        learn(alice, "aa-01", "aa-02", "aa-03");
        for (int i = 0; i < 3; i++) {
            answer(alice, session(alice), "aa-02", Result.WRONG);
        }
        answer(alice, session(alice), "aa-01", Result.WRONG);
        answer(alice, session(alice), "aa-01", Result.CORRECT);
        answer(alice, session(alice), "aa-03", Result.CORRECT);
        var missed = quiz.stats(alice).mostMissed();
        assertThat(missed).extracting(QuizService.MissedQuestion::questionSlug).containsExactly("aa-02", "aa-01");
        assertThat(missed.get(0).missCount()).isEqualTo(3);
        assertThat(missed.get(0).askCount()).isEqualTo(3);
        assertThat(missed.get(1).askCount()).isEqualTo(2);
    }

    @Test
    void 다른_사용자의_기록은_현황에_섞이지_않는다() {
        learn(alice, "aa-01");
        learn(bob, "aa-01");
        answer(bob, session(bob), "aa-01", Result.WRONG);
        assertThat(quiz.stats(alice).askedLast30Days()).isZero();
        assertThat(quiz.stats(bob).askedLast30Days()).isEqualTo(1);
    }

    // -- 설정

    @Test
    void 설정의_기본값은_꺼짐이고_저장하면_바뀌며_사용자별이다() {
        assertThat(quiz.includeUnlearnedDefault(alice)).isFalse();
        quiz.setIncludeUnlearnedDefault(alice, true);
        assertThat(quiz.includeUnlearnedDefault(alice)).isTrue();
        assertThat(quiz.includeUnlearnedDefault(bob)).isFalse();
        quiz.setIncludeUnlearnedDefault(alice, false);
        assertThat(quiz.includeUnlearnedDefault(alice)).isFalse();
        assertThat(count("select count(*) from user_pref where user_id = ?", alice)).isEqualTo(1);
    }

    @Test
    void 후보의_원본은_체크와_무관하게_마지막_결과_기준이다() {
        // 체크 여부는 진도의 사실이라 이 창구는 모른다: 체크하지 않은 질문도 마지막 결과가 틀림이면 나온다
        UUID id = UUID.randomUUID();
        quiz.start(alice, id, Scope.all(), true, 30, Mode.RANDOM);
        answer(alice, id, "aa-01", Result.WRONG);
        assertThat(reader.lastWrong(alice)).isEqualTo(Set.of("aa-01"));
    }
}
