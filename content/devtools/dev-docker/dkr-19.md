---
slug: "dkr-19"
topic: "dev-docker"
tier: TRICKY
difficulty: 2
title: "큰 파일을 만든 다음 RUN rm으로 지웠는데 이미지 크기가 그대로인 이유는 무엇인가요?"
keywords: ["레이어는 불변", "삭제는 새 레이어에 기록", "앞 레이어 크기 유지", "같은 RUN에서 정리", "멀티 스테이지로 해결"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.docker.com/get-started/docker-concepts/building-images/understanding-image-layers/", "https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/", "https://docs.docker.com/build/building/best-practices/", "https://docs.docker.com/build/building/multi-stage/"]
---
**모범 답변 (30~60초)**
이미지 레이어는 한번 만들어지면 바뀌지 않고, 각 레이어는 파일의 추가·수정·삭제 변경분을 담습니다. 그래서 한 `RUN` 에서 큰 파일을 만들고 다음 `RUN rm` 으로 지우면 삭제는 새 레이어에 기록될 뿐이고, 파일이 들어 있는 앞 레이어는 그대로 이미지에 남아 크기가 줄지 않습니다. 임시 파일은 만든 것과 같은 `RUN` 안에서 `&&` 로 이어 지워야 레이어에 남지 않습니다. 공식 문서가 `apt-get` 캐시를 같은 `RUN` 에서 지우라고 하는 것도 같은 이유이고, 멀티 스테이지로 필요한 결과물만 옮겨도 해결됩니다.

```dockerfile
# A: 크기가 줄지 않는다
RUN dd if=/dev/urandom of=/big.bin bs=1M count=30
RUN rm /big.bin

# B: 같은 RUN 에서 지운다
RUN dd if=/dev/urandom of=/big.bin bs=1M count=30 && rm /big.bin
```

(공식 문서) Understanding the image layers 페이지는 각 레이어가 파일 시스템의 추가·삭제·수정 변경을 담고 한번 만들어지면 불변이라고 한다. What is an image 페이지도 이미지가 불변이고 변경은 위에 새로 쌓는 것뿐이라고 한다. best-practices 페이지는 `apt-get update` 와 `install` 을 같은 RUN에서 하고 `/var/lib/apt/lists` 를 지우면 apt 캐시가 레이어에 저장되지 않아 이미지가 작아진다고 하며, ENV 예시에서는 뒤 레이어에서 지워도 앞 레이어의 값이 남는다고 한다. 멀티 스테이지 빌드는 최종 이미지에 필요한 것만 남긴다고 한다.
(실험 확인) busybox:1.36 기반으로 30MB 임의 파일을 만든 뒤, A처럼 다음 `RUN rm` 으로 지운 이미지와 B처럼 같은 `RUN` 에서 지운 이미지를 비교했다(Docker Engine 29.6.1). `docker images` 의 SIZE는 A가 69.1MB, B가 6.15MB였다(busybox:1.36은 6.14MB). A는 컨테이너에서 `/big.bin` 이 보이지 않지만 `docker history` 에 31.5MB 레이어가 남았고, `docker save` 로 내보낸 tar의 레이어 중 하나에 31,457,280바이트의 `big.bin` 이 그대로 들어 있었다.
(보충) 그래서 비밀 파일을 `COPY` 한 뒤 다음 `RUN` 에서 지워도 앞 레이어에 남아 꺼낼 수 있다는 점은 위 실험에서 유추한 일반 설명이다.
