package com.doro.interview.quiz.read;

import java.time.Instant;
import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 시험 통계의 읽기 창구(docs/M3-PLAN.md D5). 사전 응답에 "다시 공부 후보" 표시를 합성하는 `api` 가 쓴다: 이 패키지 밖의 quiz 클래스는 쓰지 않는다.
 * JDK 타입만 반환한다. "후보" 의 나머지 조건(체크했는가)은 진도 쪽 사실이라 호출자가 {@code ProgressReader} 와 합친다.
 */
public interface QuizStatsReader {

    /** 주어진 slug 중 **마지막 출제 결과가 틀림**인 것. 이후 맞음이 한 번이라도 나왔으면 빠진다. */
    Set<String> lastWrongAmong(UUID userId, Collection<String> questionSlugs);

    /** 이 사용자의 마지막 출제 결과가 틀림인 모든 질문. */
    Set<String> lastWrong(UUID userId);

    /**
     * 마지막 출제 결과가 틀림이고 그 시각이 [{@code from}, {@code to}) 안인 질문을 사용자별로 모은다(복습 알림이 쓴다).
     * 틀림이 마지막 결과일 때 {@code last_asked_at} 은 그 틀린 시각이다(건너뛰기는 통계를 바꾸지 않는다).
     */
    Map<UUID, Set<String>> lastWrongAskedBetween(Instant from, Instant to);
}
