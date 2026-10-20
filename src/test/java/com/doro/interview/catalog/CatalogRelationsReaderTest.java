package com.doro.interview.catalog;

import com.doro.interview.catalog.CatalogViews.ConceptRef;
import com.doro.interview.catalog.CatalogViews.QuestionRef;
import com.doro.interview.catalog.CatalogViews.QuestionSummary;
import com.doro.interview.catalog.CatalogViews.QuestionView;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 개념·연결·필수도의 조회(D15~D17), 기본 설정(비공개 노출 꺼짐). 비공개 질문으로 가는 연결과 비공개 질문에만 붙은 개념이
 * 새어 나오지 않는지가 핵심이다.
 *
 * <pre>
 * 개념: proxy(프록시), tx(트랜잭션 경계), hidden(숨은 개념: bb-01 에만 붙음)
 * aa-02 (필수도 3, 개념 proxy·tx): FOLLOWUP→aa-01, PREREQ→aa-04, RELATED→bb-01(비공개 대상)
 * aa-04 : RELATED→aa-02 (aa-02 쪽에서도 보여야 한다)
 * aa-01 (필수도 2, 개념 proxy)
 * bb-01 (비공개 주제): 개념 tx·hidden
 * </pre>
 */
@SpringBootTest(properties = {"interview.content.location=file:build/no-such-content/", "interview.catalog.expose-unpublished=false"})
class CatalogRelationsReaderTest extends AbstractCatalogReaderTest {

    @BeforeEach
    void relate() {
        fx.concepts("proxy=프록시", "tx=트랜잭션 경계", "hidden=숨은 개념");
        fx.questionFull("c1", "t1", "aa-01", "DEEP", "심화 질문", HEADER + "심화 답변.\n", "2026-10-20", List.of(),
                List.of("concepts: [\"proxy\"]", "importance: 2"));
        fx.questionFull("c1", "t1", "aa-02", "BASIC", "기본 질문", HEADER + "기본 답변.\n\n(공식 문서) 근거 줄.\n(보충) 덧붙임.\n", "2026-10-20",
                List.of("https://docs.example/aa-02"),
                List.of("concepts: [\"proxy\", \"tx\"]", "importance: 3",
                        "links: [{to: \"aa-01\", kind: FOLLOWUP}, {to: \"aa-04\", kind: PREREQ}, {to: \"bb-01\", kind: RELATED}]"));
        fx.questionFull("c1", "t1", "aa-04", "BASIC", "기본 질문 둘", HEADER + "기본 답변 둘.\n", "2026-10-20", List.of(),
                List.of("links: [{to: \"aa-02\", kind: RELATED}]"));
        fx.questionFull("c1", "t2", "bb-01", "BASIC", "비공개 주제의 질문", HEADER + "초안 답변.\n", null, List.of(),
                List.of("concepts: [\"tx\", \"hidden\"]"));
        loader.load(fx.location());
    }

    private static List<String> slugs(List<QuestionRef> refs) {
        return refs.stream().map(QuestionRef::slug).toList();
    }

    @Test
    void 질문_상세에_필수도와_개념이_사전_순서로_나온다() {
        QuestionView q = reader.question("aa-02").orElseThrow();
        assertThat(q.importance()).isEqualTo(3);
        assertThat(q.concepts()).containsExactly(new ConceptRef("proxy", "프록시"), new ConceptRef("tx", "트랜잭션 경계"));
        assertThat(reader.question("aa-01").orElseThrow().importance()).isEqualTo(2);
        assertThat(reader.question("aa-04").orElseThrow().importance()).isNull();
        assertThat(reader.question("aa-04").orElseThrow().concepts()).isEmpty();
    }

    @Test
    void 연결이_종류별로_나온다() {
        QuestionView q = reader.question("aa-02").orElseThrow();
        assertThat(slugs(q.followups())).containsExactly("aa-01");
        assertThat(slugs(q.prerequisites())).containsExactly("aa-04");
        QuestionRef followup = q.followups().get(0);
        assertThat(followup.title()).isEqualTo("심화 질문");
        assertThat(followup.tier()).isEqualTo("DEEP");
        assertThat(followup.topicSlug()).isEqualTo("t1");
    }

    @Test
    void RELATED는_걸지_않은_쪽에서도_보인다() {
        assertThat(slugs(reader.question("aa-04").orElseThrow().related())).containsExactly("aa-02");
        assertThat(slugs(reader.question("aa-02").orElseThrow().related())).containsExactly("aa-04");
    }

    @Test
    void 비공개_질문으로_가는_연결은_나오지_않는다() {
        // aa-02 → bb-01(비공개 주제) 연결은 DB 에 있지만 보이지 않는다
        assertThat(jdbc.queryForObject("select count(*) from question_link l join question o on o.id = l.to_id where o.slug = 'bb-01'", Integer.class)).isEqualTo(1);
        assertThat(slugs(reader.question("aa-02").orElseThrow().related())).doesNotContain("bb-01");
    }

    @Test
    void 연결이_없는_질문은_빈_목록이다() {
        QuestionView q = reader.question("aa-03").orElseThrow();
        assertThat(q.followups()).isEmpty();
        assertThat(q.prerequisites()).isEmpty();
        assertThat(q.related()).isEmpty();
    }

    @Test
    void 목록_요약에_필수도와_개념_slug가_있다() {
        QuestionSummary s = reader.topic("t1").orElseThrow().questions().stream().filter(x -> x.slug().equals("aa-02")).findFirst().orElseThrow();
        assertThat(s.importance()).isEqualTo(3);
        assertThat(s.concepts()).containsExactly("proxy", "tx");
        assertThat(s.topicSlug()).isEqualTo("t1");
    }

    // -- 개념 가시성

    @Test
    void 개념_목록은_보이는_질문이_있는_개념만_사전_순서로_나온다() {
        var concepts = reader.concepts();
        assertThat(concepts).extracting(c -> c.slug()).containsExactly("proxy", "tx");
        assertThat(concepts.get(0).questionCount()).isEqualTo(2);
        assertThat(concepts.get(1).questionCount()).isEqualTo(1);
        assertThat(concepts.get(1).name()).isEqualTo("트랜잭션 경계");
    }

    @Test
    void 비공개_질문에만_붙은_개념은_없는_것과_같다() {
        assertThat(reader.concept("hidden")).isEmpty();
        assertThat(reader.concept("hidden")).isEqualTo(reader.concept("nope"));
        assertThat(reader.concepts()).extracting(c -> c.slug()).doesNotContain("hidden");
    }

    @Test
    void 개념_상세는_보이는_질문만_주제_tier_번호_순으로_낸다() {
        var detail = reader.concept("proxy").orElseThrow();
        assertThat(detail.concept().questionCount()).isEqualTo(2);
        assertThat(detail.questions()).extracting(QuestionSummary::slug).containsExactly("aa-02", "aa-01");
        assertThat(reader.concept("tx").orElseThrow().questions()).extracting(QuestionSummary::slug).containsExactly("aa-02");
    }

    /**
     * 읽기 단계의 필터: 연결 행과 개념 연결이 DB 에 남아 있어도 닫힌 질문은 보이지 않는다
     * (파일에서 질문을 지우는 경로의 정리는 ContentRelationsLoadTest 가 본다. 거기서는 가리키는 연결이 남아 있으면 로드 자체가 거부된다).
     */
    @Test
    void 닫힌_질문은_개념_개수와_연결에서_빠진다() {
        jdbc.update("update question set retired_at = now() where slug in ('aa-04', 'aa-01')");
        QuestionView q = reader.question("aa-02").orElseThrow();
        assertThat(q.prerequisites()).isEmpty();      // aa-04 로 가는 PREREQ
        assertThat(q.followups()).isEmpty();          // aa-01 로 가는 FOLLOWUP
        assertThat(q.related()).isEmpty();            // aa-04 가 건 RELATED(들어오는 쪽)와 비공개 bb-01
        assertThat(reader.concepts().get(0).slug()).isEqualTo("proxy");
        assertThat(reader.concepts().get(0).questionCount()).isEqualTo(1);   // aa-02 만 남음
        assertThat(reader.concept("proxy").orElseThrow().questions()).extracting(QuestionSummary::slug).containsExactly("aa-02");
    }

    @Test
    void 공개_주제를_비공개로_돌리면_개념도_사라진다() {
        jdbc.update("update topic set published = false");
        assertThat(reader.concepts()).isEmpty();
        assertThat(reader.concept("proxy")).isEmpty();
    }
}
