---
slug: "vul-15"
topic: "security-web-vuln"
tier: DEEP
difficulty: 2
title: "취약하거나 오래된 구성요소(의존성)는 왜 위험하고, 어떻게 관리하나요?"
keywords: ["전이 의존성까지 버전 파악", "소프트웨어 구성 분석 도구", "패치 버전으로 업그레이드", "사용하지 않는 의존성 제거", "공식 저장소에서만 받기"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://owasp.org/Top10/2021/A06_2021-Vulnerable_and_Outdated_Components/index.html", "https://cheatsheetseries.owasp.org/cheatsheets/Vulnerable_Dependency_Management_Cheat_Sheet.html"]
concepts: [dependency-management, web-security]
importance: 2
links: [{to: "bld-05", kind: RELATED}]
---
**모범 답변 (30~60초)**
라이브러리와 프레임워크는 보통 애플리케이션과 같은 권한으로 실행되기 때문에, 그 안의 취약점은 곧 서비스의 취약점이 됩니다. 그래서 직접 쓰는 것뿐 아니라 전이 의존성까지 사용 중인 버전을 목록으로 파악하고, OWASP Dependency-Check 같은 소프트웨어 구성 분석 도구와 CVE·NVD 공지로 계속 점검해야 합니다. 쓰지 않는 의존성은 제거하고, 공식 저장소에서 보안 연결로 받고, 패치가 나오면 위험도에 따라 제때 올립니다. 패치 버전이 있으면 먼저 테스트 환경에서 올려 테스트가 통과하는지 보고 운영에 반영하며, 아직 패치가 없으면 영향받는 기능을 막거나 임시로 감싸는 완화책을 씁니다.

(원저자 자료) OWASP Top 10:2021 A06 페이지는 구성요소가 보통 애플리케이션과 같은 권한으로 실행되어 결함이 심각한 영향으로 이어진다고 하고, 직접 쓰는 것과 중첩된 의존성 모두의 버전을 모르거나, 지원이 끝난 소프트웨어를 쓰거나, 정기 점검과 위험 기반의 적시 패치를 하지 않으면 취약하다고 본다. 예방으로는 쓰지 않는 의존성 제거, 버전의 지속적 목록화와 CVE·NVD 모니터링(Dependency-Check, retire.js, 소프트웨어 구성 분석 도구), 공식 소스에서 보안 연결로 받기, 서명된 패키지 선호, 유지보수가 끊긴 구성요소에 대한 가상 패치를 든다. 대표 사례로 Struts 2 원격 코드 실행(CVE-2017-5638)을 든다.
(원저자 자료) Vulnerable Dependency Management Cheat Sheet는 패치된 버전이 나왔으면 테스트 환경에서 의존성을 올려 테스트가 모두 통과하면 운영에 반영하라는 절차(Case 1)를 제시하고, 전이 의존성이 문제면 보통 직접 의존성 쪽에서 조치하라고 한다. 제공자의 패치가 몇 달 걸리는 경우에는 우회책이나 입력 검증 래퍼를 임시 완화로 쓰되, 영향 경로를 분석해 래퍼가 모든 호출 경로에서 조건을 막는지 확인해야 하고 영구 해결은 업그레이드나 교체로 추적하라고 한다.
