package com.doro.interview.catalog;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** 진도용 좁은 조회: 보이는 것의 기준은 기존 조회와 같다(비공개 주제·닫힌 질문은 없는 것과 같다). */
@SpringBootTest(properties = {"interview.content.location=file:build/no-such-content/", "interview.catalog.expose-unpublished=false"})
class CatalogVisibleSlugsTest extends AbstractCatalogReaderTest {

    @Test
    void 보이는_질문만_참이다() {
        assertThat(reader.isVisibleQuestion("aa-01")).isTrue();
        assertThat(reader.isVisibleQuestion("bb-01")).isFalse();  // 비공개 주제
        assertThat(reader.isVisibleQuestion("cc-01")).isFalse();
        assertThat(reader.isVisibleQuestion("zz-99")).isFalse();
        retireAa04();
        assertThat(reader.isVisibleQuestion("aa-04")).isFalse();  // 닫힘
    }

    @Test
    void 주제의_보이는_질문은_표시_순서이고_비공개_주제는_비어있음이_아니라_없음이다() {
        assertThat(reader.visibleQuestionSlugs("t1")).contains(List.of("aa-02", "aa-04", "aa-01", "aa-03"));
        assertThat(reader.visibleQuestionSlugs("t2")).isEmpty();
        assertThat(reader.visibleQuestionSlugs("nope")).isEmpty();
        retireAa04();
        assertThat(reader.visibleQuestionSlugs("t1")).contains(List.of("aa-02", "aa-01", "aa-03"));
    }

    @Test
    void 주제별_일람은_보이는_주제만_담고_조회_결과와_일치한다() {
        assertThat(reader.visibleQuestionSlugsByTopic()).containsOnlyKeys("t1");
        assertThat(reader.visibleQuestionSlugsByTopic().get("t1")).containsExactly("aa-02", "aa-04", "aa-01", "aa-03");
        retireAa04();
        assertThat(reader.visibleQuestionSlugsByTopic().get("t1")).containsExactly("aa-02", "aa-01", "aa-03");
    }

    @Test
    void 위치_색인은_보이는_질문만_카테고리_주제_tier_순서로_준다() {
        var index = reader.visibleQuestionIndex();
        assertThat(index).extracting(e -> e.slug()).containsExactly("aa-02", "aa-04", "aa-01", "aa-03");
        assertThat(index).allSatisfy(e -> {
            assertThat(e.topicSlug()).isEqualTo("t1");
            assertThat(e.categorySlug()).isEqualTo("c1");
        });
        assertThat(index).extracting(e -> e.tier()).containsExactly("BASIC", "BASIC", "DEEP", "TRICKY");
    }

    @Test
    void 위치_색인에서_닫힌_질문이_빠진다() {
        retireAa04();
        assertThat(reader.visibleQuestionIndex()).extracting(e -> e.slug()).containsExactly("aa-02", "aa-01", "aa-03");
    }

    @Test
    void 위치_색인은_보이는_질문_목록과_같다() {
        var fromIndex = reader.visibleQuestionIndex().stream().map(e -> e.slug()).toList();
        assertThat(fromIndex).isEqualTo(reader.visibleQuestionSlugsByTopic().values().stream().flatMap(List::stream).toList());
    }

    @Test
    void 제목_조회는_보이는_질문만_주고_답은_싣지_않는다() {
        var headings = reader.visibleQuestionHeadings(List.of("aa-01", "bb-01", "zz-99"));
        assertThat(headings).containsOnlyKeys("aa-01"); // 비공개 주제·없는 질문은 없다
        var h = headings.get("aa-01");
        assertThat(h.title()).isEqualTo("심화 질문");
        assertThat(h.tier()).isEqualTo("DEEP");
        assertThat(h.topicSlug()).isEqualTo("t1");
        assertThat(h.topicName()).isEqualTo("주제 t1");
        assertThat(reader.visibleQuestionHeadings(List.of())).isEmpty();
    }

    @Test
    void 제목_조회에서_닫힌_질문이_빠진다() {
        retireAa04();
        assertThat(reader.visibleQuestionHeadings(List.of("aa-02", "aa-04"))).containsOnlyKeys("aa-02");
    }
}
