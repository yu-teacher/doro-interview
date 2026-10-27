---
slug: "aws-21"
topic: "cloud-aws"
tier: BASIC
difficulty: 1
title: "CloudWatch는 무엇을 하는 서비스이고, EC2의 메모리 사용률은 기본으로 볼 수 있나요?"
keywords: ["지표·경보·대시보드·로그", "EC2 기본 지표 5분 간격", "상세 모니터링 1분 간격", "메모리는 에이전트로 수집", "경보로 알림과 자동 조치"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html", "https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html", "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/viewing_metrics_with_cloudwatch.html", "https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Install-CloudWatch-Agent.html", "https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/metrics-collected-by-CloudWatch-agent.html"]
concepts: [observability]
importance: 2
---
**모범 답변 (30~60초)**
CloudWatch는 AWS 리소스와 애플리케이션을 실시간으로 모니터링하는 서비스로, 지표를 모으고 대시보드로 보여 주고, 지표가 임계값을 넘으면 알림이나 자동 조치를 실행하는 경보와 로그 수집을 제공합니다. 경보의 동작으로는 SNS 알림, EC2 작업, Auto Scaling 작업 등이 있습니다. EC2는 기본으로 CPU 사용률, 디스크, 네트워크 같은 지표를 5분 단위로 보내고, 상세 모니터링을 켜면 1분 단위가 됩니다. 그런데 EC2 지표 목록에는 메모리 사용률이 없어서, 인스턴스 안의 메모리 같은 시스템 지표는 CloudWatch 에이전트를 설치해 수집해야 하고, 에이전트는 `mem_used_percent` 같은 지표를 보냅니다.

(공식 문서) CloudWatch 소개 페이지는 AWS 리소스와 애플리케이션을 실시간 모니터링하고, 지표·경보·대시보드·로그를 제공하며 많은 서비스가 기본 지표를 자동으로 보낸다고 한다. 경보 페이지는 임계값 초과 시 SNS 알림, EC2 작업, Auto Scaling 작업 등을 수행할 수 있다고 한다.
(공식 문서) EC2 지표 페이지는 기본적으로 데이터 포인트가 5분 단위이고 상세 모니터링을 켜면 1분 단위라고 한다. 이 페이지의 AWS/EC2 인스턴스 지표 목록에는 CPU, 디스크, 네트워크 등은 있으나 메모리 지표 항목은 없었다(페이지 본문에 memory라는 단어가 없음을 확인했다). CloudWatch 에이전트 페이지는 에이전트가 기본 모니터링보다 폭넓게 인스턴스 안의 시스템 수준 지표를 수집한다고 하고, 에이전트가 수집하는 지표 목록에 `mem_used_percent`가 있다.
실험하지 않았다. 클라우드 계정이 없어 문서 근거로만 썼다.
