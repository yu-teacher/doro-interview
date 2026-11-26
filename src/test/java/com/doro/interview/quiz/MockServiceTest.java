package com.doro.interview.quiz;

import com.doro.interview.account.AccountDeleted;
import com.doro.interview.account.ProgressReset;
import com.doro.interview.catalog.CatalogReader;
import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import com.doro.interview.progress.read.ProgressReader;
import com.doro.interview.quiz.MockPlanner.Origin;
import com.doro.interview.quiz.MockService.SessionView;
import com.doro.interview.quiz.MockService.TurnView;
import com.doro.interview.quiz.QuizService.Result;
import com.doro.interview.quiz.QuizService.Scope;
import com.doro.interview.support.ContentFixture;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import tools.jackson.databind.ObjectMapper;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.SplittableRandom;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 꼬리질문 모의면접 서비스(docs/M7-PLAN.md S3). 연결이 있는 데이터:
 *
 * <pre>
 * c1/t1 공개   aa-01 →F aa-02, →P aa-04 · aa-02 →F aa-03 · aa-03 →F bb-01(비공개라 없는 연결) · aa-04
 * c1/t2 비공개 bb-01
 * c2/t4 공개   dd-01 →F dd-02 · dd-02
 * 본 질문 풀(꼬리질문이 있는 보이는 질문): aa-01, aa-02, dd-01
 * </pre>
 */
class MockServiceTest extends AbstractQuizTest {

    private static final Instant NOW = Instant.parse("2026-11-26T03:00:00Z");

    @Autowired
    CatalogReader catalog;
    @Autowired
    ProgressReader progressReader;
    @Autowired
    ObjectMapper json;
    /** 트랜잭션·잠금이 걸린 실제 빈(동시성 시험용). 나머지 시험은 난수·시계를 고정한 {@link #mock} 을 쓴다. */
    @Autowired
    MockService mockBean;

    MockService mock;

    @BeforeEach
    void seedLinks() {
        jdbc.execute("TRUNCATE mock_turn, mock_session");
        fx = new ContentFixture(tmp.resolve("mock")).category("c1").category("c2")
                .topic("c1", "t1", "aa", true).topic("c1", "t2", "bb", false).topic("c2", "t4", "dd", true)
                .questionFull("c1", "t1", "aa-01", "BASIC", "질문 1", HEADER + "답 1.\n", "2026-10-20", List.of(),
                        List.of("links: [{to: \"aa-02\", kind: FOLLOWUP}, {to: \"aa-04\", kind: PREREQ}]"))
                .questionFull("c1", "t1", "aa-02", "BASIC", "질문 2", HEADER + "답 2.\n", "2026-10-20", List.of(),
                        List.of("links: [{to: \"aa-03\", kind: FOLLOWUP}]"))
                .questionFull("c1", "t1", "aa-03", "DEEP", "질문 3", HEADER + "답 3.\n", "2026-10-20", List.of(),
                        List.of("links: [{to: \"bb-01\", kind: FOLLOWUP}]"))
                .questionFull("c1", "t1", "aa-04", "TRICKY", "질문 4", HEADER + "답 4.\n", "2026-10-20", List.of())
                .question("c1", "t2", "bb-01", "비공개 주제의 질문", HEADER + "초안.\n")
                .questionFull("c2", "t4", "dd-01", "BASIC", "질문 d1", HEADER + "답 d1.\n", "2026-10-20", List.of(),
                        List.of("links: [{to: \"dd-02\", kind: FOLLOWUP}]"))
                .questionFull("c2", "t4", "dd-02", "DEEP", "질문 d2", HEADER + "답 d2.\n", "2026-10-20", List.of());
        loader.load(fx.location());
        mock = new MockService(jdbc, catalog, progressReader, quiz, json, new SplittableRandom(3), Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private SessionView start(UUID user, boolean includeUnlearned, int mains, int depth) {
        return mock.start(user, UUID.randomUUID(), Scope.all(), includeUnlearned, mains, depth);
    }

    private static TurnView current(SessionView s) {
        return s.turns().stream().filter(t -> t.result() == null).findFirst().orElse(null);
    }

    private static List<String> slugs(SessionView s) {
        return s.turns().stream().map(TurnView::questionSlug).toList();
    }

    private void assertError(Runnable call, ErrorCode code) {
        assertThatThrownBy(call::run).isInstanceOfSatisfying(InterviewException.class, e -> assertThat(e.errorCode()).isEqualTo(code));
    }

    private int askCount(UUID user, String slug) {
        return jdbc.queryForList("SELECT ask_count FROM quiz_question_stats WHERE user_id = ? AND question_slug = ?", Integer.class, user, slug)
                .stream().findFirst().orElse(0);
    }

    // -- 풀

    @Test
    void 본_질문은_꼬리질문이_있는_내가_체크한_질문에서만_뽑는다() {
        learn(alice, "aa-01", "aa-03", "aa-04", "dd-02"); // aa-03 은 연결 대상이 비공개, aa-04·dd-02 는 연결이 없다
        var s = start(alice, false, 5, 2);
        assertThat(s.plannedMains()).isEqualTo(1);
        assertThat(slugs(s)).containsExactly("aa-01");
        assertThat(s.turns().get(0)).isEqualTo(new TurnView(1, null, 0, Origin.MAIN, "aa-01", null, null, null, null));
    }

    @Test
    void 미학습_포함이면_꼬리질문이_있는_보이는_질문_전부가_풀이다() {
        var s = start(alice, true, 5, 2);
        assertThat(s.plannedMains()).isEqualTo(3); // aa-01, aa-02, dd-01
        assertThat(s.mainCount()).isEqualTo(5);
    }

    @Test
    void 풀이_비면_세션을_만들지_않는다() {
        learn(alice, "aa-04");
        assertError(() -> start(alice, false, 3, 2), ErrorCode.MOCK_POOL_EMPTY);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM mock_session", Integer.class)).isZero();
    }

    @Test
    void 본_질문_수와_깊이는_범위를_지킨다() {
        for (int[] bad : new int[][]{{0, 2}, {6, 2}, {3, -1}, {3, 4}}) {
            assertError(() -> start(alice, true, bad[0], bad[1]), ErrorCode.INVALID_INPUT);
        }
    }

    // -- 시작·조회

    @Test
    void 같은_id_로_다시_시작하면_같은_세션이고_남의_세션은_없는_것과_같다() {
        UUID id = UUID.randomUUID();
        var first = mock.start(alice, id, Scope.all(), true, 3, 2);
        var again = mock.start(alice, id, Scope.all(), false, 1, 0);
        assertThat(again).isEqualTo(first);
        assertError(() -> mock.get(bob, id), ErrorCode.NOT_FOUND);
        assertError(() -> mock.start(bob, id, Scope.all(), true, 3, 2), ErrorCode.NOT_FOUND);
        assertError(() -> mock.record(bob, id, 1, Result.CORRECT, null, null), ErrorCode.NOT_FOUND);
        assertError(() -> mock.finish(bob, id), ErrorCode.NOT_FOUND);
        // 404 이전에 아무것도 쓰지 않았다(이 시험의 서비스는 트랜잭션 없이 돌아서, 쓰고 나서 404 를 내면 여기서 드러난다)
        var untouched = mock.get(alice, id);
        assertThat(untouched.turns()).hasSize(1);
        assertThat(untouched.turns().get(0).result()).isNull();
        assertThat(untouched.finishedAt()).isNull();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM quiz_question_stats WHERE user_id = ?", Integer.class, bob)).isZero();
    }

    // -- 꼬리 흐름

    @Test
    void 맞으면_꼬리질문을_깊이_상한까지_잇고_본_질문이_없으면_끝난다() {
        learn(alice, "aa-01");
        var s = start(alice, false, 1, 2);
        UUID id = s.sessionId();
        s = mock.record(alice, id, 1, Result.CORRECT, 30, "프록시로 감싼다");
        assertThat(current(s)).isEqualTo(new TurnView(2, 1, 1, Origin.LINK, "aa-02", null, null, null, null));
        s = mock.record(alice, id, 2, Result.CORRECT, 20, null);
        assertThat(current(s)).isEqualTo(new TurnView(3, 2, 2, Origin.LINK, "aa-03", null, null, null, null));
        s = mock.record(alice, id, 3, Result.CORRECT, 10, null);
        assertThat(current(s)).isNull();
        assertThat(s.finishedAt()).isEqualTo(NOW);
        assertThat(slugs(s)).containsExactly("aa-01", "aa-02", "aa-03");
        assertThat(s.turns().get(0).answerText()).isEqualTo("프록시로 감싼다");
    }

    @Test
    void 틀리면_기초_질문을_한_번_묻고_그_줄기를_끝낸다() {
        learn(alice, "aa-01");
        var s = start(alice, false, 1, 2);
        s = mock.record(alice, s.sessionId(), 1, Result.WRONG, null, null);
        assertThat(current(s)).isEqualTo(new TurnView(2, 1, 0, Origin.PREREQ, "aa-04", null, null, null, null));
        s = mock.record(alice, s.sessionId(), 2, Result.CORRECT, null, null);
        assertThat(current(s)).isNull();
        assertThat(s.finishedAt()).isNotNull();
    }

    @Test
    void 줄기가_끝나면_다음_본_질문으로_가고_이미_나온_질문은_본_질문으로_다시_묻지_않는다() {
        learn(alice, "aa-01", "aa-02");
        // 깊이 1: aa-01 → aa-02(꼬리) 다음 줄기의 본 질문 aa-02 는 이미 나왔으므로 건너뛰고 끝난다
        var s = start(alice, false, 2, 1);
        UUID id = s.sessionId();
        String firstMain = slugs(s).get(0);
        s = mock.record(alice, id, 1, Result.CORRECT, null, null);
        if (firstMain.equals("aa-01")) {
            assertThat(current(s).questionSlug()).isEqualTo("aa-02");
            assertThat(current(s).origin()).isEqualTo(Origin.LINK);
            s = mock.record(alice, id, 2, Result.CORRECT, null, null);
            assertThat(current(s)).isNull();
        } else {
            // aa-02 → aa-03(꼬리, 깊이 1) → 다음 본 질문 aa-01
            assertThat(current(s).questionSlug()).isEqualTo("aa-03");
            s = mock.record(alice, id, 2, Result.CORRECT, null, null);
            assertThat(current(s)).isEqualTo(new TurnView(3, null, 0, Origin.MAIN, "aa-01", null, null, null, null));
        }
        assertThat(slugs(s)).doesNotHaveDuplicates();
    }

    // -- 결과 고정·멱등·통계

    @Test
    void 같은_결과를_다시_보내면_아무것도_바뀌지_않고_다른_결과는_409() {
        learn(alice, "aa-01");
        var s = start(alice, false, 1, 2);
        var after = mock.record(alice, s.sessionId(), 1, Result.CORRECT, 5, null);
        var again = mock.record(alice, s.sessionId(), 1, Result.CORRECT, 99, "다른 답");
        assertThat(again).isEqualTo(after);
        assertThat(after.turns()).hasSize(2);
        assertThat(askCount(alice, "aa-01")).isEqualTo(1);
        assertError(() -> mock.record(alice, s.sessionId(), 1, Result.WRONG, null, null), ErrorCode.QUIZ_RESULT_CONFLICT);
        assertError(() -> mock.record(alice, s.sessionId(), 9, Result.WRONG, null, null), ErrorCode.NOT_FOUND);
    }

    @Test
    void 동시에_같은_결과를_보내도_다음_턴과_통계는_한_번만_생긴다() throws Exception {
        learn(alice, "aa-01");
        var s = start(alice, false, 1, 2);
        ExecutorService pool = Executors.newFixedThreadPool(6);
        try {
            List<Callable<SessionView>> calls = java.util.stream.IntStream.range(0, 6)
                    .mapToObj(i -> (Callable<SessionView>) () -> mockBean.record(alice, s.sessionId(), 1, Result.CORRECT, null, null)).toList();
            for (Future<SessionView> f : pool.invokeAll(calls)) {
                assertThat(f.get().turns()).hasSize(2);
            }
        } finally {
            pool.shutdownNow();
        }
        assertThat(jdbc.queryForObject("SELECT count(*) FROM mock_turn WHERE session_id = ?", Integer.class, s.sessionId())).isEqualTo(2);
        assertThat(askCount(alice, "aa-01")).isEqualTo(1);
    }

    @Test
    void 꼬리질문과_기초_질문의_맞음_틀림은_출제_통계에_들어가고_건너뜀은_안_들어간다() {
        learn(alice, "aa-01");
        var s = start(alice, false, 1, 2);
        s = mock.record(alice, s.sessionId(), 1, Result.WRONG, null, null);   // aa-01 틀림 → aa-04
        mock.record(alice, s.sessionId(), 2, Result.SKIPPED, null, null);      // aa-04 건너뜀
        assertThat(jdbc.queryForObject("SELECT miss_count FROM quiz_question_stats WHERE user_id = ? AND question_slug = 'aa-01'", Integer.class, alice))
                .isEqualTo(1);
        assertThat(askCount(alice, "aa-04")).isZero();
        var t = start(alice, false, 1, 2);
        mock.record(alice, t.sessionId(), 1, Result.CORRECT, null, null);      // aa-01 맞음 → aa-02
        mock.record(alice, t.sessionId(), 2, Result.CORRECT, null, null);      // aa-02(꼬리) 맞음
        assertThat(askCount(alice, "aa-02")).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT last_result FROM quiz_question_stats WHERE user_id = ? AND question_slug = 'aa-01'", String.class, alice))
                .isEqualTo("CORRECT");
    }

    @Test
    void 모의면접은_진도에_쓰지_않는다() {
        var s = start(alice, true, 3, 2);
        mock.record(alice, s.sessionId(), 1, Result.CORRECT, null, null);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM user_progress WHERE user_id = ?", Integer.class, alice)).isZero();
    }

    // -- 끝내기

    @Test
    void 끝낸_세션에는_더_기록할_수_없고_끝내기는_멱등이다() {
        var s = start(alice, true, 3, 2);
        var done = mock.finish(alice, s.sessionId());
        assertThat(done.finishedAt()).isEqualTo(NOW);
        assertThat(mock.finish(alice, s.sessionId())).isEqualTo(done);
        assertError(() -> mock.record(alice, s.sessionId(), 1, Result.CORRECT, null, null), ErrorCode.QUIZ_FINISHED);
    }

    @Test
    void 답은_시험과_같은_규칙으로_검사한다() {
        var s = start(alice, true, 3, 2);
        assertError(() -> mock.record(alice, s.sessionId(), 1, Result.CORRECT, null, "a\u0000b"), ErrorCode.INVALID_INPUT);
        assertError(() -> mock.record(alice, s.sessionId(), 1, Result.CORRECT, null, "가".repeat(2001)), ErrorCode.INVALID_INPUT);
        assertError(() -> mock.record(alice, s.sessionId(), 1, Result.CORRECT, -1, null), ErrorCode.INVALID_INPUT);
        var ok = mock.record(alice, s.sessionId(), 1, Result.CORRECT, null, "   ");
        assertThat(ok.turns().get(0).answerText()).isNull();
    }

    // -- 정리

    @Test
    void 탈퇴하면_그_사용자의_모의면접만_지운다() {
        var a = start(alice, true, 3, 2);
        start(bob, true, 3, 2);
        mock.record(alice, a.sessionId(), 1, Result.CORRECT, null, null);
        new QuizDeletedAccountCleaner(jdbc).on(new AccountDeleted(alice, Instant.now()));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM mock_session WHERE user_id = ?", Integer.class, alice)).isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM mock_turn WHERE session_id = ?", Integer.class, a.sessionId())).isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM mock_session WHERE user_id = ?", Integer.class, bob)).isEqualTo(1);
    }

    @Test
    void 학습_현황_초기화도_모의면접_기록을_지운다() {
        var a = start(alice, true, 3, 2);
        new QuizProgressResetCleaner(jdbc).on(new ProgressReset(alice));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM mock_turn WHERE session_id = ?", Integer.class, a.sessionId())).isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM mock_session", Integer.class)).isZero();
    }
}
