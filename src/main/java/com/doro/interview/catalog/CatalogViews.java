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

    public record QuestionSummary(String slug, String tier, int difficulty, String title, List<String> keywords, boolean hasExtra) {
    }

    public record TopicView(TopicSummary summary, String categorySlug, String categoryName, List<SourceView> sources,
                            List<QuestionSummary> questions) {
    }

    /**
     * 질문 상세. {@code spokenAnswer}(말로 하는 모범 답변)와 {@code detailMd}(근거·코드·실험 설명, 마크다운)로 나뉜다.
     * {@code sources} 는 이 질문을 검수하며 대조한 출처, {@code topicSources} 는 주제(문서) 전체 출처다.
     * {@code contentHash} 는 ETag 용이며 응답 본문에는 싣지 않는다.
     */
    public record QuestionView(String slug, String topicSlug, String topicName, String categorySlug, String tier, int difficulty,
                               String title, List<String> keywords, boolean hasExtra, String spokenAnswer, String detailMd,
                               String status, Instant reviewedAt, boolean needsReview, String baseVersion,
                               List<String> sources, List<SourceView> topicSources, String prevSlug, String nextSlug,
                               String contentHash) {
    }
}
