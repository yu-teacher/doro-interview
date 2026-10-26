---
slug: "bat-01"
topic: "spring-batch"
tier: BASIC
difficulty: 1
title: "배치 처리는 무엇이고, Spring Batch는 어떤 문제를 풀어 주는 프레임워크인가요?"
keywords: ["사용자 개입 없는 대량 처리", "읽기·처리·쓰기 반복", "트랜잭션·재시작·스킵 제공", "스케줄러가 아님"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-batch/reference/spring-batch-intro.html"]
concepts: [batch-job-metadata]
importance: 3
links: [{to: "bat-02", kind: FOLLOWUP}, {to: "bat-04", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
배치 처리는 사용자 개입 없이 많은 양의 데이터를 한꺼번에 읽고 가공해 저장하는 처리입니다. 월말 정산처럼 시간에 맞춰 도는 작업, 큰 데이터 집합에 업무 규칙을 반복 적용하는 작업, 외부 시스템에서 받은 데이터를 검증해 시스템에 넣는 작업이 대표적입니다. Spring Batch는 이런 작업의 공통 골격인 읽기·처리·쓰기 반복과 함께 트랜잭션 관리, 실행 통계, 재시작, 스킵, 리소스 관리를 재사용 가능한 형태로 제공합니다. 다만 스케줄러는 아니어서 언제 돌릴지는 Quartz나 Control-M 같은 스케줄러가 정합니다.

(공식 문서) Spring Batch Introduction 페이지는 대량 처리가 필요한 업무를 사용자 개입 없이 대량 정보를 처리하는 일, 큰 데이터 집합에 복잡한 규칙을 반복 적용하는 일, 내외부 시스템에서 받은 정보를 검증·가공해 기록 시스템에 넣는 일로 설명한다. 프레임워크가 로깅·추적, 트랜잭션 관리, 잡 처리 통계, 재시작, 스킵, 리소스 관리를 제공한다고 하고, 스케줄링 프레임워크가 아니며 Quartz, Tivoli, Control-M 같은 스케줄러를 대체하지 않고 함께 쓰도록 만들었다고 밝힌다. 전형적인 배치 프로그램은 많은 레코드를 읽고, 처리하고, 바꾼 형태로 다시 쓴다고 정리한다.
(실험하지 않았다) 실행 환경에 Spring Batch를 설치할 수 없어 문서 근거로만 썼다.
