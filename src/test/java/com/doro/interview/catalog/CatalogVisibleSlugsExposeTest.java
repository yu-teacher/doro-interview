package com.doro.interview.catalog;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

/** 개발용 노출 스위치가 켜지면 진도용 조회도 같은 기준을 따른다(닫힌 질문은 여전히 안 보인다). */
@SpringBootTest(properties = {"interview.content.location=file:build/no-such-content/", "interview.catalog.expose-unpublished=true"})
class CatalogVisibleSlugsExposeTest extends AbstractCatalogReaderTest {

    @Test
    void 비공개_주제의_질문도_보인다() {
        assertThat(reader.isVisibleQuestion("bb-01")).isTrue();
        assertThat(reader.visibleQuestionSlugs("t2")).hasValueSatisfying(l -> assertThat(l).containsExactly("bb-01"));
        assertThat(reader.visibleQuestionSlugsByTopic()).containsOnlyKeys("t1", "t2", "t3");
    }

    @Test
    void 닫힌_질문은_안_보인다() {
        retireAa04();
        assertThat(reader.isVisibleQuestion("aa-04")).isFalse();
        assertThat(reader.visibleQuestionSlugsByTopic().get("t1")).doesNotContain("aa-04");
    }
}
