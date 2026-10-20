package com.doro.interview.mine;

import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import com.doro.interview.mine.MyQuestionService.BatchItem;
import com.doro.interview.mine.MyQuestionService.Draft;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** 내 질문 서비스(docs/M4-PLAN.md S2): 검증 경계, 멱등, 격리, 상한, 일괄. */
class MyQuestionServiceTest extends AbstractMineTest {

    private static void assertInvalid(Runnable r) {
        assertThatThrownBy(r::run).isInstanceOfSatisfying(InterviewException.class, e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.INVALID_INPUT));
    }

    // -- 만들기·읽기

    @Test
    void 만들면_slug_가_my_접두사와_id_다() {
        UUID id = UUID.randomUUID();
        var q = service.put(alice, id, new Draft("  @Transactional 은?  ", "프록시\r\n입니다", List.of("AOP", " 프록시 ", "AOP"), "DEEP", " 강사 추천 "));
        assertThat(q.slug()).isEqualTo("my-" + id);
        assertThat(q.title()).isEqualTo("@Transactional 은?");          // 앞뒤 공백 정리
        assertThat(q.answerText()).isEqualTo("프록시\n입니다");            // 줄바꿈 통일
        assertThat(q.keywords()).containsExactly("AOP", "프록시");        // 정리 + 중복 제거(순서 유지)
        assertThat(q.tier()).isEqualTo("DEEP");
        assertThat(q.sourceLabel()).isEqualTo("강사 추천");
    }

    @Test
    void 기본값은_기본_난이도와_빈_답이고_빈_출처는_없음이다() {
        var q = service.put(alice, UUID.randomUUID(), new Draft("제목", null, null, null, "   "));
        assertThat(q.tier()).isEqualTo("BASIC");
        assertThat(q.answerText()).isEmpty();
        assertThat(q.keywords()).isEmpty();
        assertThat(q.sourceLabel()).isNull();
    }

    @Test
    void 같은_id_로_다시_보내면_같은_질문을_바꾼다_멱등() {
        UUID id = UUID.randomUUID();
        var first = service.put(alice, id, draft("처음"));
        var again = service.put(alice, id, draft("처음"));
        assertThat(rows()).isOne();
        assertThat(again.createdAt()).isEqualTo(first.createdAt());      // 만든 시각은 그대로
        var edited = service.put(alice, id, draft("바뀜"));
        assertThat(rows()).isOne();
        assertThat(edited.title()).isEqualTo("바뀜");
        assertThat(edited.createdAt()).isEqualTo(first.createdAt());
        assertThat(edited.updatedAt()).isAfterOrEqualTo(first.updatedAt());
    }

    @Test
    void 목록은_내_것만_만든_순서대로다() {
        service.put(alice, UUID.randomUUID(), draft("a1"));
        service.put(bob, UUID.randomUUID(), draft("b1"));
        service.put(alice, UUID.randomUUID(), draft("a2"));
        assertThat(service.list(alice)).extracting(MyQuestionService.Question::title).containsExactly("a1", "a2");
        assertThat(service.list(bob)).extracting(MyQuestionService.Question::title).containsExactly("b1");
    }

    // -- 격리

    @Test
    void 남의_id_로_읽거나_덮어쓰거나_지울_수_없다() {
        UUID id = UUID.randomUUID();
        service.put(alice, id, draft("앨리스의 질문"));
        assertThat(service.get(bob, id)).isEmpty();
        assertThatThrownBy(() -> service.put(bob, id, draft("가로채기")))
                .isInstanceOfSatisfying(InterviewException.class, e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.NOT_FOUND));
        assertThat(service.delete(bob, id)).isFalse();
        assertThat(service.get(alice, id).orElseThrow().title()).isEqualTo("앨리스의 질문");
        assertThat(rows()).isOne();
    }

    @Test
    void 일괄에_남의_id_가_섞이면_전부_저장되지_않는다() {
        UUID taken = UUID.randomUUID();
        service.put(alice, taken, draft("앨리스"));
        assertThatThrownBy(() -> service.putAll(bob, List.of(new BatchItem(UUID.randomUUID(), draft("밥1")), new BatchItem(taken, draft("가로채기")))))
                .isInstanceOf(InterviewException.class);
        assertThat(service.list(bob)).isEmpty();
        assertThat(rows()).isOne();
    }

    // -- 검증 경계

    @Test
    void 제목_경계() {
        assertInvalid(() -> service.put(alice, UUID.randomUUID(), draft("")));
        assertInvalid(() -> service.put(alice, UUID.randomUUID(), draft("   ")));
        assertInvalid(() -> service.put(alice, UUID.randomUUID(), draft("가".repeat(201))));
        assertThat(service.put(alice, UUID.randomUUID(), draft("가".repeat(200))).title()).hasSize(200);
        assertThat(service.put(alice, UUID.randomUUID(), draft("😀".repeat(200))).title().codePointCount(0, 400)).isEqualTo(200); // 코드포인트 기준
        assertInvalid(() -> service.put(alice, UUID.randomUUID(), draft("😀".repeat(201))));
    }

    @Test
    void 답_경계는_4000자이고_NUL_은_거절한다() {
        assertThat(service.put(alice, UUID.randomUUID(), new Draft("t", "가".repeat(4000), List.of(), "BASIC", null)).answerText()).hasSize(4000);
        assertInvalid(() -> service.put(alice, UUID.randomUUID(), new Draft("t", "가".repeat(4001), List.of(), "BASIC", null)));
        assertInvalid(() -> service.put(alice, UUID.randomUUID(), new Draft("t", "a\u0000b", List.of(), "BASIC", null)));
        assertInvalid(() -> service.put(alice, UUID.randomUUID(), new Draft("a\u0000b", "", List.of(), "BASIC", null)));
        assertInvalid(() -> service.put(alice, UUID.randomUUID(), new Draft("t", "", List.of("a\u0000"), "BASIC", null)));
        assertInvalid(() -> service.put(alice, UUID.randomUUID(), new Draft("t", "", List.of(), "BASIC", "a\u0000")));
    }

    @Test
    void 키워드_경계는_10개_각_40자이고_빈_키워드는_거절한다() {
        List<String> ten = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            ten.add("k" + i);
        }
        assertThat(service.put(alice, UUID.randomUUID(), new Draft("t", "", ten, "BASIC", null)).keywords()).hasSize(10);
        List<String> eleven = new ArrayList<>(ten);
        eleven.add("k10");
        assertInvalid(() -> service.put(alice, UUID.randomUUID(), new Draft("t", "", eleven, "BASIC", null)));
        assertInvalid(() -> service.put(alice, UUID.randomUUID(), new Draft("t", "", List.of("가".repeat(41)), "BASIC", null)));
        assertInvalid(() -> service.put(alice, UUID.randomUUID(), new Draft("t", "", List.of("  "), "BASIC", null)));
        assertThat(service.put(alice, UUID.randomUUID(), new Draft("t", "", List.of("가".repeat(40)), "BASIC", null)).keywords()).hasSize(1);
    }

    @Test
    void 중복_키워드를_합친_뒤에_개수를_센다() {
        List<String> dup = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            dup.add("같은");
        }
        assertThat(service.put(alice, UUID.randomUUID(), new Draft("t", "", dup, "BASIC", null)).keywords()).containsExactly("같은");
    }

    @Test
    void 난이도와_출처_경계() {
        assertInvalid(() -> service.put(alice, UUID.randomUUID(), new Draft("t", "", List.of(), "EASY", null)));
        assertInvalid(() -> service.put(alice, UUID.randomUUID(), new Draft("t", "", List.of(), "basic", null)));
        assertInvalid(() -> service.put(alice, UUID.randomUUID(), new Draft("t", "", List.of(), "BASIC", "가".repeat(41))));
        assertThat(service.put(alice, UUID.randomUUID(), new Draft("t", "", List.of(), "TRICKY", "가".repeat(40))).sourceLabel()).hasSize(40);
    }

    // -- 상한·일괄

    private void fill(UUID user, int n) {
        for (int i = 0; i < n; i++) {
            jdbc.update("insert into my_question (id, user_id, title, tier) values (?, ?, ?, 'BASIC')", UUID.randomUUID(), user, "q" + i);
        }
    }

    @Test
    void 사용자당_300개까지이고_301번째는_409다() {
        fill(alice, 299);
        service.put(alice, UUID.randomUUID(), draft("300번째"));
        assertThat(service.list(alice)).hasSize(300);
        assertThatThrownBy(() -> service.put(alice, UUID.randomUUID(), draft("301번째")))
                .isInstanceOfSatisfying(InterviewException.class, e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.MINE_LIMIT));
        assertThat(service.list(alice)).hasSize(300);
        // 상한에 닿아도 이미 있는 질문의 수정은 된다
        UUID existing = service.list(alice).get(0).id();
        assertThat(service.put(alice, existing, draft("수정")).title()).isEqualTo("수정");
        // 다른 사용자는 영향이 없다
        service.put(bob, UUID.randomUUID(), draft("밥"));
    }

    @Test
    void 일괄이_상한을_넘기면_하나도_저장되지_않는다() {
        fill(alice, 295);
        List<BatchItem> six = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            six.add(new BatchItem(UUID.randomUUID(), draft("새" + i)));
        }
        assertThatThrownBy(() -> service.putAll(alice, six)).isInstanceOfSatisfying(InterviewException.class,
                e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.MINE_LIMIT));
        assertThat(service.list(alice)).hasSize(295);
        service.putAll(alice, six.subList(0, 5));
        assertThat(service.list(alice)).hasSize(300);
    }

    @Test
    void 일괄은_1에서_50개이고_같은_id_가_두_번이면_거절한다() {
        assertInvalid(() -> service.putAll(alice, List.of()));
        List<BatchItem> fiftyOne = new ArrayList<>();
        for (int i = 0; i < 51; i++) {
            fiftyOne.add(new BatchItem(UUID.randomUUID(), draft("q" + i)));
        }
        assertInvalid(() -> service.putAll(alice, fiftyOne));
        assertThat(service.putAll(alice, fiftyOne.subList(0, 50))).hasSize(50);
        UUID same = UUID.randomUUID();
        assertInvalid(() -> service.putAll(bob, List.of(new BatchItem(same, draft("a")), new BatchItem(same, draft("b")))));
    }

    @Test
    void 일괄에_잘못된_항목이_하나면_전부_저장되지_않는다() {
        assertInvalid(() -> service.putAll(alice, List.of(new BatchItem(UUID.randomUUID(), draft("좋음")), new BatchItem(UUID.randomUUID(), draft("")))));
        assertThat(rows()).isZero();
    }

    @Test
    void 동시에_만들어도_상한을_넘지_않는다() throws Exception {
        fill(alice, 295);
        int threads = 12;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Boolean>> results = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            results.add(pool.submit(() -> {
                start.await();
                try {
                    service.put(alice, UUID.randomUUID(), draft("동시"));
                    return true;
                } catch (InterviewException e) {
                    return false;
                }
            }));
        }
        start.countDown();
        int ok = 0;
        for (Future<Boolean> f : results) {
            if (f.get()) {
                ok++;
            }
        }
        pool.shutdown();
        assertThat(ok).isEqualTo(5);
        assertThat(service.list(alice)).hasSize(300);
    }

    // -- 삭제

    @Test
    void 지우면_사라지고_다시_지우면_false_다() {
        UUID id = UUID.randomUUID();
        service.put(alice, id, draft("지울 것"));
        assertThat(service.delete(alice, id)).isTrue();
        assertThat(service.get(alice, id)).isEmpty();
        assertThat(service.delete(alice, id)).isFalse();
    }

    // -- 읽기 창구

    @Test
    void 읽기_창구는_내_질문만_알려_준다() {
        UUID mine = UUID.randomUUID();
        UUID theirs = UUID.randomUUID();
        service.put(alice, mine, new Draft("내 질문", "", List.of(), "DEEP", null));
        service.put(bob, theirs, draft("남의 질문"));
        assertThat(reader.exists(alice, "my-" + mine)).isTrue();
        assertThat(reader.exists(alice, "my-" + theirs)).isFalse();
        assertThat(reader.exists(alice, "my-not-a-uuid")).isFalse();
        assertThat(reader.exists(alice, "aa-01")).isFalse();
        assertThat(reader.exists(alice, null)).isFalse();
        assertThat(reader.poolEntries(alice)).extracting("slug", "tier").containsExactly(org.assertj.core.groups.Tuple.tuple("my-" + mine, "DEEP"));
        var headings = reader.headings(alice, List.of("my-" + mine, "my-" + theirs, "aa-01", "my-x"));
        assertThat(headings).containsOnlyKeys("my-" + mine);
        assertThat(headings.get("my-" + mine).title()).isEqualTo("내 질문");
        assertThat(reader.headings(alice, List.of())).isEmpty();
    }

    @Test
    void 대문자_UUID_나_변형된_slug_는_내_질문이_아니다() {
        UUID id = UUID.randomUUID();
        service.put(alice, id, draft("q"));
        assertThat(reader.exists(alice, "my-" + id.toString().toUpperCase())).isFalse();
        assertThat(reader.exists(alice, "my-" + id + "x")).isFalse();
    }

    // -- 탈퇴 정리

    @Test
    void 탈퇴_리스너는_그_사용자의_내_질문만_지운다() {
        service.put(alice, UUID.randomUUID(), draft("a"));
        service.put(bob, UUID.randomUUID(), draft("b"));
        new MyQuestionDeletedAccountCleaner(jdbc).on(new com.doro.interview.account.AccountDeleted(alice, java.time.Instant.now()));
        assertThat(service.list(alice)).isEmpty();
        assertThat(service.list(bob)).hasSize(1);
    }
}
