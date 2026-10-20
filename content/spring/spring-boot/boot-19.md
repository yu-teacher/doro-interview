---
slug: "boot-19"
topic: "spring-boot"
tier: TRICKY
difficulty: 3
title: "자동 설정이 어떤 빈을 만들었는지, 혹은 왜 안 만들었는지 어떻게 확인하나요?"
keywords: ["--debug", "conditions report", "exclude"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
"`--debug` 옵션이나 `debug=true`로 실행하면 조건 평가 리포트가 콘솔에 출력되어, 어떤 자동 설정이 적용됐고 어떤 조건 때문에 빠졌는지 볼 수 있습니다. 그래도 원치 않는 자동 설정이 있으면 `exclude`로 제외합니다. 주의할 점은 이 `--debug`가 앱의 모든 로그를 DEBUG로 바꾸는 것이 아니라 일부 핵심 로거만 올린다는 것입니다. Actuator를 쓰고 있다면 conditions 엔드포인트가 있다는 정도로 덧붙일 수 있습니다."

- 공식 문서: `--debug`로 조건 리포트 출력, 로깅 문서에서 debug 모드는 선택된 핵심 로거만 올림.
- (보충) Actuator의 `conditions` 엔드포인트는 이번에 확인하지 않은 일반 지식이다.
