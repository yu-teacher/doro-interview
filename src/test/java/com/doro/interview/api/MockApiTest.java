package com.doro.interview.api;

import com.doro.interview.support.ContentFixture;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 모의면접 API(docs/M7-PLAN.md S4): 인증, 엄격한 입력, 멱등, 소유, 모범 답변 비노출, 다음 턴이 응답에 들어 있음.
 *
 * <pre>
 * c1/t1 공개: aa-01 →F aa-02, →P aa-03 · aa-02 · aa-03
 * c1/t2 비공개: bb-01
 * </pre>
 */
class MockApiTest extends AbstractProgressApiTest {

    private static final String START = "{\"mainCount\":3,\"maxDepth\":2,\"includeUnlearned\":false}";

    @BeforeEach
    void seedLinks() {
        jdbc.execute("TRUNCATE mock_turn, mock_session");
        fx = new ContentFixture(tmp.resolve("mock")).category("c1")
                .topic("c1", "t1", "aa", true).topic("c1", "t2", "bb", false)
                .questionWith("c1", "t1", "aa-01", "BASIC", "트랜잭션 질문", List.of("키1"), HEADER + "기본 답변.\n", "2026-10-20", List.of(),
                        List.of("links: [{to: \"aa-02\", kind: FOLLOWUP}, {to: \"aa-03\", kind: PREREQ}]"))
                .questionWith("c1", "t1", "aa-02", "DEEP", "꼬리 질문", List.of("키2"), HEADER + "심화 답변.\n", "2026-10-20", List.of(), List.of())
                .questionWith("c1", "t1", "aa-03", "BASIC", "기초 질문", List.of("키3"), HEADER + "기초 답변.\n", "2026-10-20", List.of(), List.of())
                .questionWith("c1", "t2", "bb-01", "BASIC", "비공개 질문", List.of("숨김"), HEADER + "초안.\n", null, List.of(), List.of());
        loader.load(fx.location());
    }

    private String url(UUID id) {
        return "/api/v1/mock/" + id;
    }

    private void check(UUID user, String... slugs) throws Exception {
        for (String slug : slugs) {
            putAs(user, "/api/v1/progress/" + slug, "{\"learned\":true}").andExpect(status().isOk());
        }
    }

    private int sessions() {
        return jdbc.queryForObject("select count(*) from mock_session", Integer.class);
    }

    @Test
    void 비로그인은_모든_모의면접_API가_401이고_본문보다_인증을_먼저_본다() throws Exception {
        UUID id = UUID.randomUUID();
        putAs(null, url(id), START).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("AUTH-401-01"));
        putAs(null, url(id), "{\"mainCount\":\"x\"}").andExpect(status().isUnauthorized());
        getAs(null, url(id)).andExpect(status().isUnauthorized());
        putAs(null, url(id) + "/turns/1", "{\"result\":\"CORRECT\"}").andExpect(status().isUnauthorized());
        putAs(null, url(id) + "/finish", "{}").andExpect(status().isUnauthorized());
        assertThat(sessions()).isZero();
    }

    @Test
    void 시작하면_첫_턴을_주고_모범_답변은_싣지_않는다() throws Exception {
        check(alice, "aa-01");
        UUID id = UUID.randomUUID();
        String body = bodyOf(putAs(alice, url(id), START).andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
                .andExpect(jsonPath("$.data.sessionId").value(id.toString()))
                .andExpect(jsonPath("$.data.mainCount").value(3))
                .andExpect(jsonPath("$.data.plannedMains").value(1))
                .andExpect(jsonPath("$.data.maxDepth").value(2))
                .andExpect(jsonPath("$.data.turns", hasSize(1)))
                .andExpect(jsonPath("$.data.turns[0].origin").value("MAIN"))
                .andExpect(jsonPath("$.data.turns[0].questionSlug").value("aa-01"))
                .andExpect(jsonPath("$.data.turns[0].title").value("트랜잭션 질문"))
                .andExpect(jsonPath("$.data.turns[0].topicName").exists())
                .andExpect(jsonPath("$.data.turns[0].result").isEmpty()));
        assertThat(body).doesNotContain("spokenAnswer", "기본 답변");
    }

    @Test
    void 결과를_보내면_응답에_다음_턴이_있고_같은_결과_재전송은_같은_응답이다() throws Exception {
        check(alice, "aa-01");
        UUID id = UUID.randomUUID();
        putAs(alice, url(id), START).andExpect(status().isOk());
        String first = bodyOf(putAs(alice, url(id) + "/turns/1", "{\"result\":\"CORRECT\",\"seconds\":42,\"answerText\":\"말한 내용\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.turns", hasSize(2)))
                .andExpect(jsonPath("$.data.turns[0].result").value("CORRECT"))
                .andExpect(jsonPath("$.data.turns[0].seconds").value(42))
                .andExpect(jsonPath("$.data.turns[1].origin").value("LINK"))
                .andExpect(jsonPath("$.data.turns[1].parentSeq").value(1))
                .andExpect(jsonPath("$.data.turns[1].depth").value(1))
                .andExpect(jsonPath("$.data.turns[1].questionSlug").value("aa-02")));
        String again = bodyOf(putAs(alice, url(id) + "/turns/1", "{\"result\":\"CORRECT\"}").andExpect(status().isOk()));
        assertThat(json.readTree(again).get("data")).isEqualTo(json.readTree(first).get("data"));
        putAs(alice, url(id) + "/turns/1", "{\"result\":\"WRONG\"}").andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("QUIZ-409-01"));
        // 마지막 턴까지 답하면 세션이 끝난다
        putAs(alice, url(id) + "/turns/2", "{\"result\":\"CORRECT\"}").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.finishedAt").isNotEmpty())
                .andExpect(jsonPath("$.data.turns", hasSize(2)));
    }

    @Test
    void 틀리면_기초_질문이_다음_턴이다() throws Exception {
        check(alice, "aa-01");
        UUID id = UUID.randomUUID();
        putAs(alice, url(id), START);
        putAs(alice, url(id) + "/turns/1", "{\"result\":\"WRONG\"}").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.turns[1].origin").value("PREREQ"))
                .andExpect(jsonPath("$.data.turns[1].questionSlug").value("aa-03"));
    }

    @Test
    void 남의_세션과_없는_세션은_같은_404() throws Exception {
        check(alice, "aa-01");
        UUID id = UUID.randomUUID();
        putAs(alice, url(id), START);
        String other = bodyOf(getAs(bob, url(id)).andExpect(status().isNotFound()));
        String none = bodyOf(getAs(bob, url(UUID.randomUUID())).andExpect(status().isNotFound()));
        assertThat(errorShape(other)).isEqualTo(errorShape(none));
        putAs(bob, url(id) + "/turns/1", "{\"result\":\"CORRECT\"}").andExpect(status().isNotFound());
        putAs(bob, url(id) + "/finish", "{}").andExpect(status().isNotFound());
        getAs(alice, "/api/v1/mock/not-a-uuid").andExpect(status().isNotFound());
        putAs(alice, url(id) + "/turns/0", "{\"result\":\"CORRECT\"}").andExpect(status().isNotFound());
        putAs(alice, url(id) + "/turns/x", "{\"result\":\"CORRECT\"}").andExpect(status().isNotFound());
    }

    @Test
    void 풀이_비면_400이고_세션을_만들지_않는다() throws Exception {
        check(alice, "aa-02"); // 꼬리질문이 없는 질문만 체크
        putAs(alice, url(UUID.randomUUID()), START).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("QUIZ-400-02"));
        assertThat(sessions()).isZero();
    }

    @Test
    void 알려지지_않은_필드와_틀린_형식은_400() throws Exception {
        check(alice, "aa-01");
        for (String bad : List.of(
                "{}",
                "{\"mainCount\":3,\"maxDepth\":2}",
                "{\"mainCount\":3,\"maxDepth\":2,\"includeUnlearned\":false,\"userId\":\"x\"}",
                "{\"mainCount\":\"3\",\"maxDepth\":2,\"includeUnlearned\":false}",
                "{\"mainCount\":0,\"maxDepth\":2,\"includeUnlearned\":false}",
                "{\"mainCount\":6,\"maxDepth\":2,\"includeUnlearned\":false}",
                "{\"mainCount\":3,\"maxDepth\":4,\"includeUnlearned\":false}",
                "{\"mainCount\":3,\"maxDepth\":2,\"includeUnlearned\":\"no\"}",
                "{\"mainCount\":3,\"maxDepth\":2,\"includeUnlearned\":false,\"topics\":[\"@mine\"]}",
                "{\"mainCount\":3,\"maxDepth\":2,\"includeUnlearned\":false,\"tiers\":[\"EASY\"]}")) {
            putAs(alice, url(UUID.randomUUID()), bad).andExpect(status().isBadRequest());
        }
        assertThat(sessions()).isZero();
        UUID id = UUID.randomUUID();
        putAs(alice, url(id), START).andExpect(status().isOk());
        for (String bad : List.of("{}", "{\"result\":\"MAYBE\"}", "{\"result\":\"CORRECT\",\"seconds\":\"1\"}",
                "{\"result\":\"CORRECT\",\"answerText\":1}", "{\"result\":\"CORRECT\",\"extra\":1}")) {
            putAs(alice, url(id) + "/turns/1", bad).andExpect(status().isBadRequest());
        }
        putAs(alice, url(id) + "/finish", "{\"x\":1}").andExpect(status().isBadRequest());
    }

    @Test
    void 범위를_좁히면_그_안에서만_뽑는다() throws Exception {
        UUID id = UUID.randomUUID();
        putAs(alice, url(id), "{\"mainCount\":3,\"maxDepth\":2,\"includeUnlearned\":true,\"topics\":[\"t1\"],\"tiers\":[\"BASIC\"]}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.plannedMains").value(1))
                .andExpect(jsonPath("$.data.turns[0].questionSlug").value("aa-01"));
        putAs(alice, url(UUID.randomUUID()), "{\"mainCount\":3,\"maxDepth\":2,\"includeUnlearned\":true,\"tiers\":[\"TRICKY\"]}")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("QUIZ-400-02"));
    }

    @Test
    void 끝내면_더_기록할_수_없다() throws Exception {
        check(alice, "aa-01");
        UUID id = UUID.randomUUID();
        putAs(alice, url(id), START);
        putAs(alice, url(id) + "/finish", "{}").andExpect(status().isOk()).andExpect(jsonPath("$.data.finishedAt").isNotEmpty());
        putAs(alice, url(id) + "/turns/1", "{\"result\":\"CORRECT\"}").andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("QUIZ-409-02"));
    }
}
