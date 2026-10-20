---
slug: "dst-15"
topic: "design-distributed"
tier: DEEP
difficulty: 2
title: "BFF(Backends for Frontends)는 API 게이트웨이와 무엇이 다른가요?"
keywords: ["UI 경험마다 백엔드 하나", "범용 API 백엔드의 병목", "UI 팀이 BFF를 소유", "다중 다운스트림 호출과 부분 실패", "BFF 사이 중복과 결합"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://samnewman.io/patterns/architectural/bff/", "https://microservices.io/patterns/apigateway.html"]
concepts: [msa-boundary]
importance: 1
links: [{to: "dst-05", kind: PREREQ}]
---
**모범 답변 (30~60초)**
BFF는 사용자 경험(UI)마다 서버 쪽 백엔드를 하나씩 두는 패턴으로, Sam Newman이 정리했습니다. Richardson은 이를 클라이언트 종류마다 API 게이트웨이를 따로 두는 게이트웨이 패턴의 변형으로 설명하니, 둘은 대립이 아니라 게이트웨이를 하나로 쓰느냐 클라이언트별로 나누느냐의 차이입니다. Newman은 범용 API 백엔드 하나가 여러 UI를 지원하면 변경이 한 배포 단위에 몰려 병목이 되고 전담 팀이 생긴다고 봅니다. BFF는 한 UI만을 위한 작은 백엔드라서 UI 팀이 함께 소유해 API와 UI를 같이 바꿀 수 있고, 여러 서비스 호출의 병렬화와 부분 실패 처리도 맡습니다. BFF끼리 생기는 중복을 공유 라이브러리로 풀면 결합이 생기니 조심해야 합니다.

(원저자 자료) Newman의 "Pattern: Backends For Frontends"(2015-11-18)는 범용 API 백엔드가 모바일 등 새 UI를 수용하며 비대해지고 배포 병목과 전담 팀이 생기는 문제를 설명하고, REA와 SoundCloud에서 본 해법으로 UI 경험마다 하나의 백엔드를 두는 것을 소개한다(이름은 SoundCloud의 Phil Calçado가 붙였다고 쓴다). BFF는 한 UI에 밀접하고 작으며 보통 UI 팀이 유지한다. 몇 개를 둘지는 "경험 하나에 BFF 하나"가 지침이며, 팀 구조가 큰 요인이라고 한다. 한 호출이 여러 다운스트림 서비스 호출로 이어져 병렬화와 부분 실패 처리(예: 재고 서비스가 죽으면 재고 표시만 빼고 응답)가 중요하며 클라이언트도 부분 응답을 처리해야 한다고 쓴다. BFF 사이 중복에 대해 저자는 서비스 사이의 중복에는 비교적 관대하며, BFF들을 다시 범용 집계 API로 합치면 여러 관심사가 뒤섞인 비대한 코드가 되곤 했다고 주장한다. 인증 같은 범용 관심사를 BFF에 넣는 것에는 저자도 망설인다고 쓴다. 웹 UI 전용이라면 서버 쪽 집계가 많을 때만 BFF가 의미 있을 것이라고 저자는 추측한다("I suspect").
(원저자 자료) Richardson의 "API Gateway / Backends for Frontends"는 BFF를 클라이언트 종류마다 별도 API 게이트웨이를 두는 API 게이트웨이 패턴의 변형으로 정의한다.
