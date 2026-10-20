package com.doro.interview.api;

import com.doro.interview.catalog.CatalogViews.ConceptDetail;
import com.doro.interview.catalog.CatalogViews.ConceptView;
import com.doro.interview.catalog.CatalogViews.QuestionSummary;
import com.doro.interview.catalog.CatalogViews.SearchHit;
import com.doro.interview.catalog.CatalogViews.SearchResult;
import com.doro.interview.catalog.CatalogViews.SourceView;
import com.doro.interview.catalog.CatalogViews.TopicSummary;
import com.doro.interview.catalog.CatalogViews.TopicView;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;
import java.util.Set;

/**
 * 사전 응답에 사용자 상태({@code learned})를 합친 모양(docs/M2-PLAN.md D8). 필드 이름·순서는 catalog 읽기 모델과 같고
 * {@code learned} 만 맨 끝에 더해진다. {@code learned} 가 null(비로그인)이면 키 자체가 없어 M1 응답과 바이트가 같다.
 * `importance: null` 처럼 값이 없어도 내는 키는 건드리지 않으므로 NON_NULL 은 {@code learned} 한 칸에만 건다.
 */
final class CatalogResponses {

    private CatalogResponses() {
    }

    /** 로그인한 사용자의 질문별 상태: 체크한 질문과 "다시 공부 후보"(체크했고 마지막 시험 결과가 틀림). 비로그인이면 null 로 다룬다. */
    record UserFlags(Set<String> learned, Set<String> review) {
        Boolean learned(String slug) {
            return learned.contains(slug);
        }

        Boolean review(String slug) {
            return review.contains(slug);
        }
    }

    private static Boolean learnedFlag(UserFlags flags, String slug) {
        return flags == null ? null : flags.learned(slug);
    }

    private static Boolean reviewFlag(UserFlags flags, String slug) {
        return flags == null ? null : flags.review(slug);
    }

    record QuestionSummaryResponse(String slug, String topicSlug, String tier, int difficulty, String title, List<String> keywords,
                                   boolean hasExtra, Integer importance, List<String> concepts,
                                   @JsonInclude(JsonInclude.Include.NON_NULL) Boolean learned,
                                   @JsonInclude(JsonInclude.Include.NON_NULL) Boolean reviewCandidate) {
        static QuestionSummaryResponse of(QuestionSummary q, UserFlags flags) {
            return new QuestionSummaryResponse(q.slug(), q.topicSlug(), q.tier(), q.difficulty(), q.title(), q.keywords(),
                    q.hasExtra(), q.importance(), q.concepts(), learnedFlag(flags, q.slug()), reviewFlag(flags, q.slug()));
        }

        static List<QuestionSummaryResponse> of(List<QuestionSummary> list, UserFlags flags) {
            return list.stream().map(q -> of(q, flags)).toList();
        }
    }

    record TopicResponse(TopicSummary summary, String categorySlug, String categoryName, List<SourceView> sources,
                         List<QuestionSummaryResponse> questions) {
        static TopicResponse of(TopicView t, UserFlags learned) {
            return new TopicResponse(t.summary(), t.categorySlug(), t.categoryName(), t.sources(),
                    QuestionSummaryResponse.of(t.questions(), learned));
        }
    }

    record SearchHitResponse(QuestionSummaryResponse question, String topicName, int score, List<String> matchedIn) {
        static SearchHitResponse of(SearchHit h, UserFlags learned) {
            return new SearchHitResponse(QuestionSummaryResponse.of(h.question(), learned), h.topicName(), h.score(), h.matchedIn());
        }
    }

    record SearchResponse(List<String> words, int total, List<SearchHitResponse> hits) {
        static SearchResponse of(SearchResult r, UserFlags learned) {
            return new SearchResponse(r.words(), r.total(), r.hits().stream().map(h -> SearchHitResponse.of(h, learned)).toList());
        }
    }

    record ConceptDetailResponse(ConceptView concept, List<QuestionSummaryResponse> questions) {
        static ConceptDetailResponse of(ConceptDetail d, UserFlags learned) {
            return new ConceptDetailResponse(d.concept(), QuestionSummaryResponse.of(d.questions(), learned));
        }
    }
}
