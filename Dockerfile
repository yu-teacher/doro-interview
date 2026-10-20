# 서버(mini)에는 Java 25 가 없어서(Java 21) 이미지 안에서 빌드한다: 서버에 도구를 깔지 않아도 배포된다.
FROM gradle:9.5.1-jdk25 AS build
WORKDIR /src
COPY settings.gradle build.gradle ./
COPY src src
# 질문 콘텐츠(content/)는 processResources 가 jar 의 classpath:content/ 로 싣는다
COPY content content
RUN --mount=type=cache,target=/home/gradle/.gradle gradle bootJar --no-daemon -x test -q

FROM eclipse-temurin:25-jdk-alpine

WORKDIR /app

# Non-root 사용자 생성
RUN addgroup -S doro && adduser -S doro -G doro
USER doro:doro

COPY --from=build --chown=doro:doro /src/build/libs/doro-interview-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8088

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8088/actuator/health || exit 1

ENTRYPOINT ["java", "-XX:+UseZGC", "-XX:+ZGenerational", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
