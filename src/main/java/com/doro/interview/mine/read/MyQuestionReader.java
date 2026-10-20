package com.doro.interview.mine.read;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 내 질문의 읽기 창구. 체크(progress)와 시험(quiz)이 "이 사용자의 질문"을 알 때 쓰는 유일한 길이다(docs/M4-PLAN.md D8):
 * 이 패키지 밖의 mine 클래스는 그쪽에서 쓰지 못한다(ArchUnit). 모든 조회는 사용자 id 를 받고 남의 질문은 돌려주지 않는다.
 */
public interface MyQuestionReader {

    /** 내 질문의 slug 는 이 접두사로 시작한다(공용 질문 slug 와 겹치지 않는다). */
    String SLUG_PREFIX = "my-";

    /** 시험 범위에서 "내 질문" 을 고르는 가짜 주제 slug. 공용 주제 slug 는 이 문자를 쓰지 못한다. */
    String PSEUDO_TOPIC = "@mine";

    /** 시험 풀의 한 항목. */
    record PoolEntry(String slug, String tier) {
    }

    /** 제목 조회 결과(후보·현황·시험 문항 표시용). */
    record Heading(String slug, String title, String tier) {
    }

    /** 이 사용자의 질문이면 true. 없거나 남의 것이면 false. */
    boolean exists(UUID userId, String slug);

    /** 이 사용자의 모든 질문(시험 풀 후보). */
    List<PoolEntry> poolEntries(UUID userId);

    /** 이 사용자의 질문이면 내가 적은 답(없으면 빈 문자열), 아니면 비어 있음. */
    java.util.Optional<String> answerText(UUID userId, String slug);

    /** 주어진 slug 중 이 사용자의 질문만 제목과 함께. */
    Map<String, Heading> headings(UUID userId, Collection<String> slugs);
}
