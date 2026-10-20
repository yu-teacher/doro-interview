package com.doro.interview.api;

import com.doro.interview.account.AccountDeleted;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 내 질문과 체크·시험·후보·현황의 연동(docs/M4-PLAN.md S3). */
class MineIntegrationApiTest extends AbstractProgressApiTest {

    @Autowired
    ApplicationEventPublisher events;
    @Autowired
    TransactionTemplate tx;

    private UUID create(UUID user, String title, String tier) throws Exception {
        UUID id = UUID.randomUUID();
        putAs(user, "/api/v1/mine/" + id, "{\"title\":\"" + title + "\",\"tier\":\"" + tier + "\",\"answerText\":\"내가 적은 답\"}").andExpect(status().isOk());
        return id;
    }

    private void check(UUID user, String slug, boolean learned) throws Exception {
        putAs(user, "/api/v1/progress/" + slug, "{\"learned\":" + learned + "}").andExpect(status().isOk());
    }

    private String start(UUID user, UUID session, String scope) throws Exception {
        return bodyOf(putAs(user, "/api/v1/quiz/" + session, "{\"count\":10,\"includeUnlearned\":false" + scope + "}").andExpect(status().isOk()));
    }

    private java.util.List<String> slugs(String body) {
        java.util.List<String> out = new java.util.ArrayList<>();
        for (JsonNode i : json.readTree(body).at("/data/items")) {
            out.add(i.get("questionSlug").asText());
        }
        return out;
    }

    private int count(String table) {
        return jdbc.queryForObject("select count(*) from " + table, Integer.class);
    }

    private void record(UUID user, UUID session, int seq, String result) throws Exception {
        putAs(user, "/api/v1/quiz/" + session + "/items/" + seq, "{\"result\":\"" + result + "\",\"seconds\":5}").andExpect(status().isOk());
    }

    // -- 체크

    @Test
    void 내_질문은_체크할_수_있고_남의_질문_없는_질문은_404다() throws Exception {
        UUID mine = create(alice, "내 질문", "BASIC");
        UUID theirs = create(bob, "남의 질문", "BASIC");
        check(alice, "my-" + mine, true);
        putAs(alice, "/api/v1/progress/my-" + theirs, "{\"learned\":true}").andExpect(status().isNotFound());
        putAs(alice, "/api/v1/progress/my-" + UUID.randomUUID(), "{\"learned\":true}").andExpect(status().isNotFound());
        assertThat(count("user_progress")).isOne();
        getAs(alice, "/api/v1/mine/" + mine).andExpect(jsonPath("$.data.learned").value(true));
        getAs(bob, "/api/v1/mine/" + theirs).andExpect(jsonPath("$.data.learned").value(false));
        check(alice, "my-" + mine, false);
        assertThat(count("user_progress")).isZero();
    }

    @Test
    void 공용_진도_요약은_내_질문을_세지_않는다() throws Exception {
        UUID mine = create(alice, "내 질문", "BASIC");
        check(alice, "aa-01", true);
        check(alice, "my-" + mine, true);
        getAs(alice, "/api/v1/progress/summary").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(3))      // aa-01·02·03 (공개 주제)
                .andExpect(jsonPath("$.data.learned").value(1));
    }

    @Test
    void 내_질문에는_노트를_붙일_수_없다() throws Exception {
        UUID mine = create(alice, "내 질문", "BASIC");
        putAs(alice, "/api/v1/notes/my-" + mine, "{\"body\":\"x\"}").andExpect(status().isNotFound());
    }

    // -- 시험 풀

    @Test
    void 체크한_내_질문이_공용_질문과_같이_출제된다() throws Exception {
        UUID mine = create(alice, "내 질문", "DEEP");
        check(alice, "aa-01", true);
        check(alice, "my-" + mine, true);
        UUID session = UUID.randomUUID();
        String body = start(alice, session, "");
        JsonNode items = json.readTree(body).at("/data/items");
        assertThat(items).hasSize(2);
        assertThat(slugs(body)).containsExactlyInAnyOrder("aa-01", "my-" + mine);
        // 내 질문의 제목·난이도·가짜 주제가 붙고, 내가 적은 답은 싣지 않는다
        for (JsonNode i : items) {
            if (i.get("questionSlug").asText().equals("my-" + mine)) {
                assertThat(i.get("title").asText()).isEqualTo("내 질문");
                assertThat(i.get("tier").asText()).isEqualTo("DEEP");
                assertThat(i.get("topicSlug").asText()).isEqualTo("@mine");
                assertThat(i.get("topicName").asText()).isEqualTo("내 질문");
            }
        }
        assertThat(body).doesNotContain("내가 적은 답");
    }

    @Test
    void 체크하지_않은_내_질문은_미학습_포함일_때만_나온다() throws Exception {
        UUID mine = create(alice, "내 질문", "BASIC");
        check(alice, "aa-01", true);
        assertThat(slugs(start(alice, UUID.randomUUID(), ""))).containsExactly("aa-01");
        String all = bodyOf(putAs(alice, "/api/v1/quiz/" + UUID.randomUUID(), "{\"count\":30,\"includeUnlearned\":true,\"topics\":[\"@mine\"]}").andExpect(status().isOk()));
        assertThat(slugs(all)).containsExactly("my-" + mine);
    }

    @Test
    void 범위가_있으면_내_질문은_가짜_주제를_골랐을_때만_들어간다() throws Exception {
        UUID mine = create(alice, "내 질문", "BASIC");
        check(alice, "aa-01", true);
        check(alice, "my-" + mine, true);
        // 주제 t1 만: 내 질문 없음
        assertThat(slugs(start(alice, UUID.randomUUID(), ",\"topics\":[\"t1\"]"))).containsExactly("aa-01");
        // 카테고리만 골라도 내 질문은 안 들어간다(어느 카테고리에도 속하지 않는다)
        assertThat(slugs(start(alice, UUID.randomUUID(), ",\"categories\":[\"c1\"]"))).containsExactly("aa-01");
        // @mine 만: 내 질문만
        assertThat(slugs(start(alice, UUID.randomUUID(), ",\"topics\":[\"@mine\"]"))).containsExactly("my-" + mine);
        // t1 + @mine: 둘 다
        assertThat(slugs(start(alice, UUID.randomUUID(), ",\"topics\":[\"t1\",\"@mine\"]")))
                .containsExactlyInAnyOrder("aa-01", "my-" + mine);
    }

    @Test
    void 난이도_필터는_내_질문의_난이도에_적용된다() throws Exception {
        UUID basic = create(alice, "기본 질문", "BASIC");
        UUID tricky = create(alice, "함정 질문", "TRICKY");
        check(alice, "my-" + basic, true);
        check(alice, "my-" + tricky, true);
        assertThat(slugs(start(alice, UUID.randomUUID(), ",\"tiers\":[\"TRICKY\"]"))).containsExactly("my-" + tricky);
    }

    @Test
    void 가짜_주제는_주제_목록에서만_받고_카테고리에서는_400이다() throws Exception {
        putAs(alice, "/api/v1/quiz/" + UUID.randomUUID(), "{\"count\":5,\"includeUnlearned\":true,\"categories\":[\"@mine\"]}").andExpect(status().isBadRequest());
        putAs(alice, "/api/v1/quiz/" + UUID.randomUUID(), "{\"count\":5,\"includeUnlearned\":true,\"topics\":[\"@other\"]}").andExpect(status().isBadRequest());
        assertThat(count("quiz_session")).isZero();
    }

    @Test
    void 남의_내_질문은_내_풀에_들어오지_않는다() throws Exception {
        UUID theirs = create(bob, "남의 질문", "BASIC");
        check(bob, "my-" + theirs, true);
        putAs(alice, "/api/v1/quiz/" + UUID.randomUUID(), "{\"count\":10,\"includeUnlearned\":true,\"topics\":[\"@mine\"]}").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("QUIZ-400-01"));
    }

    // -- 후보·현황

    @Test
    void 내_질문을_틀리면_후보와_현황에_나오고_맞으면_후보에서_사라진다() throws Exception {
        UUID mine = create(alice, "내 질문", "BASIC");
        check(alice, "my-" + mine, true);
        UUID s1 = UUID.randomUUID();
        start(alice, s1, ",\"topics\":[\"@mine\"]");
        record(alice, s1, 1, "WRONG");
        getAs(alice, "/api/v1/review-candidates").andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].slug").value("my-" + mine))
                .andExpect(jsonPath("$.data[0].title").value("내 질문"))
                .andExpect(jsonPath("$.data[0].topicSlug").value("@mine"));
        getAs(alice, "/api/v1/mine/" + mine).andExpect(jsonPath("$.data.reviewCandidate").value(true));
        getAs(alice, "/api/v1/me/stats").andExpect(jsonPath("$.data.mostMissed[0].questionSlug").value("my-" + mine))
                .andExpect(jsonPath("$.data.mostMissed[0].topicName").value("내 질문"));
        UUID s2 = UUID.randomUUID();
        start(alice, s2, ",\"topics\":[\"@mine\"]");
        record(alice, s2, 1, "CORRECT");
        getAs(alice, "/api/v1/review-candidates").andExpect(jsonPath("$.data.length()").value(0));
        getAs(alice, "/api/v1/mine/" + mine).andExpect(jsonPath("$.data.reviewCandidate").value(false));
    }

    @Test
    void 틀렸어도_체크를_풀면_후보가_아니다() throws Exception {
        UUID mine = create(alice, "내 질문", "BASIC");
        check(alice, "my-" + mine, true);
        UUID s = UUID.randomUUID();
        start(alice, s, ",\"topics\":[\"@mine\"]");
        record(alice, s, 1, "WRONG");
        check(alice, "my-" + mine, false);
        getAs(alice, "/api/v1/review-candidates").andExpect(jsonPath("$.data.length()").value(0));
        getAs(alice, "/api/v1/mine/" + mine).andExpect(jsonPath("$.data.reviewCandidate").value(false));
    }

    // -- 삭제

    @Test
    void 지우면_체크와_통계가_사라지고_지난_시험은_안전하게_남는다() throws Exception {
        UUID mine = create(alice, "지울 질문", "BASIC");
        check(alice, "my-" + mine, true);
        UUID done = UUID.randomUUID();
        start(alice, done, ",\"topics\":[\"@mine\"]");
        record(alice, done, 1, "WRONG");
        UUID pending = UUID.randomUUID();
        start(alice, pending, ",\"topics\":[\"@mine\"]");
        assertThat(count("quiz_question_stats")).isOne();

        putAs(alice, "/api/v1/mine/" + mine + "/deleted", "{\"deleted\":true}").andExpect(status().isOk());

        assertThat(count("my_question")).isZero();
        assertThat(count("user_progress")).isZero();
        assertThat(count("quiz_question_stats")).isZero();
        assertThat(count("quiz_item")).isEqualTo(2);       // 지난 시험 문항은 남는다
        getAs(alice, "/api/v1/review-candidates").andExpect(jsonPath("$.data.length()").value(0));
        getAs(alice, "/api/v1/me/stats").andExpect(jsonPath("$.data.mostMissed.length()").value(0));
        // 지난 시험을 열어도 깨지지 않고, 지워진 질문은 제목 없이 나온다(건너뛰기만 가능)
        getAs(alice, "/api/v1/quiz/" + done).andExpect(status().isOk()).andExpect(jsonPath("$.data.items[0].questionSlug").value("my-" + mine))
                .andExpect(jsonPath("$.data.items[0].title").doesNotExist()).andExpect(jsonPath("$.data.items[0].result").value("WRONG"));
        getAs(alice, "/api/v1/quiz/" + pending).andExpect(status().isOk()).andExpect(jsonPath("$.data.items[0].title").doesNotExist());
        record(alice, pending, 1, "SKIPPED");
    }

    @Test
    void 남이_내_질문을_지울_수_없다() throws Exception {
        UUID mine = create(alice, "앨리스", "BASIC");
        check(alice, "my-" + mine, true);
        putAs(bob, "/api/v1/mine/" + mine + "/deleted", "{\"deleted\":true}").andExpect(status().isNotFound());
        assertThat(count("my_question")).isOne();
        assertThat(count("user_progress")).isOne();
    }

    // -- 탈퇴

    @Test
    void 탈퇴하면_내_질문_체크_시험_기록이_모두_사라지고_다른_사람은_그대로다() throws Exception {
        UUID a = create(alice, "앨리스", "BASIC");
        UUID b = create(bob, "밥", "BASIC");
        check(alice, "my-" + a, true);
        check(bob, "my-" + b, true);
        UUID sa = UUID.randomUUID();
        UUID sb = UUID.randomUUID();
        start(alice, sa, ",\"topics\":[\"@mine\"]");
        record(alice, sa, 1, "WRONG");
        start(bob, sb, ",\"topics\":[\"@mine\"]");
        record(bob, sb, 1, "WRONG");

        tx.executeWithoutResult(s -> events.publishEvent(new AccountDeleted(alice, Instant.now())));

        assertThat(jdbc.queryForObject("select count(*) from my_question where user_id = ?", Integer.class, alice)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from user_progress where user_id = ?", Integer.class, alice)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from quiz_session where user_id = ?", Integer.class, alice)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from quiz_question_stats where user_id = ?", Integer.class, alice)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from my_question where user_id = ?", Integer.class, bob)).isOne();
        assertThat(jdbc.queryForObject("select count(*) from quiz_question_stats where user_id = ?", Integer.class, bob)).isOne();
    }
}
