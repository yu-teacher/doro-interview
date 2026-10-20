package com.doro.interview.catalog;

import com.doro.interview.catalog.CatalogViews.CategoryView;
import com.doro.interview.catalog.CatalogViews.QuestionSummary;
import com.doro.interview.catalog.CatalogViews.QuestionView;
import com.doro.interview.catalog.CatalogViews.TopicView;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/** 기본 설정(비공개 노출 꺼짐)에서 무엇이 보이는가. */
@SpringBootTest(properties = {"interview.content.location=file:build/no-such-content/", "interview.catalog.expose-unpublished=false"})
class CatalogReaderTest extends AbstractCatalogReaderTest {

    private List<String> slugs(TopicView t) {
        return t.questions().stream().map(QuestionSummary::slug).toList();
    }

    // -- 카테고리·주제

    @Test
    void 공개_주제가_있는_카테고리만_보인다() {
        List<CategoryView> categories = reader.categories();
        assertThat(categories).extracting(CategoryView::slug).containsExactly("c1");
        assertThat(categories.get(0).name()).isEqualTo("카테고리 c1");
        assertThat(categories.get(0).topics()).extracting(t -> t.slug()).containsExactly("t1");
    }

    @Test
    void 주제_요약에_질문_수와_tier_분포_기준_버전이_있다() {
        var summary = reader.categories().get(0).topics().get(0);
        assertThat(summary.name()).isEqualTo("주제 t1");
        assertThat(summary.description()).isEqualTo("설명");
        assertThat(summary.baseVersion()).isEqualTo("v1");
        assertThat(summary.counts().basic()).isEqualTo(2);
        assertThat(summary.counts().deep()).isEqualTo(1);
        assertThat(summary.counts().tricky()).isEqualTo(1);
        assertThat(summary.counts().total()).isEqualTo(4);
    }

    @Test
    void 공개_주제가_하나도_없으면_카테고리가_비어_있다() {
        jdbc.update("update topic set published = false");
        assertThat(reader.categories()).isEmpty();
    }

    @Test
    void 주제_상세는_tier_번호_순서로_질문을_낸다() {
        TopicView t = reader.topic("t1").orElseThrow();
        assertThat(slugs(t)).containsExactly("aa-02", "aa-04", "aa-01", "aa-03");
        assertThat(t.categorySlug()).isEqualTo("c1");
        assertThat(t.categoryName()).isEqualTo("카테고리 c1");
        QuestionSummary first = t.questions().get(0);
        assertThat(first.tier()).isEqualTo("BASIC");
        assertThat(first.title()).isEqualTo("기본 질문");
        assertThat(first.keywords()).containsExactly("하나", "둘");
        assertThat(first.hasExtra()).isTrue();
    }

    @Test
    void 주제_출처가_순서와_메모와_함께_나온다() {
        TopicView t = reader.topic("t1").orElseThrow();
        assertThat(t.sources()).hasSize(1);
        assertThat(t.sources().get(0).url()).isEqualTo("https://example.com/doc");
        assertThat(t.sources().get(0).note()).isEqualTo("메모 \"따옴표\" 와 \\ 역슬래시");
    }

    // -- 질문 상세

    @Test
    void 질문_상세는_답변과_상세를_나누고_메타를_담는다() {
        QuestionView q = reader.question("aa-02").orElseThrow();
        assertThat(q.spokenAnswer()).isEqualTo("기본 답변.");
        assertThat(q.detailMd()).isEqualTo("(공식 문서) 근거 줄.\n(보충) 덧붙임.");
        assertThat(q.tier()).isEqualTo("BASIC");
        assertThat(q.difficulty()).isEqualTo(1);
        assertThat(q.topicSlug()).isEqualTo("t1");
        assertThat(q.topicName()).isEqualTo("주제 t1");
        assertThat(q.categorySlug()).isEqualTo("c1");
        assertThat(q.status()).isEqualTo("REVIEWED");
        assertThat(q.reviewedAt()).isNotNull();
        assertThat(q.needsReview()).isFalse();
        assertThat(q.baseVersion()).isEqualTo("v1");
        assertThat(q.sources()).containsExactly("https://docs.example/aa-02");
        assertThat(q.topicSources()).hasSize(1);
        assertThat(q.contentHash()).matches("[0-9a-f]{64}");
    }

    @Test
    void 이전과_다음은_주제_안의_보이는_순서를_따른다() {
        assertThat(reader.question("aa-02").orElseThrow()).satisfies(q -> {
            assertThat(q.prevSlug()).isNull();
            assertThat(q.nextSlug()).isEqualTo("aa-04");
        });
        assertThat(reader.question("aa-01").orElseThrow()).satisfies(q -> {
            assertThat(q.prevSlug()).isEqualTo("aa-04");
            assertThat(q.nextSlug()).isEqualTo("aa-03");
        });
        assertThat(reader.question("aa-03").orElseThrow()).satisfies(q -> {
            assertThat(q.prevSlug()).isEqualTo("aa-01");
            assertThat(q.nextSlug()).isNull();
        });
    }

    @Test
    void 검수필요_표시와_질문_출처는_DB_값을_그대로_보여_준다() {
        jdbc.update("update question set needs_review = true where slug = 'aa-01'");
        assertThat(reader.question("aa-01").orElseThrow().needsReview()).isTrue();
    }

    // -- 보이지 않는 것은 없는 것과 같다

    @Test
    void 비공개_주제와_그_질문은_없는_것과_같다() {
        assertThat(reader.topic("t2")).isEmpty();
        assertThat(reader.topic("t3")).isEmpty();
        assertThat(reader.question("bb-01")).isEmpty();
        assertThat(reader.question("cc-01")).isEmpty();
    }

    @Test
    void 없는_주제와_없는_질문도_같은_모양이다() {
        assertThat(reader.topic("nope")).isEqualTo(Optional.empty());
        assertThat(reader.question("nope")).isEqualTo(Optional.empty());
        assertThat(reader.topic("t2")).isEqualTo(reader.topic("nope"));
        assertThat(reader.question("bb-01")).isEqualTo(reader.question("nope"));
    }

    @Test
    void 공개했다가_다시_비공개로_돌리면_바로_사라진다() {
        assertThat(reader.question("aa-01")).isPresent();
        jdbc.update("update topic set published = false where slug = 't1'");
        assertThat(reader.question("aa-01")).isEmpty();
        assertThat(reader.topic("t1")).isEmpty();
        assertThat(reader.categories()).isEmpty();
    }

    @Test
    void 닫힌_질문은_목록_상세_개수_이전다음에서_모두_빠진다() {
        retireAa04();
        assertThat(reader.question("aa-04")).isEmpty();
        assertThat(slugs(reader.topic("t1").orElseThrow())).containsExactly("aa-02", "aa-01", "aa-03");
        assertThat(reader.categories().get(0).topics().get(0).counts().basic()).isEqualTo(1);
        assertThat(reader.question("aa-02").orElseThrow().nextSlug()).isEqualTo("aa-01");
        assertThat(reader.question("aa-01").orElseThrow().prevSlug()).isEqualTo("aa-02");
    }

    @Test
    void 개발용_스위치가_꺼져_있다() {
        assertThat(new CatalogVisibility(false).exposeUnpublished()).isFalse();
    }
}
