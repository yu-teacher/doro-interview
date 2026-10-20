---
slug: "misc-15"
topic: "spring-misc"
tier: TRICKY
difficulty: 3
title: "가상 스레드를 켜면 `@Async`와 스케줄러는 어떻게 되나요?"
keywords: ["풀 설정 무효", "`spring.main.keep-alive`", "동시성 제한 대체 수단", "`@ConcurrencyLimit`"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
Boot 레퍼런스에 따르면 가상 스레드를 켜면 스레드 풀 관련 설정이 더 이상 효과가 없습니다. 그리고 `@Scheduled` 빈만으로 앱이 유지되는 경우 JVM이 데몬 스레드만 남아 종료될 수 있어서 `spring.main.keep-alive=true`를 쓰라고 안내합니다. 즉 켜는 것 자체는 한 줄이지만, 기존에 스레드 풀 크기로 동시성을 제한하던 곳은 다른 방법(예: Spring 7의 `@ConcurrencyLimit`)으로 제한해야 할 수 있습니다.

(공식) Boot 레퍼런스(`spring-application`)의 가상 스레드 항목과 Framework 7.0 릴리스 노트의 `@ConcurrencyLimit` 설명에서 확인했다. 두 기능을 연결한 조언은 (보충)이다.
