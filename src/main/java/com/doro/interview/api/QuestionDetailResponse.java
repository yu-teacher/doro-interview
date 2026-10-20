package com.doro.interview.api;

import com.doro.interview.catalog.CatalogViews.ConceptRef;
import com.doro.interview.catalog.CatalogViews.QuestionRef;
import com.doro.interview.catalog.CatalogViews.QuestionView;
import com.doro.interview.catalog.CatalogViews.SourceView;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

/**
 * 질문 상세 응답. 내부 읽기 모델({@link QuestionView})에서 ETag 용 {@code contentHash} 를 뺀 것이다.
 * {@code learned}·{@code reviewCandidate} 는 로그인 사용자의 응답에만 있다(비로그인은 키 자체가 없다, docs/M2-PLAN.md D8).
 * {@code importance}(미분류면 null), {@code prevSlug}/{@code nextSlug}(없으면 null)는 값이 없어도 키를 낸다.
 */
public record QuestionDetailResponse(String slug, String topicSlug, String topicName, String categorySlug, String tier,
                                     int difficulty, String title, List<String> keywords, boolean hasExtra,
                                     String spokenAnswer, String detailMd, String status, Instant reviewedAt,
                                     boolean needsReview, String baseVersion, List<String> sources, List<String> refs,
                                     List<SourceView> topicSources, String prevSlug, String nextSlug, Integer importance,
                                     List<ConceptRef> concepts, List<QuestionRef> followups, List<QuestionRef> prerequisites,
                                     List<QuestionRef> related, @JsonInclude(JsonInclude.Include.NON_NULL) Boolean learned,
                                     @JsonInclude(JsonInclude.Include.NON_NULL) Boolean reviewCandidate) {

    static QuestionDetailResponse from(QuestionView q, Boolean learned, Boolean reviewCandidate) {
        return new QuestionDetailResponse(q.slug(), q.topicSlug(), q.topicName(), q.categorySlug(), q.tier(), q.difficulty(),
                q.title(), q.keywords(), q.hasExtra(), q.spokenAnswer(), q.detailMd(), q.status(), q.reviewedAt(),
                q.needsReview(), q.baseVersion(), q.sources(), q.refs(), q.topicSources(), q.prevSlug(), q.nextSlug(), q.importance(),
                q.concepts(), q.followups(), q.prerequisites(), q.related(), learned, reviewCandidate);
    }
}
