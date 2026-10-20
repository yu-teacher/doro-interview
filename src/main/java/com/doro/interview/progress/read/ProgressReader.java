package com.doro.interview.progress.read;

import java.util.Collection;
import java.util.Set;
import java.util.UUID;

/**
 * 진도의 읽기 창구. 시험(quiz)이 "체크한 질문"을 알 때 쓰는 유일한 길이다(docs/M2-PLAN.md D10): 이 패키지 밖의 progress 클래스는
 * quiz 가 쓰지 못한다(ArchUnit). JDK 타입만 반환한다.
 */
public interface ProgressReader {

    /** 주어진 slug 중 이 사용자가 체크한 것. 보이는지는 판정하지 않는다(호출자가 이미 보이는 질문만 넘긴다). */
    Set<String> learnedAmong(UUID userId, Collection<String> questionSlugs);

    /** 이 사용자가 체크한 모든 slug(닫힌 질문에 남은 옛 기록도 포함한다). */
    Set<String> learnedSlugs(UUID userId);
}
