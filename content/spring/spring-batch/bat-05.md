---
slug: "bat-05"
topic: "spring-batch"
tier: BASIC
difficulty: 1
title: "Tasklet 방식은 무엇이고, 청크 방식과 언제 각각 쓰나요?"
keywords: ["execute를 반복 호출", "호출마다 트랜잭션", "프로시저·파일 삭제 같은 단일 작업", "대량 읽기·변환·쓰기는 청크"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-batch/reference/step/tasklet.html"]
concepts: [batch-chunk-processing]
importance: 2
links: [{to: "bat-04", kind: PREREQ}]
---
**모범 답변 (30~60초)**
Tasklet은 execute 메서드 하나를 가진 인터페이스이고, TaskletStep은 이 메서드가 FINISHED를 반환하거나 예외를 던질 때까지 반복 호출하며 호출마다 트랜잭션으로 감쌉니다. 저장 프로시저 호출, 스크립트 실행, 디렉터리 파일 삭제처럼 읽기·처리·쓰기 반복 모양이 아닌 단일 작업에 어울립니다. 반대로 많은 레코드를 읽어 변환해 쓰는 일은 청크 방식이 맞습니다. 문서도 프로시저 호출을 reader로 억지로 만들면 아무 일도 하지 않는 writer가 필요해 부자연스럽다고 설명합니다.

(공식 문서) TaskletStep 페이지는 청크 지향 처리가 Step을 처리하는 유일한 방법은 아니라며 저장 프로시저 호출을 예로 든다. 이를 ItemReader가 프로시저를 돌리고 null을 반환하게 만들 수도 있지만 아무 일도 하지 않는 ItemWriter가 있어야 해 부자연스럽다고 한다. Tasklet의 execute는 RepeatStatus.FINISHED를 반환하거나 예외를 던질 때까지 TaskletStep이 반복 호출하고 각 호출이 트랜잭션으로 감싸진다. 저장 프로시저, 스크립트, SQL 갱신문과 디렉터리 파일 삭제 예제가 나온다.
(실험하지 않았다) 문서 근거로만 썼다.
