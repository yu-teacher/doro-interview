package com.doro.interview.catalog;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** 개발용 스위치가 켜지면 비공개 대상 연결과 비공개 질문에만 붙은 개념도 보인다. 닫힌 질문은 여전히 안 보인다. */
@SpringBootTest(properties = {"interview.content.location=file:build/no-such-content/", "interview.catalog.expose-unpublished=true"})
class CatalogRelationsExposeTest extends AbstractCatalogReaderTest {

    @BeforeEach
    void relate() {
        fx.concepts("proxy=프록시", "hidden=숨은 개념");
        fx.questionFull("c1", "t1", "aa-02", "BASIC", "기본 질문", HEADER + "기본 답변.\n", "2026-10-20", List.of(),
                List.of("concepts: [\"proxy\"]", "links: [{to: \"bb-01\", kind: RELATED}, {to: \"aa-04\", kind: PREREQ}]"));
        fx.questionFull("c1", "t2", "bb-01", "BASIC", "비공개 주제의 질문", HEADER + "초안 답변.\n", null, List.of(),
                List.of("concepts: [\"hidden\"]"));
        loader.load(fx.location());
    }

    @Test
    void 비공개_대상_연결과_숨은_개념이_보인다() {
        assertThat(reader.question("aa-02").orElseThrow().related()).extracting(CatalogViews.QuestionRef::slug).containsExactly("bb-01");
        assertThat(reader.concepts()).extracting(c -> c.slug()).containsExactly("proxy", "hidden");
        assertThat(reader.concept("hidden")).isPresent();
    }

    @Test
    void 닫힌_질문은_스위치와_상관없이_연결에서_빠진다() {
        jdbc.update("update question set retired_at = now() where slug = 'aa-04'");
        assertThat(reader.question("aa-02").orElseThrow().prerequisites()).isEmpty();
    }
}
