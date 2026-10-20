package com.doro.interview.catalog;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

/** 개발용 스위치(interview.catalog.expose-unpublished)가 켜졌을 때: 비공개 주제는 보이지만 닫힌 질문은 여전히 안 보인다. */
@SpringBootTest(properties = {"interview.content.location=file:build/no-such-content/", "interview.catalog.expose-unpublished=true"})
class CatalogReaderExposeTest extends AbstractCatalogReaderTest {

    @Test
    void 비공개_주제와_카테고리도_보인다() {
        assertThat(reader.categories()).extracting(c -> c.slug()).containsExactly("c1", "c2");
        assertThat(reader.categories().get(0).topics()).extracting(t -> t.slug()).containsExactly("t1", "t2");
        assertThat(reader.topic("t2")).isPresent();
        assertThat(reader.topic("t3")).isPresent();
    }

    @Test
    void 초안_질문이_상태와_함께_보인다() {
        var q = reader.question("bb-01").orElseThrow();
        assertThat(q.status()).isEqualTo("DRAFT");
        assertThat(q.reviewedAt()).isNull();
        assertThat(q.spokenAnswer()).isEqualTo("초안 답변.");
    }

    @Test
    void 닫힌_질문은_스위치와_상관없이_안_보인다() {
        retireAa04();
        assertThat(reader.question("aa-04")).isEmpty();
        assertThat(reader.topic("t1").orElseThrow().questions()).extracting(q -> q.slug()).doesNotContain("aa-04");
    }

    @Test
    void 없는_것은_여전히_없다() {
        assertThat(reader.question("nope")).isEmpty();
        assertThat(reader.topic("nope")).isEmpty();
    }
}
