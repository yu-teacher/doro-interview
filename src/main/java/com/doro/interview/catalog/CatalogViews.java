package com.doro.interview.catalog;

import java.time.Instant;
import java.util.List;

/** 사전(catalog)이 바깥에 내주는 읽기 모델. 엔티티가 아니라 값이다. */
public final class CatalogViews {

    private CatalogViews() {
    }

    public record TierCounts(int basic, int deep, int tricky) {
        public int total() {
            return basic + deep + tricky;
        }
    }

    public record SourceView(String url, String note) {
    }

    public record TopicSummary(String slug, String name, String description, String baseVersion, TierCounts counts) {
    }

    public record CategoryView(String slug, String name, List<TopicSummary> topics) {
    }

    /** 개념 칩: 사전의 slug 와 이름. */
    public record ConceptRef(String slug, String name) {
    }

    /** 다른 질문으로 가는 연결의 표시용 정보. */
    public record QuestionRef(String slug, String title, String tier, String topicSlug) {
    }

    /**
     * 목록용 요약. {@code importance} 는 1~3 이고 판단하지 않았으면 {@code null}(미분류).
     * {@code concepts} 는 개념 slug(사전 순서)다.
     */
    public record QuestionSummary(String slug, String topicSlug, String tier, int difficulty, String title, List<String> keywords,
                                  boolean hasExtra, Integer importance, List<String> concepts) {
    }

    /** 시험 화면에 보이는 질문의 겉모습: 제목·tier·주제(모범 답변은 싣지 않는다). */
    public record QuestionHeading(String slug, String title, String tier, String topicSlug, String topicName) {
    }

    /** 보이는 질문의 위치 색인(시험의 풀 구성용): 어느 카테고리·주제·tier 에 속하는가. */
    public record QuestionIndexEntry(String slug, String topicSlug, String categorySlug, String tier) {
    }

    /** 개념 목록의 한 줄. {@code questionCount} 는 보이는 질문 수다. */
    public record ConceptView(String slug, String name, String description, int questionCount) {
    }

    /**
     * 검색 결과 한 건. {@code score} 는 단어마다 제목 3 + 키워드 2 + 개념 2 + 본문 1 의 합이고,
     * {@code matchedIn} 은 어느 단어든 일치한 곳(title / keywords / concepts / body)이다.
     */
    public record SearchHit(QuestionSummary question, String topicName, int score, List<String> matchedIn) {
    }

    /** {@code total} 은 limit 와 무관한 전체 일치 수다. */
    public record SearchResult(List<String> words, int total, List<SearchHit> hits) {
    }

    /** 개념 상세: 그 개념의 보이는 질문(카테고리·주제·tier·번호 순). */
    public record ConceptDetail(ConceptView concept, List<QuestionSummary> questions) {
    }

    public record TopicView(TopicSummary summary, String categorySlug, String categoryName, List<SourceView> sources,
                            List<QuestionSummary> questions) {
    }

    /**
     * 질문 상세. {@code spokenAnswer}(말로 하는 모범 답변)와 {@code detailMd}(근거·코드·실험 설명, 마크다운)로 나뉜다.
     * {@code sources} 는 이 질문을 검수하며 대조한 출처, {@code refs} 는 책 근거("책 제목, 3장, p.45"), {@code topicSources} 는 주제(문서) 전체 출처다.
     * {@code followups}/{@code prerequisites}/{@code related} 는 보이는 질문만 담는다(RELATED 는 양쪽 방향).
     * {@code contentHash} 는 ETag 용이며 응답 본문에는 싣지 않는다.
     */
    public record QuestionView(String slug, String topicSlug, String topicName, String categorySlug, String tier, int difficulty,
                               String title, List<String> keywords, boolean hasExtra, String spokenAnswer, String detailMd,
                               String status, Instant reviewedAt, boolean needsReview, String baseVersion,
                               List<String> sources, List<String> refs, List<SourceView> topicSources, String prevSlug, String nextSlug,
                               String contentHash, Integer importance, List<ConceptRef> concepts, List<QuestionRef> followups,
                               List<QuestionRef> prerequisites, List<QuestionRef> related) {
    }
}
