---
slug: "aws-07"
topic: "cloud-aws"
tier: BASIC
difficulty: 1
title: "EC2 인스턴스 유형(타입)은 어떻게 고르고, 요금 옵션에는 어떤 것이 있나요?"
keywords: ["패밀리별 CPU·메모리 구성", "범용·컴퓨팅·메모리 최적화", "T 계열 CPU 크레딧", "온디맨드", "Savings Plans와 예약 인스턴스", "스팟은 중단될 수 있음"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html", "https://docs.aws.amazon.com/ec2/latest/instancetypes/instance-types.html", "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-purchasing-options.html"]
concepts: [cloud-fundamentals]
importance: 2
---
**모범 답변 (30~60초)**
인스턴스 유형은 CPU, 메모리, 스토리지, 네트워크 용량의 조합이 다른 구성이고, 범용·컴퓨팅 최적화·메모리 최적화·스토리지 최적화·가속 컴퓨팅 같은 패밀리로 묶여 있어서 애플리케이션 요구에 맞는 패밀리를 고릅니다. T 계열은 기준 CPU 성능에 크레딧으로 버스트하는 방식이라 웹 서버나 개발·테스트 환경 같은 일반적인 워크로드에 맞고, 높은 CPU를 계속 써야 하면 고정 성능 인스턴스를 권장합니다. 요금은 약정 없이 초 단위로 내는 온디맨드, 1년이나 3년 사용량이나 구성을 약정해 비용을 줄이는 Savings Plans와 예약 인스턴스, 남는 용량을 싸게 쓰지만 중단될 수 있는 스팟이 대표적입니다.

(공식 문서) EC2 인스턴스 유형 페이지는 인스턴스 유형이 호스트 하드웨어를 정하고 CPU·메모리·스토리지 능력별로 패밀리로 묶인다고 한다. 고정 성능 인스턴스는 필요한 만큼 계속 전체 CPU 성능을 내고, T 버스터블 인스턴스는 기준 성능과 CPU 크레딧 기반 버스트를 제공하며 기준을 밑돌면 크레딧을 얻는다고 한다.
(공식 문서) 청구 옵션 페이지는 온디맨드(초 단위), Savings Plans(시간당 USD 사용량을 1년·3년 약정), 예약 인스턴스(인스턴스 구성 약정), 스팟(미사용 인스턴스, 중단 가능하면 비용 효율적), Dedicated Hosts·Instances, 용량 예약을 나열한다. 인스턴스 유형 목록은 세대마다 계속 바뀌므로 특정 유형명은 외우지 말고 패밀리 개념을 기준으로 삼는다.
실험하지 않았다. 클라우드 계정이 없어 문서 근거로만 썼다.
