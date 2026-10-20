package com.doro.interview.catalog;

import com.doro.interview.catalog.CatalogViews.CategoryView;
import com.doro.interview.catalog.CatalogViews.ConceptDetail;
import com.doro.interview.catalog.CatalogViews.ConceptView;
import com.doro.interview.catalog.CatalogViews.QuestionIndexEntry;
import com.doro.interview.catalog.CatalogViews.QuestionView;
import com.doro.interview.catalog.CatalogViews.SearchResult;
import com.doro.interview.catalog.CatalogViews.TopicView;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 사전의 읽기 창구. 다른 모듈(api)은 이 인터페이스만 쓴다. 보이지 않는 것(비공개 주제·닫힌 질문)은 없는 것과 같다:
 * 빈 목록이거나 {@link Optional#empty()} 이며, 존재 여부를 구분할 수 없다.
 */
public interface CatalogReader {

    /** 공개 주제가 있는 카테고리만, 주제를 포함해서. 카테고리·주제 정렬 순서대로. */
    List<CategoryView> categories();

    Optional<TopicView> topic(String slug);

    Optional<QuestionView> question(String slug);

    /** 보이는 질문만 검색한다(제목·키워드·개념 이름·본문, 부분 일치, 단어는 AND). 점수 순, 동점은 사전 순서. */
    SearchResult search(SearchQuery query);

    /** 보이는 질문이 하나라도 있는 개념만(비공개 질문에만 붙은 개념은 나타나지 않는다). 사전 순서. */
    List<ConceptView> concepts();

    /** 보이는 질문이 없는 개념은 없는 것과 같다. */
    Optional<ConceptDetail> concept(String slug);

    /** 이 질문이 보이는가(보이는 주제의 닫히지 않은 질문). 진도·노트가 "없는 것과 같은" 404 를 판정하는 한 곳이다. */
    boolean isVisibleQuestion(String slug);

    /** 보이는 주제의 보이는 질문 slug(주제 안 표시 순서). 보이지 않는 주제는 {@link Optional#empty()}. */
    Optional<List<String>> visibleQuestionSlugs(String topicSlug);

    /** 보이는 모든 주제 → 보이는 질문 slug(주제 정렬 순서). 진도 요약의 분모다. */
    Map<String, List<String>> visibleQuestionSlugsByTopic();

    /** 보이는 모든 질문의 (slug, 주제, 카테고리, tier) — 카테고리·주제·tier·질문 순서. 시험이 "보이는 질문 ∩ 내 체크" 풀을 만들 때 쓴다. */
    List<QuestionIndexEntry> visibleQuestionIndex();
}
