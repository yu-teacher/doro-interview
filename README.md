# 도로 면접 (doro-interview)

자바·스프링·네트워크·DB 등 개발 면접 질문을 종합적으로 모아 두고, 내가 "완전히 학습했다"고 체크한 질문만 랜덤으로 받아 점검하는 면접 준비 서비스. [Doro](https://github.com/yu-teacher) 플랫폼의 서브 서비스(`/interview/`)입니다.

- 설계: [docs/DESIGN.md](docs/DESIGN.md)
- 착수 계획(M0): [docs/M0-PLAN.md](docs/M0-PLAN.md)

## 구조
- `src/` Spring Boot 백엔드. 모듈: `catalog`(사전) · `progress`(학습 진도) · `quiz`(시험) · `account`(사용자 사본) · `api`(합성). 의존 방향은 아키텍처 테스트가 강제한다.
- `content/` 질문 원본(마크다운). 빌드 때 jar 에 실리고 앱이 시작할 때 DB 에 반영한다.
- `web/` React + Vite PWA.
- `scripts/` CI·변환 도구.

## 로컬 검증
```bash
scripts/ci-test.sh backend   # 격리 Postgres 를 올려 백엔드 테스트 후 내린다
scripts/ci-test.sh web       # 프런트 린트·타입·테스트
```
필요: Docker, Java 25, Node 24, Python 3.
