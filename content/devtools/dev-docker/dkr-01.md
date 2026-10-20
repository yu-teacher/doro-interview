---
slug: "dkr-01"
topic: "dev-docker"
tier: BASIC
difficulty: 1
title: "컨테이너와 가상 머신(VM)은 무엇이 다른가요?"
keywords: ["격리된 프로세스", "호스트 커널 공유", "VM은 자체 커널", "더 적은 인프라로 더 많은 앱", "커널 네임스페이스"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/", "https://docs.docker.com/get-started/docker-overview/"]
---
**모범 답변 (30~60초)**
컨테이너는 앱과 실행에 필요한 파일을 묶어 격리된 프로세스로 실행하는 방식이고, VM은 자체 커널과 하드웨어 드라이버까지 갖춘 운영체제 전체를 띄우는 방식입니다. 그래서 컨테이너는 모두 같은 커널을 공유하며, 앱 하나를 격리하려고 VM을 띄우는 것보다 오버헤드가 적고 같은 인프라에서 더 많은 앱을 돌릴 수 있습니다. 격리는 리눅스 커널의 네임스페이스 기능으로 만듭니다. 다만 커널을 공유하므로 VM보다 격리 경계가 얇다는 점은 알아 두어야 하고, 실무에서는 클라우드 VM 위에 컨테이너를 올려 둘을 함께 쓰는 경우가 많습니다.

(공식 문서) get-started 의 What is a container 페이지는 컨테이너를 앱 구성 요소마다 격리된 프로세스로 설명하고, VM은 자체 커널·하드웨어 드라이버·프로그램을 가진 운영체제 전체이고 앱 하나를 격리하려고 VM을 띄우면 오버헤드가 크며, 컨테이너들은 같은 커널을 공유해 더 적은 인프라로 더 많은 앱을 돌릴 수 있다고 비교한다. 클라우드에서는 VM에 컨테이너 런타임을 올려 여러 컨테이너 앱을 돌리는 식으로 함께 쓴다고도 한다. Docker overview 는 Docker가 격리된 작업 공간인 컨테이너를 만들 때 리눅스 커널의 namespaces 기능을 쓰고, 컨테이너마다 네임스페이스 집합이 만들어지며 각 측면이 별도 네임스페이스에서 돈다고 설명한다.
(실험 확인) Docker Engine 29.6.1(macOS의 Docker Desktop)에서 2026-10-20 재실행으로 확인했다. busybox:1.36 컨테이너의 `uname -sr` 은 `Linux 6.12.76-linuxkit`, 호스트 macOS의 `uname -sr` 은 `Darwin 25.6.0` 이었다. 이 환경의 컨테이너는 호스트 macOS 커널이 아니라 Docker Desktop이 쓰는 리눅스 커널 위에서 도는 것이다. 컨테이너 안의 `ps` 에는 PID 1인 `ps` 자신만 보였고(PID 네임스페이스), 로컬에 이미지가 있을 때 `docker run --rm busybox:1.36 echo hi` 전체가 0.2초대(재실행 0.25초)였다(이 PC에서 잰 값이며 환경마다 다르다).
(보충) "커널을 공유하므로 VM보다 격리 경계가 얇다"는 말은 공식 문서의 커널 공유 설명에서 이끌어 낸 일반 설명이며, 문서가 이 표현으로 직접 비교하지는 않는다.
