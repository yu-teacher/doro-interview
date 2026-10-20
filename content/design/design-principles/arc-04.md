---
slug: "arc-04"
topic: "design-principles"
tier: BASIC
difficulty: 1
title: "12-Factor 앱의 열두 가지 요소는 무엇이고, 무엇을 위한 방법론인가요?"
keywords: ["서비스형 소프트웨어 방법론", "설정은 환경에 저장", "무상태 프로세스", "로그는 이벤트 스트림", "빌드·릴리스·실행 분리"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://12factor.net/", "https://12factor.net/build-release-run", "https://12factor.net/logs"]
concepts: [externalized-config]
importance: 2
links: [{to: "arc-12", kind: FOLLOWUP}, {to: "boot-07", kind: RELATED}, {to: "cic-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
12-Factor는 서비스형 소프트웨어를 만들 때 쓰는 방법론으로, 특정 언어나 백엔드 서비스 조합에 묶이지 않고 클라우드 배포와 확장을 쉽게 하려는 열두 가지 요소입니다. 코드베이스는 하나에 여러 배포, 의존성은 명시하고 격리, 설정은 환경에 저장, 백엔드 서비스는 붙였다 뗄 수 있는 자원으로 취급, 빌드·릴리스·실행 단계 분리, 프로세스는 무상태, 포트 바인딩으로 서비스 노출, 프로세스 모델로 수평 확장, 빠른 시작과 우아한 종료, 개발과 운영의 유사성 유지, 로그는 이벤트 스트림, 관리 작업은 일회성 프로세스로 실행합니다.

(공식 자료) 12factor.net 첫 페이지의 Introduction과 The Twelve Factors 목록(I~XII)을 근거로 한다. 이 방법론은 선언적 형식, 운영체제와의 깨끗한 계약, 클라우드 플랫폼 배포 적합성, 개발·운영 격차 최소화, 큰 변화 없는 확장을 목표로 하고 어떤 언어로 짠 앱에도 적용된다고 설명한다. 저자들은 Heroku 플랫폼에서의 경험을 종합했다고 밝힌다.
(공식 자료) V장 Build, release, run은 빌드가 코드를 실행 번들로 바꾸고, 릴리스가 빌드에 배포별 설정을 결합하며, 런 단계가 릴리스를 실행하는 세 단계를 엄격히 나누라고 하고, 릴리스는 불변이며 고유 ID를 가져야 한다고 한다. XI장 Logs는 앱이 로그 파일 관리나 라우팅을 하지 말고 이벤트 스트림을 stdout으로 내보내면 실행 환경이 수집한다고 한다.
