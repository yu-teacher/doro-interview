---
slug: "misc-16"
topic: "spring-misc"
tier: TRICKY
difficulty: 3
title: "RestTemplate을 쓰는 기존 코드는 어떻게 이전하나요?"
keywords: ["`RestClient.create(restTemplate)`", "마이그레이션 가이드", "공유 `ClientHttpRequestFactory`", "기본 구현 차이"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
한 번에 바꿀 필요 없이 `RestClient.create(restTemplate)`로 기존 RestTemplate의 설정과 인터셉터를 재사용하는 RestClient를 만들 수 있습니다. 공식 문서에 "Migrating to RestClient" 가이드가 있고 RestTemplate의 메서드와 RestClient 메서드의 대응표가 들어 있다고 합니다. 두 클라이언트는 같은 `ClientHttpRequestFactory`를 공유하고 예외도 `RestClientException` 계층이라서 이전 부담이 작습니다. 다만 기본 HTTP 라이브러리가 다르므로(RestClient는 JDK HttpClient, RestTemplate은 HttpURLConnection) 타임아웃 등을 확인해야 합니다.

(공식) Framework 7.0 REST clients 문서에서 확인.
