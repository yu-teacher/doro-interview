---
slug: "cic-19"
topic: "dev-cicd"
tier: TRICKY
difficulty: 3
title: "컨테이너에 `docker stop`을 했는데 Spring Boot가 graceful shutdown을 하지 못하고 제한 시간 뒤 강제 종료된다면 원인은 무엇인가요?"
keywords: ["셸 형식 ENTRYPOINT", "/bin/sh -c 아래의 자식 프로세스", "SIGTERM 미전달", "exec 형식 사용", "제한 시간 뒤 SIGKILL"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.docker.com/reference/dockerfile/", "https://docs.spring.io/spring-boot/reference/web/graceful-shutdown.html"]
concepts: [graceful-shutdown, container]
importance: 2
links: [{to: "cic-14", kind: PREREQ}, {to: "dkr-16", kind: RELATED}]
---
**모범 답변 (30~60초)**
셸 형식으로 쓴 ENTRYPOINT가 원인일 가능성이 큽니다. `ENTRYPOINT java -jar app.jar`처럼 쓰면 Docker가 `/bin/sh -c`로 실행하는데, 공식 문서에 따르면 이 셸은 신호를 전달하지 않아서 자바가 PID 1이 되지 못하고 `docker stop`의 SIGTERM을 받지 못합니다. 그러면 Spring Boot의 종료 훅이 돌지 않고 제한 시간 뒤 SIGKILL로 강제 종료되어 처리 중이던 요청이 끊깁니다. 해결은 `ENTRYPOINT ["java", "-jar", "app.jar"]`처럼 exec 형식을 쓰거나, 셸 형식이라면 `exec java -jar app.jar`로 시작해 자바가 PID 1이 되게 하는 것입니다. 셸에 따라 명령이 하나면 알아서 바꿔 주기도 하지만 문서가 보장하지는 않습니다.

```dockerfile
ENTRYPOINT ["java", "-jar", "app.jar"]
# 셸 형식을 써야 한다면: ENTRYPOINT exec java -jar app.jar
```

(공식 문서) Dockerfile reference의 ENTRYPOINT 절은 셸 형식이 실행 파일을 `/bin/sh -c`의 하위 명령으로 시작하는데 이 셸은 신호를 전달하지 않아서 실행 파일이 PID 1이 아니고 Unix 신호를 받지 못하며, 따라서 `docker stop`의 SIGTERM을 받지 못한다고 설명한다. 장시간 실행되는 ENTRYPOINT에는 `exec`로 시작해야 하고, `exec`를 빠뜨리면 `docker stop`이 제한 시간 뒤 SIGKILL을 보내게 된다고 하며 예시에서 `docker stop`이 약 10초 걸렸다. 같은 문서는 exec 형식이 셸 처리를 하지 않으므로 환경 변수 치환이 필요하면 직접 셸을 호출해야 한다고도 한다. Spring Boot Graceful Shutdown 문서는 종료가 ApplicationContext를 닫는 과정의 일부이며 IDE가 SIGTERM을 보내지 않으면 즉시 종료될 수 있다고 한다(2026-10-20 원문 확인).
(실험 확인) Spring 앱이 아니라 SIGTERM을 받으면 로그를 남기고 종료하는 셸 스크립트를 `busybox:1.36` 이미지에서 실험했다. 단일 명령 셸 형식(`ENTRYPOINT /app.sh --flag`)과 exec 형식(JSON 배열), 셸 형식에 `exec`를 붙인 `ENTRYPOINT exec /app.sh --flag`는 모두 스크립트가 PID 1이 되어 `docker stop` 즉시 종료 코드 0으로 끝났다. 즉 busybox의 셸은 명령이 하나면 알아서 `exec` 한다. 반면 `ENTRYPOINT /app.sh --flag ; echo after`처럼 명령을 더 붙이자 `/bin/sh -c`가 PID 1로 남고 스크립트는 자식 프로세스가 되어, `docker stop -t 4` 후 4초 만에 종료 코드 137(SIGKILL)로 끝났고 스크립트의 종료 처리 메시지는 찍히지 않았다. 같은 구조를 실제 Spring Boot 4.1.1 JAR로도 `amazoncorretto:25-alpine`(sh가 busybox)과 `amazoncorretto:25`(sh가 bash) 이미지에서 확인했다. `ENTRYPOINT java -jar /app.jar`와 exec 형식은 PID 1이 `java`였고 `docker stop` 뒤 종료 코드 143에 로그에 `Commencing graceful shutdown`이 찍혔다. `ENTRYPOINT java -jar /app.jar ; echo after`는 PID 1이 `/bin/sh -c ...`였고, `docker stop -t 15`가 약 15초를 기다린 뒤 종료 코드 137로 끝났으며 graceful shutdown 로그는 없었다.
(보충) 셸이 단일 명령을 자동으로 `exec` 하는지는 셸 구현마다 다를 수 있다는 점은 위 실험(busybox와 bash 두 셸에서 단일 명령은 직접 실행됨)과 일반적인 지식이며, Docker 문서가 보장하는 내용이 아니다.
