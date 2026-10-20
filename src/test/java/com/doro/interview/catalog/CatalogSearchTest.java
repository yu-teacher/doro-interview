package com.doro.interview.catalog;

import com.doro.interview.catalog.CatalogViews.SearchHit;
import com.doro.interview.catalog.CatalogViews.SearchResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 검색(S3), 기본 설정(비공개 노출 꺼짐). 고정 데이터:
 *
 * <pre>
 * c1/t1 공개:
 *   aa-01 DEEP   제목 "트랜잭션 전파 속성 REQUIRES_NEW"        키워드 [qzkey]            본문 "전파를 설명한다."
 *   aa-02 BASIC  제목 "스프링 컨테이너"                         키워드 [프록시]            본문 "컨테이너 본문."
 *   aa-03 BASIC  제목 "abc 문서"                                키워드 [x1]               본문 "일반 문서."
 *   aa-04 BASIC  제목 "a_c 문서"                                키워드 [x2]               본문 "밑줄 문서."
 *   aa-05 BASIC  제목 "수치 100% 보장"                          키워드 [x3]               본문 "퍼센트."
 *   aa-06 BASIC  제목 "수치 100개"                              키워드 [x4]               본문 "퍼센트 아님."
 *   aa-07 TRICKY 제목 "개념 전용"                               키워드 [x5]               본문 "본문에 없음."  개념 [pxy=프록시 계층]
 *   aa-08 BASIC  제목 "본문에만 있다"                           키워드 [x6]               본문 "여기에 프록시 가 있다."
 * c1/t2 비공개: bb-01 제목 "비공개 전파"  본문 "전파"
 * </pre>
 */
@SpringBootTest(properties = {"interview.content.location=file:build/no-such-content/", "interview.catalog.expose-unpublished=false"})
class CatalogSearchTest extends AbstractCatalogReaderTest {

    private void q(String slug, String tier, String title, String keyword, String body, String... extra) {
        fx.questionWith("c1", "t1", slug, tier, title, List.of(keyword), HEADER + body + "\n", "2026-10-20", List.of(), List.of(extra));
    }

    @BeforeEach
    void searchData() {
        fx.concepts("pxy=프록시 계층");
        q("aa-01", "DEEP", "트랜잭션 전파 속성 REQUIRES_NEW", "qzkey", "전파를 설명한다.");
        q("aa-02", "BASIC", "스프링 컨테이너", "프록시", "컨테이너 본문.");
        q("aa-03", "BASIC", "abc 문서", "x1", "일반 문서.");
        q("aa-04", "BASIC", "a_c 문서", "x2", "밑줄 문서.");
        q("aa-05", "BASIC", "수치 100% 보장", "x3", "퍼센트.");
        q("aa-06", "BASIC", "수치 100개", "x4", "퍼센트 아님.");
        q("aa-07", "TRICKY", "개념 전용", "x5", "본문에 없음.", "concepts: [\"pxy\"]");
        q("aa-08", "BASIC", "본문에만 있다", "x6", "여기에 프록시 가 있다.");
        fx.questionWith("c1", "t2", "bb-01", "BASIC", "비공개 전파", List.of("qzhidden"), HEADER + "전파\n", null, List.of(), List.of());
        loader.load(fx.location());
    }

    private SearchResult search(String raw) {
        return reader.search(SearchQuery.parse(raw, null));
    }

    private static List<String> slugs(SearchResult r) {
        return r.hits().stream().map(h -> h.question().slug()).toList();
    }

    // -- 부분 일치

    @Test
    void 한국어_부분_일치로_제목과_본문에서_찾는다() {
        SearchResult r = search("전파");
        assertThat(slugs(r)).containsExactly("aa-01");
        SearchHit hit = r.hits().get(0);
        assertThat(hit.matchedIn()).containsExactly("title", "body");
        assertThat(hit.topicName()).isEqualTo("주제 t1");
        assertThat(hit.question().title()).isEqualTo("트랜잭션 전파 속성 REQUIRES_NEW");
        assertThat(r.total()).isEqualTo(1);
    }

    @Test
    void 단어의_일부만_써도_찾는다() {
        assertThat(slugs(search("트랜잭"))).containsExactly("aa-01");
        assertThat(slugs(search("컨테"))).containsExactly("aa-02");
    }

    @Test
    void 영문은_대소문자를_가리지_않고_밑줄은_글자로_취급한다() {
        assertThat(slugs(search("requires_new"))).containsExactly("aa-01");
        assertThat(slugs(search("REQUIRES_new"))).containsExactly("aa-01");
    }

    @Test
    void 키워드에서도_찾는다() {
        SearchResult r = search("qzkey");
        assertThat(slugs(r)).containsExactly("aa-01");
        assertThat(r.hits().get(0).matchedIn()).containsExactly("keywords");
    }

    @Test
    void 개념_이름으로도_찾는다() {
        SearchResult r = search("계층");
        assertThat(slugs(r)).containsExactly("aa-07");
        assertThat(r.hits().get(0).matchedIn()).containsExactly("concepts");
    }

    // -- 와일드카드·인젝션

    @Test
    void 밑줄은_와일드카드가_아니다() {
        // a_c 가 "한 글자 와일드카드"라면 abc 문서(aa-03)도 걸렸을 것이다
        assertThat(slugs(search("a_c"))).containsExactly("aa-04");
    }

    @Test
    void 퍼센트는_와일드카드가_아니다() {
        assertThat(slugs(search("100%"))).containsExactly("aa-05");
        assertThat(slugs(search("%"))).containsExactly("aa-05");
    }

    @Test
    void 역슬래시도_글자로_취급하고_오류가_나지_않는다() {
        assertThat(search("\\").hits()).isEmpty();
        assertThat(search("a\\").hits()).isEmpty();
    }

    @Test
    void SQL_인젝션_문자열은_데이터로만_취급된다() {
        assertThat(search("'; drop table question; --").hits()).isEmpty();
        assertThat(search("\" OR 1=1 --").hits()).isEmpty();
        assertThat(jdbc.queryForObject("select count(*) from question", Integer.class)).isGreaterThan(0);
    }

    // -- AND·점수·정렬

    @Test
    void 여러_단어는_모두_일치해야_한다() {
        assertThat(slugs(search("트랜잭션 전파"))).containsExactly("aa-01");
        assertThat(search("트랜잭션 컨테이너").hits()).isEmpty();
    }

    @Test
    void 단어_순서는_상관없다() {
        assertThat(slugs(search("전파 트랜잭션"))).isEqualTo(slugs(search("트랜잭션 전파")));
    }

    @Test
    void 같은_단어를_반복해도_점수가_부풀지_않는다() {
        assertThat(search("전파 전파").hits().get(0).score()).isEqualTo(search("전파").hits().get(0).score());
    }

    @Test
    void 점수는_제목_3_키워드_2_개념_2_본문_1이고_높은_순으로_나온다() {
        SearchResult r = search("프록시");
        // aa-02: 키워드(2), aa-07: 개념 이름 "프록시 계층"(2), aa-08: 본문(1)
        assertThat(r.hits()).extracting(h -> h.question().slug() + ":" + h.score()).containsExactly("aa-02:2", "aa-07:2", "aa-08:1");
        // 동점(aa-02, aa-07)은 사전 순서: BASIC 이 TRICKY 보다 앞
    }

    @Test
    void 제목_일치가_본문만_일치하는_것보다_앞선다() {
        fx.questionWith("c1", "t1", "aa-09", "BASIC", "프록시 제목", List.of("x9"), HEADER + "내용.\n", "2026-10-20", List.of(), List.of());
        loader.load(fx.location());
        List<String> order = slugs(search("프록시"));
        assertThat(order.get(0)).isEqualTo("aa-09");
        assertThat(order.indexOf("aa-09")).isLessThan(order.indexOf("aa-08"));
    }

    @Test
    void 단어마다_점수가_더해진다() {
        // 제목에 둘 다 있으면 (3 + 3) 이상
        assertThat(search("트랜잭션 전파").hits().get(0).score()).isGreaterThanOrEqualTo(6);
    }

    // -- limit·total

    @Test
    void limit보다_많이_일치하면_total은_전체_수다() {
        SearchResult r = reader.search(SearchQuery.parse("문서", null));
        assertThat(r.total()).isEqualTo(2);
        SearchResult limited = reader.search(SearchQuery.parse("수치 100", 1));
        assertThat(limited.total()).isEqualTo(2);
        assertThat(limited.hits()).hasSize(1);
        assertThat(limited.words()).containsExactly("수치", "100");
    }

    @Test
    void 일치가_없으면_빈_결과다() {
        SearchResult r = search("존재하지않는단어xyz");
        assertThat(r.hits()).isEmpty();
        assertThat(r.total()).isZero();
    }

    // -- 가시성

    @Test
    void 비공개_주제의_질문은_검색되지_않고_total에도_안_들어간다() {
        assertThat(slugs(search("전파"))).doesNotContain("bb-01");
        assertThat(search("qzhidden").hits()).isEmpty();
        assertThat(search("qzhidden").total()).isZero();
    }

    @Test
    void 닫힌_질문은_검색되지_않는다() {
        jdbc.update("update question set retired_at = now() where slug = 'aa-01'");
        assertThat(search("전파").hits()).isEmpty();
    }

    @Test
    void 비공개_질문에만_있는_개념_이름으로는_찾지_못한다() {
        fx.concepts("pxy=프록시 계층", "hid=숨은개념");
        fx.questionWith("c1", "t2", "bb-01", "BASIC", "비공개 전파", List.of("qzhidden"), HEADER + "전파\n", null, List.of(), List.of("concepts: [\"hid\"]"));
        loader.load(fx.location());
        assertThat(search("숨은개념").hits()).isEmpty();
    }
}
