package com.doro.interview.api;

import com.doro.interview.catalog.CatalogReader;
import com.doro.interview.catalog.CatalogViews.QuestionHeading;
import com.doro.interview.mine.read.MyQuestionReader;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 시험·후보·현황 화면의 질문 제목 조회: 공용 질문(보이는 것)과 **이 사용자의 내 질문**을 한 지도로 합친다(docs/M4-PLAN.md S3).
 * 내 질문은 가짜 주제 {@code @mine}("내 질문")에 속한다. 남의 내 질문과 지워진 질문은 지도에 없다.
 */
@Component
class QuestionHeadings {

    static final String MINE_TOPIC_NAME = "내 질문";

    private final CatalogReader catalog;
    private final MyQuestionReader mine;

    QuestionHeadings(CatalogReader catalog, MyQuestionReader mine) {
        this.catalog = catalog;
        this.mine = mine;
    }

    Map<String, QuestionHeading> of(UUID userId, Collection<String> slugs) {
        Map<String, QuestionHeading> out = new LinkedHashMap<>(catalog.visibleQuestionHeadings(slugs));
        mine.headings(userId, slugs).forEach((slug, h) ->
                out.put(slug, new QuestionHeading(slug, h.title(), h.tier(), MyQuestionReader.PSEUDO_TOPIC, MINE_TOPIC_NAME)));
        return out;
    }
}
