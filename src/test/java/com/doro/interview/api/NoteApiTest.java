package com.doro.interview.api;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 내 노트 API(docs/M2-PLAN.md S5). */
class NoteApiTest extends AbstractProgressApiTest {

    private static String json(String body) {
        return "{\"body\":" + quote(body) + "}";
    }

    private static String quote(String s) {
        StringBuilder sb = new StringBuilder("\"");
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                case '\u0000' -> sb.append("\\u0000");
                default -> sb.append(c);
            }
        }
        return sb.append('"').toString();
    }

    private int notes() {
        return jdbc.queryForObject("select count(*) from my_note", Integer.class);
    }

    private String stored(String slug) {
        return jdbc.queryForObject("select body from my_note where question_slug = ?", String.class, slug);
    }

    // -- 인증·가시성

    @Test
    void 비로그인은_401이고_아무것도_저장되지_않는다() throws Exception {
        getAs(null, "/api/v1/notes/aa-01").andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("AUTH-401-01"));
        putAs(null, "/api/v1/notes/aa-01", json("x")).andExpect(status().isUnauthorized());
        assertThat(notes()).isZero();
    }

    @Test
    void 보이지_않는_질문은_사전_API와_같은_404다() throws Exception {
        var expected = errorShape(bodyOf(getAs(null, "/api/v1/questions/zz-99").andExpect(status().isNotFound())));
        for (String slug : new String[]{"bb-01", "zz-99", "ZZ_99", "a".repeat(61)}) {
            assertThat(errorShape(bodyOf(getAs(alice, "/api/v1/notes/" + slug).andExpect(status().isNotFound())))).isEqualTo(expected);
            assertThat(errorShape(bodyOf(putAs(alice, "/api/v1/notes/" + slug, json("x")).andExpect(status().isNotFound())))).isEqualTo(expected);
        }
        assertThat(notes()).isZero();
    }

    @Test
    void 질문이_닫히면_노트는_보이지_않지만_기록은_남는다() throws Exception {
        putAs(alice, "/api/v1/notes/aa-03", json("메모")).andExpect(status().isOk());
        fx.delete("c1", "t1", "aa-03");
        loader.load(fx.location());
        getAs(alice, "/api/v1/notes/aa-03").andExpect(status().isNotFound());
        assertThat(notes()).isEqualTo(1);
    }

    // -- 저장·조회

    @Test
    void 노트가_없으면_200이고_body는_null이다() throws Exception {
        getAs(alice, "/api/v1/notes/aa-01").andExpect(status().isOk()).andExpect(jsonPath("$.data.slug").value("aa-01"))
                .andExpect(jsonPath("$.data.body").doesNotExist()).andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
                .andExpect(header().doesNotExist(HttpHeaders.ETAG));
    }

    @Test
    void 저장_조회_덮어쓰기() throws Exception {
        putAs(alice, "/api/v1/notes/aa-01", json("첫 메모")).andExpect(status().isOk()).andExpect(jsonPath("$.data.body").value("첫 메모"))
                .andExpect(jsonPath("$.data.updatedAt").exists()).andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"));
        getAs(alice, "/api/v1/notes/aa-01").andExpect(jsonPath("$.data.body").value("첫 메모"));
        putAs(alice, "/api/v1/notes/aa-01", json("고친 메모")).andExpect(jsonPath("$.data.body").value("고친 메모"));
        assertThat(notes()).isEqualTo(1);
        assertThat(stored("aa-01")).isEqualTo("고친 메모");
    }

    @Test
    void 빈_문자열과_공백뿐인_본문은_노트를_지운다() throws Exception {
        putAs(alice, "/api/v1/notes/aa-01", json("메모"));
        putAs(alice, "/api/v1/notes/aa-01", json("")).andExpect(status().isOk()).andExpect(jsonPath("$.data.body").doesNotExist());
        assertThat(notes()).isZero();
        putAs(alice, "/api/v1/notes/aa-01", json("메모"));
        putAs(alice, "/api/v1/notes/aa-01", json(" \n\t \r\n ")).andExpect(status().isOk());
        assertThat(notes()).isZero();
        putAs(alice, "/api/v1/notes/aa-01", json("")).andExpect(status().isOk()); // 없는 노트를 지워도 오류가 아니다
    }

    @Test
    void 줄바꿈은_통일하고_앞뒤_공백은_유지한다() throws Exception {
        putAs(alice, "/api/v1/notes/aa-01", json("  첫 줄\r\n둘째 줄\r셋째 줄  \n"));
        assertThat(stored("aa-01")).isEqualTo("  첫 줄\n둘째 줄\n셋째 줄  \n");
    }

    @Test
    void HTML은_가공하지_않고_그대로_돌려준다() throws Exception {
        String html = "<script>alert(1)</script> <img src=x onerror=alert(2)> &amp; \"따옴표\" \\ 역슬래시";
        putAs(alice, "/api/v1/notes/aa-01", json(html)).andExpect(jsonPath("$.data.body").value(html));
        assertThat(stored("aa-01")).isEqualTo(html);
    }

    @Test
    void 사용자마다_노트가_따로다() throws Exception {
        putAs(alice, "/api/v1/notes/aa-01", json("앨리스"));
        putAs(bob, "/api/v1/notes/aa-01", json("밥"));
        getAs(alice, "/api/v1/notes/aa-01").andExpect(jsonPath("$.data.body").value("앨리스"));
        getAs(bob, "/api/v1/notes/aa-01").andExpect(jsonPath("$.data.body").value("밥"));
        putAs(bob, "/api/v1/notes/aa-01", json(""));
        getAs(alice, "/api/v1/notes/aa-01").andExpect(jsonPath("$.data.body").value("앨리스"));
        getAs(bob, "/api/v1/notes/aa-02").andExpect(jsonPath("$.data.body").doesNotExist());
    }

    // -- 길이·문자

    @Test
    void 상한은_코드포인트_기준이다() throws Exception {
        putAs(alice, "/api/v1/notes/aa-01", json("가".repeat(2000))).andExpect(status().isOk());
        putAs(alice, "/api/v1/notes/aa-01", json("가".repeat(2001))).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("COMMON-400-01"));
        assertThat(stored("aa-01")).hasSize(2000); // 실패한 요청이 기존 노트를 바꾸지 않았다

        String emoji = "😀"; // UTF-16 으로는 2칸, 코드포인트로는 1
        putAs(alice, "/api/v1/notes/aa-02", json(emoji.repeat(2000))).andExpect(status().isOk());
        putAs(alice, "/api/v1/notes/aa-02", json(emoji.repeat(2001))).andExpect(status().isBadRequest());
    }

    @Test
    void 공백만_2001자여도_길이_오류다() throws Exception {
        putAs(alice, "/api/v1/notes/aa-01", json(" ".repeat(2001))).andExpect(status().isBadRequest());
    }

    @Test
    void NUL_문자는_500이_아니라_400이다() throws Exception {
        putAs(alice, "/api/v1/notes/aa-01", json("a\u0000b")).andExpect(status().isBadRequest());
        assertThat(notes()).isZero();
    }

    // -- 잘못된 본문

    @Test
    void 잘못된_본문은_400이다() throws Exception {
        String[] bad = {"{}", "{\"body\":null}", "{\"body\":1}", "{\"body\":true}", "{\"body\":[\"x\"]}", "{\"body\":\"x\",\"extra\":1}",
                "{\"body\":\"x\",\"userId\":\"" + bob + "\"}", "[\"x\"]", "\"x\"", "{not json"};
        for (String b : bad) {
            putAs(alice, "/api/v1/notes/aa-01", b).andExpect(status().isBadRequest());
        }
        assertThat(notes()).isZero();
    }

    // -- 본문 크기

    @Test
    void 요청_본문이_상한을_넘으면_413이다() throws Exception {
        putAs(alice, "/api/v1/notes/aa-01", json("a".repeat(40_000))).andExpect(status().isContentTooLarge())
                .andExpect(jsonPath("$.code").value("COMMON-413-01")).andExpect(jsonPath("$.success").value(false));
        putAs(alice, "/api/v1/progress/aa-01", "{\"learned\":true," + " ".repeat(40_000) + "}").andExpect(status().isContentTooLarge());
        assertThat(notes()).isZero();
    }

    @Test
    void 가장_긴_정상_노트는_상한_안에_들어간다() throws Exception {
        // 제어 문자는 JSON 에서 6바이트로 이스케이프되지만 노트로는 유효하다(\u0001). 2,000자 = 12KB 안팎
        String worst = "\u0001".repeat(2000);
        String body = "{\"body\":\"" + "\\u0001".repeat(2000) + "\"}";
        assertThat(body.length()).isLessThan(32_768);
        putAs(alice, "/api/v1/notes/aa-01", body).andExpect(status().isOk());
        assertThat(stored("aa-01")).isEqualTo(worst);
    }
}
