---
slug: "cic-06"
topic: "dev-cicd"
tier: BASIC
difficulty: 2
title: "CI에서 배포 키나 API 키 같은 비밀값은 어떻게 다루고, 로그에 노출되지 않게 하려면 무엇을 주의해야 하나요?"
keywords: ["저장소·환경 secrets 등록", "secrets 컨텍스트로 참조", "자동 마스킹은 완전하지 않음", "::add-mask::", "GITHUB_TOKEN 최소 권한"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets", "https://docs.github.com/en/actions/reference/security/secrets", "https://docs.github.com/en/actions/reference/security/secure-use", "https://docs.github.com/en/actions/tutorials/authenticate-with-github_token"]
---
**모범 답변 (30~60초)**
코드나 워크플로 파일에 값을 적지 않고, 저장소나 조직, 환경 설정의 secrets에 등록한 뒤 `secrets` 컨텍스트로 참조합니다. 가능하면 환경 변수로 넘기고 명령행 인자로는 넘기지 않습니다. 등록한 secret은 로그에서 가려지지만 자동 마스킹은 완전하지 않습니다. 값을 Base64로 바꾸거나 그 값으로 토큰을 만들어 파생값이 생기면 그 값도 따로 등록해야 하고, JSON 같은 구조화된 값을 통째로 secret으로 두면 가려지지 않을 수 있습니다. secret이 아닌 민감한 값은 `::add-mask::값`으로 마스킹합니다. 또 `GITHUB_TOKEN`은 `permissions`로 필요한 권한만 주고, 클라우드 접근은 장기 키 대신 OIDC를 쓰는 것이 좋습니다. 값이 노출됐다면 로그를 지우고 키를 교체합니다.

```yaml
on: push
permissions:
  contents: read
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
        run: ./deploy.sh
```

(공식 문서) Using secrets 문서는 저장소·환경·조직 수준에서 secret을 만드는 방법과 `${{ secrets.이름 }}`으로 참조하는 방법을 설명하고, 명령행 인자는 `ps` 등으로 다른 사용자에게 보일 수 있으니 환경 변수나 표준 입력을 쓰라고 한다. secret이 아닌 민감한 값은 `::add-mask::VALUE`로 마스킹하라고 한다. Secure use reference 문서는 secret을 변형한 값(예: Base64, URL 인코딩, 비공개 키로 만든 JWT)도 별도로 등록해야 하고, 구조화된 데이터(JSON, XML, YAML)를 secret으로 쓰면 마스킹이 실패할 가능성이 커진다고 한다. 마스킹은 러너가 수행하며 노출된 값은 로그를 지우고 교체하라고 하고, `GITHUB_TOKEN`은 기본 권한을 읽기 전용으로 두고 필요한 job에서만 늘리라고 하며, 클라우드 접근에는 OIDC를 권장한다. Secrets reference 문서는 secret 크기를 48 KB로 제한한다(2026-10-20 원문 확인).
(실험 확인) 위 YAML은 actionlint 1.7.12로 문법 검사를 통과했다. 마스킹이 실제로 동작하는지는 GitHub 러너가 필요해 실험하지 않았다.
