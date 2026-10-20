package com.doro.interview.catalog;

import com.doro.interview.catalog.CatalogViews.QuestionHeading;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** 처음 온 사람에게 보여 줄 "자주 나오는 질문"(필수도 3): 보이는 것만, 주제마다 하나씩 돌려 가며, 한도 안에서. */
@SpringBootTest(properties = {"interview.content.location=file:build/no-such-content/", "interview.catalog.expose-unpublished=false"})
class CatalogFeaturedTest extends AbstractCatalogReaderTest {

    private void importance(int value, String... slugs) {
        for (String slug : slugs) {
            jdbc.update("update question set importance = ? where slug = ?", value, slug);
        }
    }

    private List<String> featured(int limit) {
        return reader.featuredQuestions(limit).stream().map(QuestionHeading::slug).toList();
    }

    @Test
    void 필수도_3이_없으면_빈_목록이다() {
        importance(2, "aa-01", "aa-02");
        assertThat(featured(6)).isEmpty();
    }

    @Test
    void 필수도_3인_보이는_질문만_표시_순서로_고른다() {
        importance(3, "aa-01", "aa-02", "aa-03", "bb-01", "cc-01");   // bb-01·cc-01 은 비공개 주제
        assertThat(featured(6)).containsExactly("aa-02", "aa-01", "aa-03"); // 한 주제 안에서는 기본 → 심화 → 함정
    }

    @Test
    void 닫힌_질문은_빠진다() {
        retireAa04(); // 다시 반영하면 필수도가 파일 값으로 돌아가므로 닫은 뒤에 지정한다
        importance(3, "aa-02", "aa-04");
        assertThat(featured(6)).containsExactly("aa-02");
    }

    @Test
    void 주제마다_하나씩_돌려_가며_고른다() {
        fx.topic("c1", "t5", "ee", true)
                .questionFull("c1", "t5", "ee-01", "BASIC", "다른 주제 질문 1", HEADER + "답.\n", "2026-10-20", List.of())
                .questionFull("c1", "t5", "ee-02", "BASIC", "다른 주제 질문 2", HEADER + "답.\n", "2026-10-20", List.of());
        loader.load(fx.location());
        // 주제 정렬 값을 확실히 다르게 둔다(같으면 순서 규칙을 구별하지 못한다)
        jdbc.update("update topic set sort = 10 where slug = 't1'");
        jdbc.update("update topic set sort = 20 where slug = 't5'");
        importance(3, "aa-01", "aa-02", "aa-03", "ee-01", "ee-02");
        // 1번들(주제 순서: t1 → t5) 다음에 2번들
        assertThat(featured(6)).containsExactly("aa-02", "ee-01", "aa-01", "ee-02", "aa-03");
        // 한도가 작으면 한 주제에 쏠리지 않고 주제마다 하나씩
        assertThat(featured(2)).containsExactly("aa-02", "ee-01");
    }

    @Test
    void 한도는_넘지_않고_0이하면_빈_목록이다() {
        importance(3, "aa-01", "aa-02", "aa-03");
        assertThat(featured(1)).hasSize(1);
        assertThat(featured(0)).isEmpty();
        assertThat(featured(-3)).isEmpty();
    }

    @Test
    void 제목_난이도_주제를_함께_준다() {
        importance(3, "aa-02");
        QuestionHeading h = reader.featuredQuestions(1).get(0);
        assertThat(h.title()).isEqualTo("기본 질문");
        assertThat(h.tier()).isEqualTo("BASIC");
        assertThat(h.topicSlug()).isEqualTo("t1");
        assertThat(h.topicName()).isNotBlank();
    }
}
