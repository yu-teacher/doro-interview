package com.doro.interview.progress;

import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProgressServiceTest extends AbstractProgressTest {

    private OffsetDateTime learnedAt(String slug) {
        return jdbc.queryForObject("select learned_at from user_progress where user_id = ? and question_slug = ?",
                OffsetDateTime.class, alice, slug);
    }

    private void assertNotFound(Runnable call) {
        assertThatThrownBy(call::run).isInstanceOfSatisfying(InterviewException.class,
                e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.NOT_FOUND));
    }

    // -- 질문 하나

    @Test
    void 체크를_두_번_해도_행은_하나이고_처음_시각이_유지된다() throws Exception {
        service.setLearned(alice, "aa-01", true);
        OffsetDateTime first = learnedAt("aa-01");
        Thread.sleep(20);
        service.setLearned(alice, "aa-01", true);
        assertThat(rows(alice)).isEqualTo(1);
        assertThat(learnedAt("aa-01")).isEqualTo(first);
    }

    @Test
    void 해제는_행을_지우고_두_번_해도_오류가_없다() {
        service.setLearned(alice, "aa-01", true);
        service.setLearned(alice, "aa-01", false);
        assertThat(rows()).isZero();
        service.setLearned(alice, "aa-01", false);
        service.setLearned(alice, "aa-02", false); // 한 번도 체크한 적 없는 질문도 오류가 아니다
        assertThat(rows()).isZero();
    }

    @Test
    void 해제했다_다시_체크하면_새_시각이다() throws Exception {
        service.setLearned(alice, "aa-01", true);
        OffsetDateTime first = learnedAt("aa-01");
        service.setLearned(alice, "aa-01", false);
        Thread.sleep(20);
        service.setLearned(alice, "aa-01", true);
        assertThat(learnedAt("aa-01")).isAfter(first);
    }

    @Test
    void 같은_질문을_동시에_20번_체크해도_행은_하나다() throws Exception {
        var pool = Executors.newFixedThreadPool(20);
        try {
            List<Callable<Void>> calls = new ArrayList<>();
            for (int i = 0; i < 20; i++) {
                calls.add(() -> {
                    service.setLearned(alice, "aa-01", true);
                    return null;
                });
            }
            for (Future<Void> f : pool.invokeAll(calls)) {
                f.get(); // 예외가 있으면 여기서 터진다
            }
        } finally {
            pool.shutdownNow();
        }
        assertThat(rows(alice)).isEqualTo(1);
    }

    @Test
    void 보이지_않는_질문은_없는_것과_같은_404이고_아무것도_남기지_않는다() {
        retireAa04();
        assertNotFound(() -> service.setLearned(alice, "bb-01", true));    // 비공개 주제
        assertNotFound(() -> service.setLearned(alice, "aa-04", true));    // 닫힌 질문
        assertNotFound(() -> service.setLearned(alice, "zz-99", true));    // 없는 질문
        assertNotFound(() -> service.setLearned(alice, "bb-01", false));   // 해제도 마찬가지
        assertThat(rows()).isZero();
    }

    // -- 사용자 격리

    @Test
    void 사용자_A의_체크는_B에게_보이지_않는다() {
        service.setLearned(alice, "aa-01", true);
        service.setLearned(alice, "aa-02", true);
        service.setLearned(bob, "aa-03", true);
        assertThat(reader.learnedAmong(alice, list("aa-01", "aa-02", "aa-03"))).containsExactlyInAnyOrder("aa-01", "aa-02");
        assertThat(reader.learnedAmong(bob, list("aa-01", "aa-02", "aa-03"))).containsExactly("aa-03");
        assertThat(reader.learnedSlugs(bob)).containsExactly("aa-03");
        assertThat(service.summary(bob).learned()).isEqualTo(1);
    }

    @Test
    void 해제는_다른_사용자의_체크를_지우지_않는다() {
        service.setLearned(alice, "aa-01", true);
        service.setLearned(bob, "aa-01", true);
        service.setLearned(alice, "aa-01", false);
        assertThat(reader.learnedSlugs(bob)).containsExactly("aa-01");
    }

    @Test
    void learnedAmong은_빈_목록이면_빈_집합이고_목록_밖의_체크는_돌려주지_않는다() {
        service.setLearned(alice, "aa-01", true);
        assertThat(reader.learnedAmong(alice, List.of())).isEmpty();
        assertThat(reader.learnedAmong(alice, list("aa-02", "zz-99"))).isEmpty();
    }

    // -- 주제 일괄

    @Test
    void 주제_일괄_체크와_해제() {
        assertThat(service.setTopic(alice, "t1", true, 4)).isEqualTo(4);
        assertThat(reader.learnedSlugs(alice)).containsExactlyInAnyOrder("aa-01", "aa-02", "aa-03", "aa-04");
        service.setTopic(alice, "t1", true, 4); // 다시 해도 같다
        assertThat(rows(alice)).isEqualTo(4);
        service.setTopic(alice, "t1", false, 4);
        assertThat(rows()).isZero();
    }

    @Test
    void 주제_일괄은_그_주제만_건드리고_다른_주제의_체크는_그대로다() {
        service.setLearned(alice, "dd-01", true);
        service.setTopic(alice, "t1", true, 4);
        service.setTopic(alice, "t1", false, 4);
        assertThat(reader.learnedSlugs(alice)).containsExactly("dd-01");
    }

    @Test
    void 개수가_다르면_409이고_아무것도_바꾸지_않는다() {
        for (int wrong : new int[]{3, 5, 0, -1}) {
            assertThatThrownBy(() -> service.setTopic(alice, "t1", true, wrong)).isInstanceOfSatisfying(InterviewException.class,
                    e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.PROGRESS_COUNT_MISMATCH));
        }
        assertThat(rows()).isZero();
    }

    @Test
    void 콘텐츠가_바뀌어_개수가_달라진_뒤의_일괄은_409다() {
        retireAa04(); // 확인창이 4개를 보여 준 뒤 한 질문이 닫혔다
        assertThatThrownBy(() -> service.setTopic(alice, "t1", true, 4)).isInstanceOfSatisfying(InterviewException.class,
                e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.PROGRESS_COUNT_MISMATCH));
        assertThat(rows()).isZero();
        assertThat(service.setTopic(alice, "t1", true, 3)).isEqualTo(3);
    }

    @Test
    void 비공개_주제와_없는_주제의_일괄은_404다() {
        assertNotFound(() -> service.setTopic(alice, "t2", true, 1));
        assertNotFound(() -> service.setTopic(alice, "nope", true, 0));
        assertThat(rows()).isZero();
    }

    // -- 요약

    @Test
    void 처음_사용자의_요약은_분자_0이고_분모는_보이는_질문이다() {
        var s = service.summary(alice);
        assertThat(s.total()).isEqualTo(6);
        assertThat(s.learned()).isZero();
        assertThat(s.topics()).extracting(ProgressService.TopicProgress::topicSlug).containsExactly("t1", "t4");
    }

    @Test
    void 요약_수치는_손으로_센_값과_같고_닫힌_질문의_옛_기록은_세지_않는다() {
        service.setLearned(alice, "aa-01", true);
        service.setLearned(alice, "aa-04", true);
        service.setLearned(alice, "dd-01", true);
        retireAa04(); // aa-04 는 닫혔고 옛 체크 행은 남는다
        assertThat(rows(alice)).isEqualTo(3);

        var s = service.summary(alice);
        assertThat(s.total()).isEqualTo(5);   // t1: aa-01..03, t4: dd-01..02
        assertThat(s.learned()).isEqualTo(2); // aa-01, dd-01 (aa-04 는 제외)
        assertThat(s.topics()).containsExactly(new ProgressService.TopicProgress("t1", 3, 1), new ProgressService.TopicProgress("t4", 2, 1));
        assertThat(reader.learnedSlugs(alice)).contains("aa-04"); // 기록 자체는 보존된다
    }

    @Test
    void 비공개_주제의_질문은_요약에_나타나지_않는다() {
        var s = service.summary(alice);
        assertThat(s.topics()).extracting(ProgressService.TopicProgress::topicSlug).doesNotContain("t2");
    }
}
