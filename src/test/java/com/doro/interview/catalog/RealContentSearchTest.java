package com.doro.interview.catalog;

import com.doro.interview.catalog.CatalogViews.QuestionView;
import com.doro.interview.catalog.CatalogViews.SearchHit;
import com.doro.interview.support.IsolatedSchema;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 실제 content/ 로 검색이 정확한지 본다(개발 스위치를 켜서 비공개 주제도 보이게 한다). 특정 질문을 못 박지 않는다:
 * 콘텐츠가 늘어도 깨지지 않도록 "모든 결과가 정말 그 단어를 담고 있는가"와 "담고 있는 질문이 빠지지 않았는가"를 본다.
 */
@SpringBootTest(properties = "interview.catalog.expose-unpublished=true")
class RealContentSearchTest {

    @DynamicPropertySource
    static void schema(DynamicPropertyRegistry registry) {
        String url = IsolatedSchema.createAndGetUrl();
        registry.add("spring.datasource.url", () -> url);
    }

    @Autowired
    CatalogReader reader;

    private static boolean contains(QuestionView q, String word) {
        String w = word.toLowerCase(Locale.ROOT);
        StringBuilder haystack = new StringBuilder(q.title()).append('\n').append(String.join(" ", q.keywords()))
                .append('\n').append(q.spokenAnswer()).append('\n').append(q.detailMd());
        q.concepts().forEach(c -> haystack.append('\n').append(c.name()));
        return haystack.toString().toLowerCase(Locale.ROOT).contains(w);
    }

    @Test
    void 모든_결과가_검색어를_실제로_담고_있다() {
        for (String word : new String[]{"프록시", "전파", "트랜잭션", "requires_new", "jpa"}) {
            var result = reader.search(SearchQuery.parse(word, 100));
            assertThat(result.hits()).as(word).isNotEmpty();
            for (SearchHit hit : result.hits()) {
                QuestionView q = reader.question(hit.question().slug()).orElseThrow();
                assertThat(contains(q, word)).as(word + " ⊂ " + q.slug()).isTrue();
            }
        }
    }

    @Test
    void 검색어를_담은_질문이_빠지지_않는다() {
        String word = "프록시";
        var result = reader.search(SearchQuery.parse(word, 100));
        long expected = reader.categories().stream().flatMap(c -> c.topics().stream())
                .flatMap(t -> reader.topic(t.slug()).orElseThrow().questions().stream())
                .map(s -> reader.question(s.slug()).orElseThrow())
                .filter(q -> contains(q, word)).count();
        assertThat(expected).isPositive();
        assertThat(result.total()).isEqualTo((int) expected);
    }

    @Test
    void 제목에_단어가_있는_질문이_본문만_있는_질문보다_앞선다() {
        var hits = reader.search(SearchQuery.parse("프록시", 100)).hits();
        int lastTitleMatch = -1;
        int firstBodyOnly = Integer.MAX_VALUE;
        for (int i = 0; i < hits.size(); i++) {
            var m = hits.get(i).matchedIn();
            if (m.contains("title")) {
                lastTitleMatch = i;
            } else if (m.equals(java.util.List.of("body")) && firstBodyOnly == Integer.MAX_VALUE) {
                firstBodyOnly = i;
            }
        }
        if (lastTitleMatch >= 0 && firstBodyOnly != Integer.MAX_VALUE) {
            assertThat(lastTitleMatch).isLessThan(firstBodyOnly);
        }
    }
}
