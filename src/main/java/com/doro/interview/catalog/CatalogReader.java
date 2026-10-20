package com.doro.interview.catalog;

import com.doro.interview.catalog.CatalogViews.CategoryView;
import com.doro.interview.catalog.CatalogViews.QuestionView;
import com.doro.interview.catalog.CatalogViews.TopicView;

import java.util.List;
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
}
