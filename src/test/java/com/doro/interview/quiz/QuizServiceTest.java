package com.doro.interview.quiz;

import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import com.doro.interview.quiz.QuizPicker.Mode;
import com.doro.interview.quiz.QuizService.Result;
import com.doro.interview.quiz.QuizService.Scope;
import com.doro.interview.quiz.QuizService.SessionView;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** 시험 서비스(docs/M3-PLAN.md S3): 풀 구성, 멱등 시작, 결과 기록과 통계, 소유 검사, 진도에 쓰지 않음, 탈퇴 정리. */
class QuizServiceTest extends AbstractQuizTest {

    private SessionView start(UUID user, boolean includeUnlearned, int count) {
        return quiz.start(user, UUID.randomUUID(), Scope.all(), includeUnlearned, count, Mode.WEIGHTED);
    }

    private static List<String> slugs(SessionView s) {
        return s.items().stream().map(QuizService.ItemView::questionSlug).toList();
    }

    private void assertError(Runnable call, ErrorCode code) {
        assertThatThrownBy(call::run).isInstanceOfSatisfying(InterviewException.class, e -> assertThat(e.errorCode()).isEqualTo(code));
    }

    // -- 풀 구성

    @Test
    void 풀은_보이는_질문과_내_체크의_교집합이다() {
        learn(alice, "aa-01", "aa-02", "dd-01");
        jdbc.update("insert into user_progress (user_id, question_slug) values (?, 'bb-01')", alice); // 비공개 주제의 옛 기록
        var s = start(alice, false, 10);
        assertThat(slugs(s)).containsExactlyInAnyOrder("aa-01", "aa-02", "dd-01");
        assertThat(s.plannedCount()).isEqualTo(3);
    }

    @Test
    void 체크하지_않은_질문은_풀에_들어가지_않는다() {
        learn(alice, "aa-01");
        assertThat(slugs(start(alice, false, 10))).containsExactly("aa-01");
    }

    @Test
    void 미학습_포함이면_보이는_질문_전부가_풀이다() {
        learn(alice, "aa-01");
        var s = start(alice, true, 30);
        assertThat(slugs(s)).containsExactlyInAnyOrder("aa-01", "aa-02", "aa-03", "aa-04", "dd-01", "dd-02"); // bb-01(비공개) 제외
        assertThat(s.includeUnlearned()).isTrue();
    }

    @Test
    void 닫힌_질문은_체크했어도_풀에_없다() {
        learn(alice, "aa-01", "aa-02");
        retire("c1", "t1", "aa-02");
        assertThat(slugs(start(alice, false, 10))).containsExactly("aa-01");
    }

    @Test
    void 범위로_카테고리_주제_tier를_좁힌다() {
        learn(alice, "aa-01", "aa-02", "aa-03", "dd-01", "dd-02");
        assertThat(slugs(quiz.start(alice, UUID.randomUUID(), new Scope(List.of("c2"), List.of(), List.of()), false, 10, Mode.WEIGHTED)))
                .containsExactlyInAnyOrder("dd-01", "dd-02");
        assertThat(slugs(quiz.start(alice, UUID.randomUUID(), new Scope(List.of(), List.of("t1"), List.of("BASIC")), false, 10, Mode.WEIGHTED)))
                .containsExactlyInAnyOrder("aa-01", "aa-02");
        assertThat(slugs(quiz.start(alice, UUID.randomUUID(), new Scope(List.of(), List.of(), List.of("DEEP")), false, 10, Mode.WEIGHTED)))
                .containsExactlyInAnyOrder("aa-03", "dd-02");
    }

    @Test
    void 풀이_비면_세션을_만들지_않고_안내용_오류다() {
        assertError(() -> start(alice, false, 5), ErrorCode.QUIZ_POOL_EMPTY);
        learn(alice, "aa-01");
        assertError(() -> quiz.start(alice, UUID.randomUUID(), new Scope(List.of("c2"), List.of(), List.of()), false, 5, Mode.WEIGHTED), ErrorCode.QUIZ_POOL_EMPTY);
        assertThat(count("select count(*) from quiz_session")).isZero();
    }

    @Test
    void 개수는_1에서_30까지다() {
        learn(alice, "aa-01");
        assertError(() -> start(alice, false, 0), ErrorCode.INVALID_INPUT);
        assertError(() -> start(alice, false, 31), ErrorCode.INVALID_INPUT);
        assertThat(start(alice, false, 1).items()).hasSize(1);
        assertThat(start(alice, false, 30).items()).hasSize(1);
    }

    @Test
    void 요청_개수만큼만_뽑고_같은_질문이_없다() {
        learn(alice, "aa-01", "aa-02", "aa-03", "aa-04", "dd-01", "dd-02");
        var s = start(alice, false, 4);
        assertThat(s.items()).hasSize(4);
        assertThat(slugs(s)).doesNotHaveDuplicates();
        assertThat(s.items()).extracting(QuizService.ItemView::seq).containsExactly(1, 2, 3, 4);
    }

    // -- 멱등 시작·소유

    @Test
    void 같은_id로_다시_시작하면_같은_세션이고_문항이_늘지_않는다() {
        learn(alice, "aa-01", "aa-02", "aa-03", "aa-04");
        UUID id = UUID.randomUUID();
        var first = quiz.start(alice, id, Scope.all(), false, 3, Mode.WEIGHTED);
        var second = quiz.start(alice, id, Scope.all(), true, 30, Mode.RANDOM); // 다른 인자는 무시한다
        assertThat(second).isEqualTo(first);
        assertThat(count("select count(*) from quiz_item where session_id = ?", id)).isEqualTo(3);
        assertThat(count("select count(*) from quiz_session")).isEqualTo(1);
    }

    @Test
    void 남의_세션_id로_시작하거나_조회하면_없는_것과_같다() {
        learn(alice, "aa-01");
        learn(bob, "aa-01");
        UUID id = UUID.randomUUID();
        quiz.start(alice, id, Scope.all(), false, 5, Mode.WEIGHTED);
        assertError(() -> quiz.start(bob, id, Scope.all(), false, 5, Mode.WEIGHTED), ErrorCode.NOT_FOUND);
        assertError(() -> quiz.get(bob, id), ErrorCode.NOT_FOUND);
        assertError(() -> quiz.get(alice, UUID.randomUUID()), ErrorCode.NOT_FOUND);
    }

    @Test
    void 같은_id로_동시에_시작해도_세션과_문항은_하나다() throws Exception {
        learn(alice, "aa-01", "aa-02", "aa-03", "aa-04");
        UUID id = UUID.randomUUID();
        var pool = Executors.newFixedThreadPool(10);
        try {
            List<Callable<SessionView>> calls = new ArrayList<>();
            for (int i = 0; i < 10; i++) {
                calls.add(() -> quiz.start(alice, id, Scope.all(), false, 3, Mode.WEIGHTED));
            }
            List<SessionView> views = new ArrayList<>();
            for (Future<SessionView> f : pool.invokeAll(calls)) {
                views.add(f.get());
            }
            assertThat(views.stream().map(SessionView::items).distinct().count()).isEqualTo(1);
        } finally {
            pool.shutdownNow();
        }
        assertThat(count("select count(*) from quiz_session where id = ?", id)).isEqualTo(1);
        assertThat(count("select count(*) from quiz_item where session_id = ?", id)).isEqualTo(3);
    }

    // -- 결과 기록과 통계

    private SessionView started(String... learned) {
        learn(alice, learned);
        return start(alice, false, 30);
    }

    private int ask(UUID user, String slug) {
        return jdbc.queryForObject("select coalesce(max(ask_count), 0) from quiz_question_stats where user_id = ? and question_slug = ?", Integer.class, user, slug);
    }

    private int miss(UUID user, String slug) {
        return jdbc.queryForObject("select coalesce(max(miss_count), 0) from quiz_question_stats where user_id = ? and question_slug = ?", Integer.class, user, slug);
    }

    @Test
    void 맞음은_출제_횟수만_틀림은_출제와_틀린_횟수를_올린다() {
        var s = started("aa-01", "aa-02");
        var a = s.items().get(0); var b = s.items().get(1);
        quiz.record(alice, s.sessionId(), a.seq(), Result.CORRECT, 12, null);
        quiz.record(alice, s.sessionId(), b.seq(), Result.WRONG, 30, "내 답");
        assertThat(ask(alice, a.questionSlug())).isEqualTo(1);
        assertThat(miss(alice, a.questionSlug())).isZero();
        assertThat(ask(alice, b.questionSlug())).isEqualTo(1);
        assertThat(miss(alice, b.questionSlug())).isEqualTo(1);
        assertThat(jdbc.queryForObject("select last_result from quiz_question_stats where user_id = ? and question_slug = ?", String.class, alice, b.questionSlug())).isEqualTo("WRONG");
        var after = quiz.get(alice, s.sessionId());
        assertThat(after.items().get(1).answerText()).isEqualTo("내 답");
        assertThat(after.items().get(0).seconds()).isEqualTo(12);
    }

    @Test
    void 건너뛰기는_기록만_남기고_통계에_영향이_없다() {
        var s = started("aa-01");
        quiz.record(alice, s.sessionId(), 1, Result.SKIPPED, null, null);
        assertThat(quiz.get(alice, s.sessionId()).items().get(0).result()).isEqualTo(Result.SKIPPED);
        assertThat(count("select count(*) from quiz_question_stats")).isZero();
    }

    @Test
    void 같은_결과를_다시_보내도_통계는_한_번만_오른다() {
        var s = started("aa-01");
        for (int i = 0; i < 3; i++) {
            quiz.record(alice, s.sessionId(), 1, Result.WRONG, 5, null);
        }
        assertThat(ask(alice, "aa-01")).isEqualTo(1);
        assertThat(miss(alice, "aa-01")).isEqualTo(1);
    }

    @Test
    void 다른_결과는_409이고_통계와_기록이_그대로다() {
        var s = started("aa-01");
        quiz.record(alice, s.sessionId(), 1, Result.WRONG, 5, null);
        assertError(() -> quiz.record(alice, s.sessionId(), 1, Result.CORRECT, 5, null), ErrorCode.QUIZ_RESULT_CONFLICT);
        assertThat(quiz.get(alice, s.sessionId()).items().get(0).result()).isEqualTo(Result.WRONG);
        assertThat(ask(alice, "aa-01")).isEqualTo(1);
    }

    @Test
    void 같은_결과를_동시에_20번_보내도_통계는_한_번만_오른다() throws Exception {
        var s = started("aa-01");
        var pool = Executors.newFixedThreadPool(20);
        try {
            List<Callable<Void>> calls = new ArrayList<>();
            for (int i = 0; i < 20; i++) {
                calls.add(() -> {
                    quiz.record(alice, s.sessionId(), 1, Result.WRONG, 5, null);
                    return null;
                });
            }
            for (Future<Void> f : pool.invokeAll(calls)) {
                f.get();
            }
        } finally {
            pool.shutdownNow();
        }
        assertThat(ask(alice, "aa-01")).isEqualTo(1);
        assertThat(miss(alice, "aa-01")).isEqualTo(1);
    }

    @Test
    void 통계는_세션을_넘어_쌓인다() {
        learn(alice, "aa-01");
        for (Result r : new Result[]{Result.WRONG, Result.WRONG, Result.CORRECT}) {
            var s = start(alice, false, 1);
            quiz.record(alice, s.sessionId(), 1, r, 3, null);
        }
        assertThat(ask(alice, "aa-01")).isEqualTo(3);
        assertThat(miss(alice, "aa-01")).isEqualTo(2);
        assertThat(jdbc.queryForObject("select last_result from quiz_question_stats where user_id = ?", String.class, alice)).isEqualTo("CORRECT");
    }

    @Test
    void 남의_세션과_없는_문항에는_기록할_수_없다() {
        var s = started("aa-01");
        assertError(() -> quiz.record(bob, s.sessionId(), 1, Result.CORRECT, 1, null), ErrorCode.NOT_FOUND);
        assertError(() -> quiz.record(alice, s.sessionId(), 99, Result.CORRECT, 1, null), ErrorCode.NOT_FOUND);
        assertError(() -> quiz.record(alice, UUID.randomUUID(), 1, Result.CORRECT, 1, null), ErrorCode.NOT_FOUND);
        assertThat(count("select count(*) from quiz_question_stats")).isZero();
    }

    @Test
    void 사용자별_통계는_섞이지_않는다() {
        learn(bob, "aa-01");
        var a = started("aa-01");
        var b = start(bob, false, 5);
        quiz.record(alice, a.sessionId(), 1, Result.WRONG, 1, null);
        quiz.record(bob, b.sessionId(), 1, Result.CORRECT, 1, null);
        assertThat(miss(alice, "aa-01")).isEqualTo(1);
        assertThat(miss(bob, "aa-01")).isZero();
    }

    // -- 내 답 검증

    @Test
    void 내_답은_코드포인트_2000자까지이고_넘으면_400이다() {
        var s = started("aa-01");
        assertError(() -> quiz.record(alice, s.sessionId(), 1, Result.WRONG, 1, "가".repeat(2001)), ErrorCode.INVALID_INPUT);
        assertThat(count("select count(*) from quiz_question_stats")).isZero(); // 거절되면 아무것도 남지 않는다
        quiz.record(alice, s.sessionId(), 1, Result.WRONG, 1, "😀".repeat(2000));
        assertThat(quiz.get(alice, s.sessionId()).items().get(0).answerText()).hasSize(4000);
    }

    @Test
    void NUL_문자는_500이_아니라_400이다() {
        var s = started("aa-01");
        assertError(() -> quiz.record(alice, s.sessionId(), 1, Result.WRONG, 1, "a\u0000b"), ErrorCode.INVALID_INPUT);
    }

    @Test
    void 공백뿐인_답은_답_없음이고_줄바꿈은_통일된다() {
        var s = started("aa-01", "aa-02");
        quiz.record(alice, s.sessionId(), 1, Result.WRONG, 1, "  \n\t ");
        quiz.record(alice, s.sessionId(), 2, Result.WRONG, 1, "첫 줄\r\n둘째 줄");
        var items = quiz.get(alice, s.sessionId()).items();
        assertThat(items.get(0).answerText()).isNull();
        assertThat(items.get(1).answerText()).isEqualTo("첫 줄\n둘째 줄");
    }

    @Test
    void 걸린_시간은_음수일_수_없다() {
        var s = started("aa-01");
        assertError(() -> quiz.record(alice, s.sessionId(), 1, Result.CORRECT, -1, null), ErrorCode.INVALID_INPUT);
    }

    // -- 끝내기

    @Test
    void 끝내기는_멱등이고_끝난_뒤에는_기록할_수_없다() {
        var s = started("aa-01", "aa-02");
        quiz.record(alice, s.sessionId(), 1, Result.CORRECT, 1, null);
        quiz.finish(alice, s.sessionId());
        var first = quiz.get(alice, s.sessionId()).finishedAt();
        quiz.finish(alice, s.sessionId());
        assertThat(quiz.get(alice, s.sessionId()).finishedAt()).isEqualTo(first);
        assertError(() -> quiz.record(alice, s.sessionId(), 2, Result.CORRECT, 1, null), ErrorCode.QUIZ_FINISHED);
        assertThat(quiz.get(alice, s.sessionId()).items().get(1).result()).isNull(); // 안 푼 문항은 비어 있다
    }

    @Test
    void 끝난_시험에_같은_결과를_다시_보내는_것은_무시된다() {
        var s = started("aa-01");
        quiz.record(alice, s.sessionId(), 1, Result.WRONG, 1, null);
        quiz.finish(alice, s.sessionId());
        quiz.record(alice, s.sessionId(), 1, Result.WRONG, 1, null);
        assertThat(ask(alice, "aa-01")).isEqualTo(1);
    }

    @Test
    void 남의_세션은_끝낼_수_없다() {
        var s = started("aa-01");
        assertError(() -> quiz.finish(bob, s.sessionId()), ErrorCode.NOT_FOUND);
        assertThat(quiz.get(alice, s.sessionId()).finishedAt()).isNull();
    }

    // -- 진도와의 관계

    @Test
    void 시험은_진도에_쓰지_않는다_틀려도_체크는_그대로다() {
        var s = started("aa-01", "aa-02");
        int before = count("select count(*) from user_progress where user_id = ?", alice);
        quiz.record(alice, s.sessionId(), 1, Result.WRONG, 1, null);
        quiz.record(alice, s.sessionId(), 2, Result.WRONG, 1, null);
        quiz.finish(alice, s.sessionId());
        assertThat(count("select count(*) from user_progress where user_id = ?", alice)).isEqualTo(before).isEqualTo(2);
    }

    @Test
    void 시험_중에_질문이_닫혀도_그_세션은_그대로_진행된다() {
        var s = started("aa-01", "aa-02");
        String closed = s.items().get(0).questionSlug();
        retire("c1", "t1", closed);
        quiz.record(alice, s.sessionId(), 1, Result.CORRECT, 1, null);
        assertThat(ask(alice, closed)).isEqualTo(1);
        assertThat(quiz.get(alice, s.sessionId()).items()).hasSize(2);
    }

    // -- 직전 세션

    @Test
    void 직전_세션은_가장_최근에_시작한_세션이다() throws Exception {
        learn(alice, "aa-01", "aa-02");
        var first = start(alice, false, 1);
        Thread.sleep(15);
        var second = start(alice, false, 2);
        assertThat(second.items()).hasSize(2); // 직전 세션 가중은 순수 함수 시험이 다룬다: 여기서는 시작이 실패하지 않는지만
        assertThat(first.sessionId()).isNotEqualTo(second.sessionId());
    }

    // -- 탈퇴 정리

    @Test
    void 탈퇴하면_세션_문항_통계_설정이_사라지고_다른_사용자는_그대로다() {
        learn(alice, "aa-01");
        learn(bob, "aa-01");
        var a = start(alice, false, 5);
        var b = start(bob, false, 5);
        quiz.record(alice, a.sessionId(), 1, Result.WRONG, 1, "내 답");
        quiz.record(bob, b.sessionId(), 1, Result.WRONG, 1, "밥의 답");
        jdbc.update("insert into user_pref (user_id, include_unlearned_default) values (?, true), (?, true)", alice, bob);

        new QuizDeletedAccountCleaner(jdbc).on(new com.doro.interview.account.AccountDeleted(alice, java.time.Instant.now()));

        assertThat(count("select count(*) from quiz_session where user_id = ?", alice)).isZero();
        assertThat(count("select count(*) from quiz_item where session_id = ?", a.sessionId())).isZero();
        assertThat(count("select count(*) from quiz_question_stats where user_id = ?", alice)).isZero();
        assertThat(count("select count(*) from user_pref where user_id = ?", alice)).isZero();
        assertThat(count("select count(*) from quiz_session where user_id = ?", bob)).isEqualTo(1);
        assertThat(count("select count(*) from quiz_item where session_id = ?", b.sessionId())).isEqualTo(1);
        assertThat(count("select count(*) from quiz_question_stats where user_id = ?", bob)).isEqualTo(1);
        assertThat(count("select count(*) from user_pref where user_id = ?", bob)).isEqualTo(1);
    }
}
