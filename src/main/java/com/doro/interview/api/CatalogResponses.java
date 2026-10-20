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

    /** {@code learned} 가 null 이면 비로그인, 아니면 그 질문을 체크했는지. */
    private static Boolean flag(Set<String> learned, String slug) {
        return learned == null ? null : learned.contains(slug);
    }

    record QuestionSummaryResponse(String slug, String topicSlug, String tier, int difficulty, String title, List<String> keywords,
                                   boolean hasExtra, Integer importance, List<String> concepts,
                                   @JsonInclude(JsonInclude.Include.NON_NULL) Boolean learned) {
        static QuestionSummaryResponse of(QuestionSummary q, Set<String> learned) {
            return new QuestionSummaryResponse(q.slug(), q.topicSlug(), q.tier(), q.difficulty(), q.title(), q.keywords(),
                    q.hasExtra(), q.importance(), q.concepts(), flag(learned, q.slug()));
        }

        static List<QuestionSummaryResponse> of(List<QuestionSummary> list, Set<String> learned) {
            return list.stream().map(q -> of(q, learned)).toList();
        }
    }

    record TopicResponse(TopicSummary summary, String categorySlug, String categoryName, List<SourceView> sources,
                         List<QuestionSummaryResponse> questions) {
        static TopicResponse of(TopicView t, Set<String> learned) {
            return new TopicResponse(t.summary(), t.categorySlug(), t.categoryName(), t.sources(),
                    QuestionSummaryResponse.of(t.questions(), learned));
        }
    }

    record SearchHitResponse(QuestionSummaryResponse question, String topicName, int score, List<String> matchedIn) {
        static SearchHitResponse of(SearchHit h, Set<String> learned) {
            return new SearchHitResponse(QuestionSummaryResponse.of(h.question(), learned), h.topicName(), h.score(), h.matchedIn());
        }
    }

    record SearchResponse(List<String> words, int total, List<SearchHitResponse> hits) {
        static SearchResponse of(SearchResult r, Set<String> learned) {
            return new SearchResponse(r.words(), r.total(), r.hits().stream().map(h -> SearchHitResponse.of(h, learned)).toList());
        }
    }

    record ConceptDetailResponse(ConceptView concept, List<QuestionSummaryResponse> questions) {
        static ConceptDetailResponse of(ConceptDetail d, Set<String> learned) {
            return new ConceptDetailResponse(d.concept(), QuestionSummaryResponse.of(d.questions(), learned));
        }
    }
}
