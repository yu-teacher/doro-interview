---
slug: "aut-08"
topic: "security-auth"
tier: DEEP
difficulty: 2
title: "MFA는 무엇이고, NIST SP 800-63B의 인증 보증 수준(AAL1~3)은 어떻게 다른가요?"
keywords: ["지식·소유·고유 세 요소", "서로 다른 종류 요소 둘 이상", "AAL1 단일 요소 허용", "AAL2 두 요소와 피싱 저항 옵션", "AAL3 추출 불가 키"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://pages.nist.gov/800-63-4/sp800-63b.html", "https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html"]
concepts: [authn-authz]
importance: 1
---
**모범 답변 (30~60초)**
MFA는 아는 것, 가진 것, 자신인 것 중 서로 다른 종류의 요소를 둘 이상 함께 요구하는 방식입니다. 비밀번호와 PIN처럼 같은 종류를 두 개 쓰는 것은 MFA가 아닙니다. NIST SP 800-63B는 보증 수준을 셋으로 나눕니다. AAL1은 단일 요소도 허용하고, AAL2는 두 요소를 요구하면서 피싱 저항 수단을 선택지로 제공해야 하며, AAL3는 추출할 수 없는 키를 가진 피싱 저항 암호 인증기를 요구합니다. SMS 코드는 NIST가 제한 대상으로 분류한 인증기입니다.

(공식 문서) NIST SP 800-63B(800-63-4 체계, 2025)의 용어집은 인증 요소를 something you know, something you have, something you are 세 종류로 정의한다. 2절은 AAL1이 단일 요소 또는 다중 요소 인증을 요구하되 검증자가 다중 요소 옵션을 제공하길 권하고(SHOULD), AAL2는 서로 다른 두 요소의 증명을 요구하며 검증자가 피싱 저항 인증 옵션을 하나 이상 반드시 제공해야(SHALL) 한다고 한다. AAL3는 키 소유를 증명하는 공개키 암호 프로토콜에 기반하고, 피싱 저항이면서 추출 불가능한 키를 가진 인증기와 두 요소를 요구한다고 한다.
(공식 문서) 같은 문서 3.2.5는 OTP나 out-of-band처럼 사람이 인증기 출력을 직접 입력하는 방식은 그 출력이 특정 세션에 묶이지 않으므로 피싱 저항으로 보지 않는다고 하고, 피싱 저항은 암호 인증이 필요하다고 한다. 3.2.9의 제한 대상 인증기 설명은 이 문서 시점에 제한 대상이 PSTN(SMS·음성) 기반 out-of-band 하나뿐이며, 이를 받아들이는 CSP는 제한되지 않은 대안을 제공하고 위험을 고지해야 한다고 한다.
(원저자 자료) OWASP Multifactor Authentication Cheat Sheet는 비밀번호와 PIN처럼 같은 종류의 요소를 여러 번 요구하는 것은 MFA가 아니며 최소한의 추가 보안만 제공한다고 설명하고, 쓰는 요소들은 서로 독립적이어서 같은 공격으로 함께 뚫리지 않아야 한다고 한다.
