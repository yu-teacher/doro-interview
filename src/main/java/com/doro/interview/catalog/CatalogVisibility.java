package com.doro.interview.catalog;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 무엇이 바깥에 보이는가를 정하는 **유일한 곳**(docs/M1-PLAN.md D3·D4). 모든 조회 SQL 이 이 조건을 쓴다.
 *
 * <ul>
 *   <li>주제는 {@code published} 일 때만 보인다.</li>
 *   <li>질문은 보이는 주제에 속하고 닫히지 않았을({@code retired_at IS NULL}) 때만 보인다.</li>
 *   <li>개발용 스위치 {@code interview.catalog.expose-unpublished} 가 켜져 있으면 비공개 주제도 보인다. 닫힌 질문은 그래도 안 보인다.
 *       운영(prod)에서는 켜지면 기동을 거부한다(S4).</li>
 * </ul>
 */
@Component
public class CatalogVisibility {

    private final boolean exposeUnpublished;

    public CatalogVisibility(@Value("${interview.catalog.expose-unpublished:false}") boolean exposeUnpublished) {
        this.exposeUnpublished = exposeUnpublished;
    }

    public boolean exposeUnpublished() {
        return exposeUnpublished;
    }

    /** 주제가 보이는 조건(SQL). */
    public String topicVisible(String topicAlias) {
        return exposeUnpublished ? "TRUE" : topicAlias + ".published";
    }

    /** 질문이 보이는 조건(SQL). */
    public String questionVisible(String questionAlias, String topicAlias) {
        return "(" + topicVisible(topicAlias) + " AND " + questionAlias + ".retired_at IS NULL)";
    }
}
