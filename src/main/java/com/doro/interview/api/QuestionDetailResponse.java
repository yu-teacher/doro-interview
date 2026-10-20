package com.doro.interview.api;

import com.doro.interview.catalog.CatalogViews.ConceptRef;
import com.doro.interview.catalog.CatalogViews.QuestionRef;
import com.doro.interview.catalog.CatalogViews.QuestionView;
import com.doro.interview.catalog.CatalogViews.SourceView;

import java.time.Instant;
import java.util.List;

/**
 * 질문 상세 응답. 내부 읽기 모델({@link QuestionView})에서 ETag 용 {@code contentHash} 를 뺀 것이다.
 * {@code importance}(미분류면 null), {@code prevSlug}/{@code nextSlug}(없으면 null)는 값이 없어도 키를 낸다.
 */
public record QuestionDetailResponse(String slug, String topicSlug, String topicName, String categorySlug, String tier,
                                     int difficulty, String title, List<String> keywords, boolean hasExtra,
                                     String spokenAnswer, String detailMd, String status, Instant reviewedAt,
                                     boolean needsReview, String baseVersion, List<String> sources,
                                     List<SourceView> topicSources, String prevSlug, String nextSlug, Integer importance,
                                     List<ConceptRef> concepts, List<QuestionRef> followups, List<QuestionRef> prerequisites,
                                     List<QuestionRef> related) {

    static QuestionDetailResponse from(QuestionView q) {
        return new QuestionDetailResponse(q.slug(), q.topicSlug(), q.topicName(), q.categorySlug(), q.tier(), q.difficulty(),
                q.title(), q.keywords(), q.hasExtra(), q.spokenAnswer(), q.detailMd(), q.status(), q.reviewedAt(),
                q.needsReview(), q.baseVersion(), q.sources(), q.topicSources(), q.prevSlug(), q.nextSlug(), q.importance(),
                q.concepts(), q.followups(), q.prerequisites(), q.related());
    }
}
