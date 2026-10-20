package com.doro.interview.api;

import com.doro.interview.quiz.ai.AiProperties;
import com.doro.interview.quiz.ai.FeedbackProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** AI 피드백 API(docs/M6-PLAN.md S2): 멱등·한도·실패 우회·소유·엄격한 입력. 공급자는 시험용 가짜다. */
@Import(FeedbackApiTest.Config.class)
class FeedbackApiTest extends AbstractProgressApiTest {

    @TestConfiguration
    static class Config {
        @Bean
        @Primary
        ScriptedFeedbackProvider scriptedProvider() {
            return new ScriptedFeedbackProvider();
        }
    }

    @Autowired
    ScriptedFeedbackProvider provider;
    @Autowired
    AiProperties props;

    @BeforeEach
    void reset() {
        provider.reset();
        props.setPerUserPerDay(20);
        props.setGlobalPerDay(200);
    }

    private static String body(String answer) {
        return "{\"answerText\":" + quote(answer) + "}";
    }

    private static String quote(String s) {
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n") + "\"";
    }

    private UUID startQuiz(UUID user, String scope) throws Exception {
        UUID id = UUID.randomUUID();
        putAs(user, "/api/v1/quiz/" + id, "{\"count\":10,\"includeUnlearned\":true" + scope + "}").andExpect(status().isOk());
        return id;
    }

    private String feedbackUrl(UUID session, int seq) {
        return "/api/v1/quiz/" + session + "/items/" + seq + "/feedback";
    }

    private int stored() {
        return jdbc.queryForObject("select count(*) from quiz_feedback", Integer.class);
    }

    // -- 상태·인증

    @Test
    void 상태는_켜짐과_남은_횟수를_알려_준다() throws Exception {
        getAs(alice, "/api/v1/me/ai").andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.data.enabled").value(true)).andExpect(jsonPath("$.data.perUserPerDay").value(20)).andExpect(jsonPath("$.data.remainingToday").value(20));
        provider.available = false;
        getAs(alice, "/api/v1/me/ai").andExpect(jsonPath("$.data.enabled").value(false)).andExpect(jsonPath("$.data.remainingToday").value(0));
        getAs(null, "/api/v1/me/ai").andExpect(status().isUnauthorized());
    }

    @Test
    void 비로그인은_401이고_공급자를_부르지_않는다() throws Exception {
        putAs(null, feedbackUrl(UUID.randomUUID(), 1), body("답")).andExpect(status().isUnauthorized());
        assertThat(provider.calls.get()).isZero();
    }

    // -- 만들기·멱등

    @Test
    void 피드백을_만들어_저장하고_공급자에는_질문_모범_답변_내_답이_간다() throws Exception {
        UUID s = startQuiz(alice, ",\"topics\":[\"t1\"]");
        putAs(alice, feedbackUrl(s, 1), body("내 답입니다")).andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.data.feedback").value("피드백: 내 답입니다"))
                .andExpect(jsonPath("$.data.cached").value(false))
                .andExpect(jsonPath("$.data.remainingToday").value(19));
        assertThat(stored()).isOne();
        assertThat(jdbc.queryForObject("select model from quiz_feedback", String.class)).isEqualTo("scripted-model");
        var sent = provider.requests.get(0);
        assertThat(sent.answer()).isEqualTo("내 답입니다");
        assertThat(sent.reference()).contains("답변."); // 공용 질문의 모범 답변
        assertThat(sent.title()).isNotBlank();
    }

    @Test
    void 같은_문항에_다시_보내면_저장본을_돌려주고_공급자를_다시_부르지_않는다() throws Exception {
        UUID s = startQuiz(alice, ",\"topics\":[\"t1\"]");
        putAs(alice, feedbackUrl(s, 1), body("처음 답")).andExpect(status().isOk());
        putAs(alice, feedbackUrl(s, 1), body("다른 답으로 다시")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.feedback").value("피드백: 처음 답")).andExpect(jsonPath("$.data.cached").value(true));
        assertThat(provider.calls.get()).isOne();
        assertThat(stored()).isOne();
    }

    @Test
    void 지난_시험을_열면_문항에_피드백이_붙는다() throws Exception {
        UUID s = startQuiz(alice, ",\"topics\":[\"t1\"]");
        putAs(alice, feedbackUrl(s, 2), body("답")).andExpect(status().isOk());
        JsonNode items = json.readTree(bodyOf(getAs(alice, "/api/v1/quiz/" + s).andExpect(status().isOk()))).at("/data/items");
        for (JsonNode i : items) {
            if (i.get("seq").asInt() == 2) {
                assertThat(i.get("feedback").asText()).isEqualTo("피드백: 답");
            } else {
                assertThat(i.has("feedback")).isFalse(); // 없는 문항은 키 자체가 없다
            }
        }
    }

    // -- 입력

    @Test
    void 본문은_answerText_하나뿐이고_1에서_2000자다() throws Exception {
        UUID s = startQuiz(alice, ",\"topics\":[\"t1\"]");
        for (String bad : new String[]{"{}", "{\"answerText\":1}", "{\"answerText\":null}", "{\"answerText\":\"a\",\"x\":1}", "[]", body(""), body("   \n "), body("가".repeat(2001)), "{\"answerText\":\"a\\u0000b\"}"}) {
            putAs(alice, feedbackUrl(s, 1), bad).andExpect(status().isBadRequest());
        }
        assertThat(provider.calls.get()).isZero();
        putAs(alice, feedbackUrl(s, 1), body("가".repeat(2000))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.feedback").value(org.hamcrest.Matchers.hasLength(1500))); // 저장·응답 상한
    }

    // -- 소유

    @Test
    void 남의_세션_없는_문항_형식이_틀린_경로는_404다() throws Exception {
        UUID s = startQuiz(alice, ",\"topics\":[\"t1\"]");
        putAs(bob, feedbackUrl(s, 1), body("답")).andExpect(status().isNotFound());
        putAs(alice, feedbackUrl(s, 99), body("답")).andExpect(status().isNotFound());
        putAs(alice, feedbackUrl(UUID.randomUUID(), 1), body("답")).andExpect(status().isNotFound());
        putAs(alice, "/api/v1/quiz/not-a-uuid/items/1/feedback", body("답")).andExpect(status().isNotFound());
        putAs(alice, "/api/v1/quiz/" + s + "/items/0/feedback", body("답")).andExpect(status().isNotFound());
        assertThat(provider.calls.get()).isZero();
        assertThat(stored()).isZero();
    }

    @Test
    void 닫힌_질문은_404다() throws Exception {
        UUID s = startQuiz(alice, ",\"tiers\":[\"DEEP\"]"); // aa-01 하나뿐인 시험
        fx.delete("c1", "t1", "aa-01");
        loader.load(fx.location());
        putAs(alice, feedbackUrl(s, 1), body("답")).andExpect(status().isNotFound());
        assertThat(provider.calls.get()).isZero();
    }

    // -- 꺼짐·실패

    @Test
    void 꺼져_있으면_503이고_공급자를_부르지_않으며_이미_받은_피드백은_돌려준다() throws Exception {
        UUID s = startQuiz(alice, ",\"topics\":[\"t1\"]");
        putAs(alice, feedbackUrl(s, 1), body("답")).andExpect(status().isOk());
        provider.available = false;
        putAs(alice, feedbackUrl(s, 2), body("답")).andExpect(status().isServiceUnavailable()).andExpect(jsonPath("$.code").value("AI-503-01"));
        putAs(alice, feedbackUrl(s, 1), body("답")).andExpect(status().isOk()).andExpect(jsonPath("$.data.cached").value(true));
        assertThat(provider.calls.get()).isOne();
    }

    @Test
    void 공급자가_실패하면_503이고_저장도_한도_소모도_없고_다시_시도할_수_있다() throws Exception {
        UUID s = startQuiz(alice, ",\"topics\":[\"t1\"]");
        provider.fail = true;
        String text = bodyOf(putAs(alice, feedbackUrl(s, 1), body("답")).andExpect(status().isServiceUnavailable()).andExpect(jsonPath("$.code").value("AI-503-01")));
        assertThat(text).doesNotContain("secret-detail"); // 공급자의 오류 내용은 응답에 없다
        assertThat(stored()).isZero();
        getAs(alice, "/api/v1/me/ai").andExpect(jsonPath("$.data.remainingToday").value(20));
        provider.fail = false;
        putAs(alice, feedbackUrl(s, 1), body("답")).andExpect(status().isOk());
        assertThat(stored()).isOne();
    }

    @Test
    void 피드백이_실패해도_시험은_계속된다() throws Exception {
        UUID s = startQuiz(alice, ",\"topics\":[\"t1\"]");
        provider.fail = true;
        putAs(alice, feedbackUrl(s, 1), body("답")).andExpect(status().isServiceUnavailable());
        putAs(alice, "/api/v1/quiz/" + s + "/items/1", "{\"result\":\"WRONG\",\"seconds\":3}").andExpect(status().isOk());
        getAs(alice, "/api/v1/quiz/" + s).andExpect(status().isOk());
    }

    // -- 한도

    @Test
    void 사용자_한도를_넘으면_429이고_저장본은_계속_돌려준다_다른_사용자는_영향이_없다() throws Exception {
        props.setPerUserPerDay(2);
        UUID s = startQuiz(alice, ",\"topics\":[\"t1\"]");
        putAs(alice, feedbackUrl(s, 1), body("1")).andExpect(status().isOk());
        putAs(alice, feedbackUrl(s, 2), body("2")).andExpect(status().isOk()).andExpect(jsonPath("$.data.remainingToday").value(0));
        putAs(alice, feedbackUrl(s, 3), body("3")).andExpect(status().isTooManyRequests()).andExpect(jsonPath("$.code").value("AI-429-01"));
        assertThat(provider.calls.get()).isEqualTo(2);
        putAs(alice, feedbackUrl(s, 1), body("1")).andExpect(status().isOk()).andExpect(jsonPath("$.data.cached").value(true));
        UUID b = startQuiz(bob, ",\"topics\":[\"t1\"]");
        putAs(bob, feedbackUrl(b, 1), body("밥")).andExpect(status().isOk());
        getAs(alice, "/api/v1/me/ai").andExpect(jsonPath("$.data.remainingToday").value(0));
    }

    @Test
    void 전체_한도를_넘으면_다른_사용자도_429다() throws Exception {
        props.setGlobalPerDay(2);
        UUID a = startQuiz(alice, ",\"topics\":[\"t1\"]");
        putAs(alice, feedbackUrl(a, 1), body("1")).andExpect(status().isOk());
        putAs(alice, feedbackUrl(a, 2), body("2")).andExpect(status().isOk());
        UUID b = startQuiz(bob, ",\"topics\":[\"t1\"]");
        putAs(bob, feedbackUrl(b, 1), body("밥")).andExpect(status().isTooManyRequests());
        assertThat(provider.calls.get()).isEqualTo(2);
    }

    @Test
    void 이틀_전_기록은_한도에_세지_않는다() throws Exception {
        props.setPerUserPerDay(1);
        UUID s = startQuiz(alice, ",\"topics\":[\"t1\"]");
        putAs(alice, feedbackUrl(s, 1), body("1")).andExpect(status().isOk());
        putAs(alice, feedbackUrl(s, 2), body("2")).andExpect(status().isTooManyRequests());
        jdbc.update("update quiz_feedback set created_at = now() - interval '25 hours'");
        putAs(alice, feedbackUrl(s, 2), body("2")).andExpect(status().isOk());
    }

    @Test
    void 동시에_눌러도_한도를_넘지_않는다() throws Exception {
        props.setPerUserPerDay(5);
        List<UUID> sessions = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            sessions.add(startQuiz(alice, ",\"topics\":[\"t1\"]"));
        }
        provider.delayMs = 30;
        ExecutorService pool = Executors.newFixedThreadPool(12);
        CountDownLatch go = new CountDownLatch(1);
        List<Future<Integer>> results = new ArrayList<>();
        for (UUID s : sessions) {
            for (int seq = 1; seq <= 3; seq++) {
                int n = seq;
                results.add(pool.submit(() -> {
                    go.await();
                    return putAs(alice, feedbackUrl(s, n), body("동시")).andReturn().getResponse().getStatus();
                }));
            }
        }
        go.countDown();
        int ok = 0;
        int limited = 0;
        for (Future<Integer> f : results) {
            int code = f.get();
            if (code == 200) {
                ok++;
            } else if (code == 429) {
                limited++;
            }
        }
        pool.shutdown();
        assertThat(ok).isEqualTo(5);
        assertThat(limited).isEqualTo(7);
        assertThat(provider.calls.get()).isEqualTo(5);
        assertThat(stored()).isEqualTo(5);
    }

    // -- 내 질문

    @Test
    void 내_질문은_내가_적은_답과_비교하고_답이_없으면_막는다() throws Exception {
        UUID withAnswer = UUID.randomUUID();
        UUID noAnswer = UUID.randomUUID();
        putAs(alice, "/api/v1/mine/" + withAnswer, "{\"title\":\"내 질문 A\",\"answerText\":\"내가 정리한 모범 답\"}").andExpect(status().isOk());
        putAs(alice, "/api/v1/mine/" + noAnswer, "{\"title\":\"내 질문 B\"}").andExpect(status().isOk());
        UUID s = startQuiz(alice, ",\"topics\":[\"@mine\"]");
        JsonNode items = json.readTree(bodyOf(getAs(alice, "/api/v1/quiz/" + s))).at("/data/items");
        for (JsonNode i : items) {
            int seq = i.get("seq").asInt();
            if (i.get("questionSlug").asText().equals("my-" + withAnswer)) {
                putAs(alice, feedbackUrl(s, seq), body("내 대답")).andExpect(status().isOk());
                var sent = provider.requests.get(provider.requests.size() - 1);
                assertThat(sent.title()).isEqualTo("내 질문 A");
                assertThat(sent.reference()).isEqualTo("내가 정리한 모범 답");
            } else {
                putAs(alice, feedbackUrl(s, seq), body("내 대답")).andExpect(status().isBadRequest());
            }
        }
        assertThat(provider.calls.get()).isOne();
    }

    // -- 탈퇴

    @Autowired
    org.springframework.context.ApplicationEventPublisher events;
    @Autowired
    org.springframework.transaction.support.TransactionTemplate tx;

    @Test
    void 탈퇴_정리가_그_사용자의_피드백만_지운다() throws Exception {
        UUID a = startQuiz(alice, ",\"topics\":[\"t1\"]");
        UUID b = startQuiz(bob, ",\"topics\":[\"t1\"]");
        putAs(alice, feedbackUrl(a, 1), body("앨리스")).andExpect(status().isOk());
        putAs(bob, feedbackUrl(b, 1), body("밥")).andExpect(status().isOk());
        tx.executeWithoutResult(t -> events.publishEvent(new com.doro.interview.account.AccountDeleted(alice, java.time.Instant.now())));
        assertThat(jdbc.queryForObject("select count(*) from quiz_feedback where user_id = ?", Integer.class, alice)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from quiz_feedback where user_id = ?", Integer.class, bob)).isOne();
    }
}
