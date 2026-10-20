package com.doro.interview.api;

import com.doro.interview.account.AbstractAuthTest;
import com.doro.interview.catalog.content.ContentLoader;
import com.doro.interview.support.ContentFixture;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

/**
 * 로그인 사용자가 쓰는 API 시험의 공통 기반(가짜 Doro 토큰 + 임시 content/).
 *
 * <pre>
 * 개념: proxy
 * c1/t1 공개 : aa-01 DEEP · aa-02 BASIC(개념 proxy, "전파") · aa-03 TRICKY   (전부 REVIEWED)
 * c1/t2 비공개: bb-01 BASIC (DRAFT)
 * </pre>
 */
abstract class AbstractProgressApiTest extends AbstractAuthTest {

    static final String HEADER = "**모범 답변 (30~60초)**\n";

    @Autowired
    ContentLoader loader;
    @Autowired
    ObjectMapper json;

    @TempDir
    Path tmp;
    ContentFixture fx;

    final UUID alice = UUID.randomUUID();
    final UUID bob = UUID.randomUUID();

    @BeforeEach
    void seedContent() {
        jdbc.execute("TRUNCATE quiz_feedback, my_question, quiz_item, quiz_session, quiz_question_stats, user_pref, user_progress, my_note, question_link, question_concept, question, concept, topic, category CASCADE");
        fx = new ContentFixture(tmp).category("c1").concepts("proxy=프록시")
                .topic("c1", "t1", "aa", true).topic("c1", "t2", "bb", false)
                .questionWith("c1", "t1", "aa-01", "DEEP", "심화 질문", List.of("심화키워드"), HEADER + "심화 답변.\n", "2026-10-20", List.of(), List.of())
                .questionWith("c1", "t1", "aa-02", "BASIC", "트랜잭션 전파 질문", List.of("전파키워드"), HEADER + "기본 답변.\n", "2026-10-20",
                        List.of(), List.of("concepts: [\"proxy\"]"))
                .questionWith("c1", "t1", "aa-03", "TRICKY", "함정 질문", List.of("함정키워드"), HEADER + "함정 답변.\n", "2026-10-20", List.of(), List.of())
                .questionWith("c1", "t2", "bb-01", "BASIC", "비공개 주제의 질문", List.of("숨김키워드"), HEADER + "초안 답변.\n", null, List.of(), List.of());
        loader.load(fx.location());
    }

    static String bearer(String token) {
        return "Bearer " + token;
    }

    String as(UUID user) {
        return bearer(DORO.token(user));
    }

    ResultActions getAs(UUID user, String url, Object... uriVars) throws Exception {
        MockHttpServletRequestBuilder r = get(url, uriVars);
        if (user != null) {
            r.header(HttpHeaders.AUTHORIZATION, as(user));
        }
        return mvc.perform(r);
    }

    ResultActions putAs(UUID user, String url, String body) throws Exception {
        MockHttpServletRequestBuilder r = put(url).contentType(MediaType.APPLICATION_JSON).content(body);
        if (user != null) {
            r.header(HttpHeaders.AUTHORIZATION, as(user));
        }
        return mvc.perform(r);
    }

    String bodyOf(ResultActions r) throws Exception {
        return r.andReturn().getResponse().getContentAsString();
    }

    /** 오류 본문에서 요청마다 달라지는 timestamp 를 뺀 것(같은 오류인지 비교용). */
    JsonNode errorShape(String body) {
        JsonNode node = json.readTree(body);
        ((ObjectNode) node).remove("timestamp");
        return node;
    }

    /** 응답 트리에서 사용자 상태 키(learned, reviewCandidate)를 모두 지운다. */
    JsonNode withoutLearned(JsonNode node) {
        if (node.isObject()) {
            ((ObjectNode) node).remove("learned");
            ((ObjectNode) node).remove("reviewCandidate");
            node.forEach(this::withoutLearned);
        } else if (node.isArray()) {
            node.forEach(this::withoutLearned);
        }
        return node;
    }
}
