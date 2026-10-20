package com.doro.interview.api;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 내 질문 API(docs/M4-PLAN.md S2). */
class MineApiTest extends AbstractProgressApiTest {

    private static String url(UUID id) {
        return "/api/v1/mine/" + id;
    }

    private static String quote(String s) {
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n") + "\"";
    }

    private static String body(String title) {
        return "{\"title\":" + quote(title) + "}";
    }

    private int rows() {
        return jdbc.queryForObject("select count(*) from my_question", Integer.class);
    }

    // -- 인증

    @Test
    void 비로그인은_모든_내_질문_엔드포인트가_401이다() throws Exception {
        UUID id = UUID.randomUUID();
        getAs(null, "/api/v1/mine").andExpect(status().isUnauthorized());
        getAs(null, url(id)).andExpect(status().isUnauthorized());
        putAs(null, url(id), body("x")).andExpect(status().isUnauthorized());
        putAs(null, "/api/v1/mine", "{\"items\":[]}").andExpect(status().isUnauthorized());
        putAs(null, url(id) + "/deleted", "{\"deleted\":true}").andExpect(status().isUnauthorized());
        assertThat(rows()).isZero();
    }

    // -- 만들기·읽기

    @Test
    void 만들면_모든_필드와_slug_가_돌아오고_no_store_다() throws Exception {
        UUID id = UUID.randomUUID();
        putAs(alice, url(id), "{\"title\":\"강사님이 짚은 질문\",\"answerText\":\"내 답\",\"keywords\":[\"a\",\"b\"],\"tier\":\"DEEP\",\"sourceLabel\":\"강사 추천\"}")
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
                .andExpect(jsonPath("$.data.id").value(id.toString()))
                .andExpect(jsonPath("$.data.slug").value("my-" + id))
                .andExpect(jsonPath("$.data.title").value("강사님이 짚은 질문"))
                .andExpect(jsonPath("$.data.answerText").value("내 답"))
                .andExpect(jsonPath("$.data.keywords[1]").value("b"))
                .andExpect(jsonPath("$.data.tier").value("DEEP"))
                .andExpect(jsonPath("$.data.sourceLabel").value("강사 추천"))
                .andExpect(jsonPath("$.data.learned").value(false));
        getAs(alice, url(id)).andExpect(status().isOk()).andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"));
    }

    @Test
    void 제목만_보내면_기본값이_채워진다() throws Exception {
        UUID id = UUID.randomUUID();
        putAs(alice, url(id), body("제목만"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tier").value("BASIC"))
                .andExpect(jsonPath("$.data.answerText").value(""))
                .andExpect(jsonPath("$.data.sourceLabel").doesNotExist())
                .andExpect(jsonPath("$.data.keywords").isEmpty());
    }

    @Test
    void 같은_요청을_다시_보내도_한_개이고_목록에는_체크_여부가_붙는다() throws Exception {
        UUID id = UUID.randomUUID();
        putAs(alice, url(id), body("q")).andExpect(status().isOk());
        putAs(alice, url(id), body("q")).andExpect(status().isOk());
        assertThat(rows()).isOne();
        getAs(alice, "/api/v1/mine").andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(id.toString()));
    }

    @Test
    void 목록은_내_것만이다() throws Exception {
        putAs(alice, url(UUID.randomUUID()), body("앨리스")).andExpect(status().isOk());
        putAs(bob, url(UUID.randomUUID()), body("밥")).andExpect(status().isOk());
        getAs(alice, "/api/v1/mine").andExpect(jsonPath("$.data.length()").value(1)).andExpect(jsonPath("$.data[0].title").value("앨리스"));
        getAs(bob, "/api/v1/mine").andExpect(jsonPath("$.data.length()").value(1)).andExpect(jsonPath("$.data[0].title").value("밥"));
    }

    // -- 격리

    @Test
    void 남의_id_는_없는_id_와_같은_404다() throws Exception {
        UUID id = UUID.randomUUID();
        putAs(alice, url(id), body("앨리스")).andExpect(status().isOk());
        var missing = errorShape(bodyOf(getAs(bob, url(UUID.randomUUID())).andExpect(status().isNotFound())));
        assertThat(errorShape(bodyOf(getAs(bob, url(id)).andExpect(status().isNotFound())))).isEqualTo(missing);
        assertThat(errorShape(bodyOf(putAs(bob, url(id), body("가로채기")).andExpect(status().isNotFound())))).isEqualTo(missing);
        assertThat(errorShape(bodyOf(putAs(bob, url(id) + "/deleted", "{\"deleted\":true}").andExpect(status().isNotFound())))).isEqualTo(missing);
        getAs(alice, url(id)).andExpect(jsonPath("$.data.title").value("앨리스"));
        assertThat(rows()).isOne();
    }

    @Test
    void 경로의_id_가_UUID_형식이_아니면_404다() throws Exception {
        for (String bad : new String[]{"abc", "my-" + UUID.randomUUID(), UUID.randomUUID().toString().toUpperCase(), "1"}) {
            getAs(alice, "/api/v1/mine/" + bad).andExpect(status().isNotFound());
            putAs(alice, "/api/v1/mine/" + bad, body("x")).andExpect(status().isNotFound());
        }
        assertThat(rows()).isZero();
    }

    // -- 엄격한 본문

    @Test
    void 모르는_필드_잘못된_타입_빈_본문은_400이다() throws Exception {
        UUID id = UUID.randomUUID();
        String[] bad = {
                "{}", "{\"title\":1}", "{\"title\":null}", "{\"title\":\"t\",\"userId\":\"x\"}", "{\"title\":\"t\",\"extra\":1}",
                "{\"title\":\"t\",\"keywords\":\"a\"}", "{\"title\":\"t\",\"keywords\":[1]}", "{\"title\":\"t\",\"answerText\":5}",
                "{\"title\":\"t\",\"tier\":1}", "{\"title\":\"t\",\"tier\":\"EASY\"}", "{\"title\":\"t\",\"sourceLabel\":true}", "[]", "\"x\""};
        for (String b : bad) {
            putAs(alice, url(id), b).andExpect(status().isBadRequest());
        }
        assertThat(rows()).isZero();
    }

    @Test
    void 검증_오류는_400_과_이유를_돌려준다() throws Exception {
        putAs(alice, url(UUID.randomUUID()), body("   ")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("COMMON-400-01"));
        putAs(alice, url(UUID.randomUUID()), body("가".repeat(201))).andExpect(status().isBadRequest());
        putAs(alice, url(UUID.randomUUID()), "{\"title\":\"a\\u0000b\"}").andExpect(status().isBadRequest());
        assertThat(rows()).isZero();
    }

    @Test
    void 본문이_너무_크면_413이다() throws Exception {
        putAs(alice, url(UUID.randomUUID()), "{\"title\":\"t\",\"answerText\":\"" + "a".repeat(40_000) + "\"}").andExpect(status().isContentTooLarge());
        assertThat(rows()).isZero();
    }

    // -- 삭제

    @Test
    void 삭제는_PUT_이고_지운_뒤에는_404다() throws Exception {
        UUID id = UUID.randomUUID();
        putAs(alice, url(id), body("지울 것")).andExpect(status().isOk());
        putAs(alice, url(id) + "/deleted", "{\"deleted\":true}").andExpect(status().isOk()).andExpect(jsonPath("$.data.deleted").value(true));
        assertThat(rows()).isZero();
        getAs(alice, url(id)).andExpect(status().isNotFound());
        putAs(alice, url(id) + "/deleted", "{\"deleted\":true}").andExpect(status().isNotFound());
    }

    @Test
    void 삭제_본문은_deleted_true_하나뿐이다() throws Exception {
        UUID id = UUID.randomUUID();
        putAs(alice, url(id), body("q")).andExpect(status().isOk());
        for (String b : new String[]{"{}", "{\"deleted\":false}", "{\"deleted\":\"true\"}", "{\"deleted\":true,\"x\":1}"}) {
            putAs(alice, url(id) + "/deleted", b).andExpect(status().isBadRequest());
        }
        assertThat(rows()).isOne();
    }

    // -- 일괄

    @Test
    void 일괄은_전부_저장하고_순서대로_돌려준다() throws Exception {
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();
        putAs(alice, "/api/v1/mine", "{\"items\":[{\"id\":\"" + a + "\",\"title\":\"하나\"},{\"id\":\"" + b + "\",\"title\":\"둘\",\"tier\":\"TRICKY\",\"sourceLabel\":\"강사 추천\"}]}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].id").value(a.toString()))
                .andExpect(jsonPath("$.data[1].tier").value("TRICKY"));
        assertThat(rows()).isEqualTo(2);
    }

    @Test
    void 일괄에_잘못된_항목이_있으면_전부_저장되지_않는다() throws Exception {
        UUID ok = UUID.randomUUID();
        putAs(alice, "/api/v1/mine", "{\"items\":[{\"id\":\"" + ok + "\",\"title\":\"좋음\"},{\"id\":\"" + UUID.randomUUID() + "\",\"title\":\"\"}]}")
                .andExpect(status().isBadRequest());
        putAs(alice, "/api/v1/mine", "{\"items\":[{\"id\":\"" + ok + "\",\"title\":\"좋음\"},{\"id\":\"not-a-uuid\",\"title\":\"x\"}]}")
                .andExpect(status().isBadRequest());
        putAs(alice, "/api/v1/mine", "{\"items\":[{\"title\":\"id 없음\"}]}").andExpect(status().isBadRequest());
        putAs(alice, "/api/v1/mine", "{\"items\":[1]}").andExpect(status().isBadRequest());
        putAs(alice, "/api/v1/mine", "{\"items\":[],\"x\":1}").andExpect(status().isBadRequest());
        putAs(alice, "/api/v1/mine", "{\"items\":[]}").andExpect(status().isBadRequest());
        assertThat(rows()).isZero();
    }

    // -- 공용 응답에 섞이지 않는다

    @Test
    void 공용_응답은_내_질문이_있어도_바이트가_같다() throws Exception {
        String[] urls = {"/api/v1/categories", "/api/v1/topics/t1", "/api/v1/questions/aa-01", "/api/v1/search?q=%EC%A7%88%EB%AC%B8", "/api/v1/concepts"};
        String[] before = new String[urls.length];
        for (int i = 0; i < urls.length; i++) {
            before[i] = bodyOf(getAs(null, urls[i]).andExpect(status().isOk()));
        }
        putAs(alice, url(UUID.randomUUID()), body("질문 내 질문 트랜잭션")).andExpect(status().isOk());
        for (int i = 0; i < urls.length; i++) {
            assertThat(bodyOf(getAs(null, urls[i]).andExpect(status().isOk()))).as(urls[i]).isEqualTo(before[i]);
            assertThat(withoutLearned(json.readTree(bodyOf(getAs(alice, urls[i]).andExpect(status().isOk()))))).as(urls[i] + " 로그인").isNotNull();
        }
        assertThat(bodyOf(getAs(alice, "/api/v1/search?q=%EB%82%B4+%EC%A7%88%EB%AC%B8"))).doesNotContain("my-");
    }
}
