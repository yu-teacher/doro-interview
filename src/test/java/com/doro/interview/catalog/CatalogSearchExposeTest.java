package com.doro.interview.catalog;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** 개발용 스위치가 켜지면 비공개 주제의 질문도 검색된다. 닫힌 질문은 여전히 안 된다. */
@SpringBootTest(properties = {"interview.content.location=file:build/no-such-content/", "interview.catalog.expose-unpublished=true"})
class CatalogSearchExposeTest extends AbstractCatalogReaderTest {

    @Test
    void 비공개_주제의_질문도_검색된다() {
        fx.questionWith("c1", "t2", "bb-01", "BASIC", "비공개 전파", List.of("qzhidden"), HEADER + "전파\n", null, List.of(), List.of());
        loader.load(fx.location());
        var r = reader.search(SearchQuery.parse("qzhidden", null));
        assertThat(r.hits()).extracting(h -> h.question().slug()).containsExactly("bb-01");
        assertThat(r.total()).isEqualTo(1);
    }

    @Test
    void 닫힌_질문은_스위치와_상관없이_검색되지_않는다() {
        fx.questionWith("c1", "t2", "bb-01", "BASIC", "비공개 전파", List.of("qzhidden"), HEADER + "전파\n", null, List.of(), List.of());
        loader.load(fx.location());
        jdbc.update("update question set retired_at = now() where slug = 'bb-01'");
        assertThat(reader.search(SearchQuery.parse("qzhidden", null)).hits()).isEmpty();
    }
}
