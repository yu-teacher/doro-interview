package com.doro.interview.api;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 시험 API(docs/M3-PLAN.md S4): 인증, 엄격한 입력 검증, 멱등, 소유, 모범 답변 비노출, 진도에 쓰지 않음. */
class QuizApiTest extends AbstractProgressApiTest {

    private static final String START = "{\"count\":10,\"includeUnlearned\":false}";

    private String url(UUID id) {
        return "/api/v1/quiz/" + id;
    }

    private void check(UUID user, String... slugs) throws Exception {
        for (String slug : slugs) {
            putAs(user, "/api/v1/progress/" + slug, "{\"learned\":true}").andExpect(status().isOk());
        }
    }

    private int sessions() {
        return jdbc.queryForObject("select count(*) from quiz_session", Integer.class);
    }

    // -- 인증

    @Test
    void 비로그인은_모든_시험_API가_401이고_아무것도_만들지_않는다() throws Exception {
        UUID id = UUID.randomUUID();
        putAs(null, url(id), START).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("AUTH-401-01"));
        getAs(null, url(id)).andExpect(status().isUnauthorized());
        putAs(null, url(id) + "/items/1", "{\"result\":\"CORRECT\"}").andExpect(status().isUnauthorized());
        putAs(null, url(id) + "/finish", "{}").andExpect(status().isUnauthorized());
        assertThat(sessions()).isZero();
    }

    @Test
    void 비로그인이면_본문이_엉망이어도_400이_아니라_401이다() throws Exception {
        putAs(null, url(UUID.randomUUID()), "{\"count\":\"x\"}").andExpect(status().isUnauthorized());
        putAs(null, "/api/v1/quiz/not-a-uuid", "{}").andExpect(status().isUnauthorized());
    }

    // -- 시작

    @Test
    void 시작하면_문항_목록을_주고_모범_답변은_싣지_않는다() throws Exception {
        check(alice, "aa-01", "aa-02", "aa-03");
        UUID id = UUID.randomUUID();
        String body = bodyOf(putAs(alice, url(id), START).andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
                .andExpect(header().doesNotExist(HttpHeaders.ETAG))
                .andExpect(jsonPath("$.data.sessionId").value(id.toString()))
                .andExpect(jsonPath("$.data.plannedCount").value(3))
                .andExpect(jsonPath("$.data.items", hasSize(3)))
                .andExpect(jsonPath("$.data.items[0].seq").value(1))
                .andExpect(jsonPath("$.data.items[0].title").exists())
                .andExpect(jsonPath("$.data.items[0].tier").exists())
                .andExpect(jsonPath("$.data.items[0].topicName").exists())
                .andExpect(jsonPath("$.data.items[0].result").isEmpty()));
        // 문제 화면에서 정답이 미리 보이면 시험이 아니다
        assertThat(body).doesNotContain("spokenAnswer", "detailMd", "기본 답변", "심화 답변", "함정 답변");
    }

    @Test
    void 같은_id로_다시_시작하면_같은_세션이다() throws Exception {
        check(alice, "aa-01", "aa-02", "aa-03");
        UUID id = UUID.randomUUID();
        String first = bodyOf(putAs(alice, url(id), START));
        String second = bodyOf(putAs(alice, url(id), "{\"count\":2,\"includeUnlearned\":true}"));
        assertThat(json.readTree(second).get("data")).isEqualTo(json.readTree(first).get("data"));
        assertThat(sessions()).isEqualTo(1);
        assertThat(json.readTree(bodyOf(getAs(alice, url(id)))).get("data")).isEqualTo(json.readTree(first).get("data"));
    }

    @Test
    void 풀이_비면_400이고_세션을_만들지_않는다() throws Exception {
        putAs(alice, url(UUID.randomUUID()), START).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("QUIZ-400-01"));
        assertThat(sessions()).isZero();
    }

    @Test
    void 미학습_포함이면_체크하지_않아도_시작한다_비공개_질문은_없다() throws Exception {
        UUID id = UUID.randomUUID();
        String body = bodyOf(putAs(alice, url(id), "{\"count\":30,\"includeUnlearned\":true}").andExpect(status().isOk()));
        assertThat(json.readTree(body).at("/data/items").size()).isEqualTo(3); // aa-01..03, bb-01(비공개) 제외
        assertThat(body).doesNotContain("bb-01");
    }

    @Test
    void 범위와_모드를_받는다() throws Exception {
        check(alice, "aa-01", "aa-02", "aa-03");
        String body = bodyOf(putAs(alice, url(UUID.randomUUID()),
                "{\"count\":10,\"includeUnlearned\":false,\"tiers\":[\"BASIC\",\"DEEP\"],\"topics\":[\"t1\"],\"categories\":[\"c1\"],\"mode\":\"RANDOM\"}")
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.mode").value("RANDOM")));
        assertThat(json.readTree(body).at("/data/items").size()).isEqualTo(2);
        assertThat(body).doesNotContain("aa-03");
    }

    @Test
    void 잘못된_시작_본문은_400이고_세션이_없다() throws Exception {
        check(alice, "aa-01");
        String[] bad = {
                "{}", "{\"count\":5}", "{\"includeUnlearned\":false}", "{\"count\":\"5\",\"includeUnlearned\":false}", "{\"count\":5.5,\"includeUnlearned\":false}",
                "{\"count\":0,\"includeUnlearned\":false}", "{\"count\":31,\"includeUnlearned\":false}", "{\"count\":-1,\"includeUnlearned\":false}",
                "{\"count\":5,\"includeUnlearned\":\"false\"}", "{\"count\":5,\"includeUnlearned\":null}",
                "{\"count\":5,\"includeUnlearned\":false,\"userId\":\"" + bob + "\"}", "{\"count\":5,\"includeUnlearned\":false,\"extra\":1}",
                "{\"count\":5,\"includeUnlearned\":false,\"tiers\":[\"EASY\"]}", "{\"count\":5,\"includeUnlearned\":false,\"tiers\":\"BASIC\"}",
                "{\"count\":5,\"includeUnlearned\":false,\"topics\":[1]}", "{\"count\":5,\"includeUnlearned\":false,\"topics\":[\"Bad_Slug\"]}",
                "{\"count\":5,\"includeUnlearned\":false,\"mode\":\"FAST\"}", "{\"count\":5,\"includeUnlearned\":false,\"mode\":1}",
                "[1]", "{not json",
        };
        for (String b : bad) {
            putAs(alice, url(UUID.randomUUID()), b).andExpect(status().isBadRequest());
        }
        assertThat(sessions()).isZero();
    }

    @Test
    void 범위_항목이_너무_많으면_400이다() throws Exception {
        check(alice, "aa-01");
        StringBuilder topics = new StringBuilder("[");
        for (int i = 0; i < 21; i++) {
            topics.append(i > 0 ? "," : "").append("\"t").append(i).append("\"");
        }
        putAs(alice, url(UUID.randomUUID()), "{\"count\":5,\"includeUnlearned\":false,\"topics\":" + topics + "]}").andExpect(status().isBadRequest());
    }

    // -- 소유·형식

    @Test
    void 남의_세션은_없는_것과_같은_404다() throws Exception {
        check(alice, "aa-01");
        UUID id = UUID.randomUUID();
        putAs(alice, url(id), START).andExpect(status().isOk());
        getAs(bob, url(id)).andExpect(status().isNotFound());
        putAs(bob, url(id), START).andExpect(status().isNotFound());
        putAs(bob, url(id) + "/items/1", "{\"result\":\"CORRECT\"}").andExpect(status().isNotFound());
        putAs(bob, url(id) + "/finish", "{}").andExpect(status().isNotFound());
        var expected = errorShape(bodyOf(getAs(alice, url(UUID.randomUUID())).andExpect(status().isNotFound())));
        assertThat(errorShape(bodyOf(getAs(bob, url(id))))).isEqualTo(expected); // 없는 세션과 응답이 같다
    }

    @Test
    void 형식이_틀린_세션_id와_순번은_404다() throws Exception {
        check(alice, "aa-01");
        getAs(alice, "/api/v1/quiz/not-a-uuid").andExpect(status().isNotFound());
        UUID id = UUID.randomUUID();
        putAs(alice, url(id), START).andExpect(status().isOk());
        for (String seq : new String[]{"0", "-1", "abc", "99", "1.5"}) {
            putAs(alice, url(id) + "/items/" + seq, "{\"result\":\"CORRECT\"}").andExpect(status().isNotFound());
        }
    }

    // -- 결과 기록

    @Test
    void 결과를_기록하면_세션_전체를_돌려주고_같은_결과는_멱등이다() throws Exception {
        check(alice, "aa-01", "aa-02");
        UUID id = UUID.randomUUID();
        putAs(alice, url(id), START).andExpect(status().isOk());
        for (int i = 0; i < 2; i++) {
            putAs(alice, url(id) + "/items/1", "{\"result\":\"WRONG\",\"seconds\":42,\"answerText\":\"내 답\"}").andExpect(status().isOk())
                    .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
                    .andExpect(jsonPath("$.data.items[0].result").value("WRONG"))
                    .andExpect(jsonPath("$.data.items[0].seconds").value(42))
                    .andExpect(jsonPath("$.data.items[0].answerText").value("내 답"))
                    .andExpect(jsonPath("$.data.items[1].result").isEmpty());
        }
        assertThat(jdbc.queryForObject("select ask_count from quiz_question_stats where user_id = ?", Integer.class, alice)).isEqualTo(1);
    }

    @Test
    void 다른_결과는_409이고_통계는_그대로다() throws Exception {
        check(alice, "aa-01");
        UUID id = UUID.randomUUID();
        putAs(alice, url(id), START);
        putAs(alice, url(id) + "/items/1", "{\"result\":\"WRONG\"}").andExpect(status().isOk());
        putAs(alice, url(id) + "/items/1", "{\"result\":\"CORRECT\"}").andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("QUIZ-409-01"));
        assertThat(jdbc.queryForObject("select miss_count from quiz_question_stats where user_id = ?", Integer.class, alice)).isEqualTo(1);
    }

    @Test
    void 잘못된_결과_본문은_400이다() throws Exception {
        check(alice, "aa-01");
        UUID id = UUID.randomUUID();
        putAs(alice, url(id), START);
        String[] bad = {
                "{}", "{\"result\":\"MAYBE\"}", "{\"result\":1}", "{\"result\":null}", "{\"result\":\"CORRECT\",\"seconds\":-1}",
                "{\"result\":\"CORRECT\",\"seconds\":\"5\"}", "{\"result\":\"CORRECT\",\"seconds\":1.5}", "{\"result\":\"CORRECT\",\"answerText\":5}",
                "{\"result\":\"CORRECT\",\"answerText\":\"" + "가".repeat(2001) + "\"}", "{\"result\":\"CORRECT\",\"answerText\":\"a\\u0000b\"}",
                "{\"result\":\"CORRECT\",\"userId\":\"" + alice + "\"}", "{\"result\":\"CORRECT\",\"extra\":true}", "[\"CORRECT\"]",
        };
        for (String b : bad) {
            putAs(alice, url(id) + "/items/1", b).andExpect(status().isBadRequest());
        }
        assertThat(jdbc.queryForObject("select count(*) from quiz_question_stats", Integer.class)).isZero();
        getAs(alice, url(id)).andExpect(jsonPath("$.data.items[0].result").isEmpty());
    }

    @Test
    void 건너뛰기는_통계에_영향이_없다() throws Exception {
        check(alice, "aa-01");
        UUID id = UUID.randomUUID();
        putAs(alice, url(id), START);
        putAs(alice, url(id) + "/items/1", "{\"result\":\"SKIPPED\"}").andExpect(status().isOk());
        assertThat(jdbc.queryForObject("select count(*) from quiz_question_stats", Integer.class)).isZero();
    }

    // -- 끝내기

    @Test
    void 끝내면_finishedAt이_생기고_이후_기록은_409다() throws Exception {
        check(alice, "aa-01", "aa-02");
        UUID id = UUID.randomUUID();
        putAs(alice, url(id), START);
        putAs(alice, url(id) + "/items/1", "{\"result\":\"CORRECT\"}");
        putAs(alice, url(id) + "/finish", "{}").andExpect(status().isOk()).andExpect(jsonPath("$.data.finishedAt").isNotEmpty());
        putAs(alice, url(id) + "/finish", "{}").andExpect(status().isOk());
        putAs(alice, url(id) + "/items/2", "{\"result\":\"CORRECT\"}").andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("QUIZ-409-02"));
    }

    @Test
    void 끝내기에_본문이_없어도_되고_엉뚱한_본문은_400이다() throws Exception {
        check(alice, "aa-01");
        UUID id = UUID.randomUUID();
        putAs(alice, url(id), START);
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(url(id) + "/finish")
                .header(HttpHeaders.AUTHORIZATION, as(alice))).andExpect(status().isOk());
        UUID other = UUID.randomUUID();
        putAs(alice, url(other), START);
        putAs(alice, url(other) + "/finish", "{\"userId\":\"x\"}").andExpect(status().isBadRequest());
    }

    // -- 진도와의 관계

    @Test
    void 틀려도_진도_요약은_그대로다() throws Exception {
        check(alice, "aa-01", "aa-02");
        UUID id = UUID.randomUUID();
        putAs(alice, url(id), START);
        putAs(alice, url(id) + "/items/1", "{\"result\":\"WRONG\"}");
        putAs(alice, url(id) + "/items/2", "{\"result\":\"WRONG\"}");
        getAs(alice, "/api/v1/progress/summary").andExpect(jsonPath("$.data.learned").value(2));
    }

    @Test
    void 시험을_보는_동안_질문이_닫히면_제목_없이_slug만_나가고_진행은_된다() throws Exception {
        check(alice, "aa-01", "aa-03");
        UUID id = UUID.randomUUID();
        putAs(alice, url(id), START);
        fx.delete("c1", "t1", "aa-03");
        loader.load(fx.location());
        String body = bodyOf(getAs(alice, url(id)).andExpect(status().isOk()));
        var items = json.readTree(body).at("/data/items");
        assertThat(items.size()).isEqualTo(2);
        boolean sawClosed = false;
        for (var item : items) {
            if (item.get("questionSlug").asText().equals("aa-03")) {
                sawClosed = true;
                assertThat(item.get("title").isNull()).isTrue();
            }
        }
        assertThat(sawClosed).isTrue();
        putAs(alice, url(id) + "/items/" + items.get(0).get("seq").asInt(), "{\"result\":\"CORRECT\"}").andExpect(status().isOk());
    }
}
