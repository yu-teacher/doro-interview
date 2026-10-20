package com.doro.interview.mine.read;

import java.util.UUID;

/**
 * 사용자가 내 질문을 지웠을 때 같은 트랜잭션에서 발행되는 이벤트(docs/M4-PLAN.md D9). 체크(progress)와 시험 통계(quiz)가 듣고
 * 그 slug 의 자기 행을 지운다. 지난 시험 문항(quiz_item)은 남긴다(질문이 사라진 문항은 M3 에서 이미 안전하게 다룬다).
 */
public record MyQuestionDeleted(UUID userId, String slug) {
}
