# 책 근거(refs) 필드 (설계 패턴·아키텍처 주제의 예외)

> 상태: **구현 완료 (2026-10-20)**. 배경: [DESIGN.md §4](DESIGN.md) — 설계 패턴·아키텍처 주제에 한해 원저자의 책·블로그를 근거로 인정한다(사용자 확정). 책 근거는 URL 이 아니라 **쪽수까지** 적어야 해서 `sources`(URL 목록)로는 담을 수 없었다.

## 형식 (콘텐츠 작성자용)
질문 파일 머리말(frontmatter)에 선택 필드 `refs` 를 둔다. **문자열 목록**이고 한 항목이 근거 하나다.

```yaml
sources: ["https://martinfowler.com/bliki/..."]        # 온라인 1차 자료(URL), 기존 그대로
refs:
  - "Design Patterns: Elements of Reusable Object-Oriented Software, Observer, p.293"
  - "Clean Architecture, 5장, p.45~51"
```

- 항목은 1~200자의 일반 텍스트이고 질문당 10개까지다. 앞뒤 공백은 정리된다. 링크가 아니다(화면에 글자로만 보인다).
- 권장 표기: `책 제목, 장·절 또는 패턴 이름, 쪽수`. 판본이 다르면 쪽수가 달라지므로 판본이 있으면 적는다(예: `…(2판), p.45`).
- **문구를 옮기지 않는다**: 책의 문장을 그대로 싣지 않고 재서술한다. 짧은 인용은 15단어 미만 1회까지만(DESIGN §4).
- `refs` 는 `sources` 처럼 **해시에 넣지 않는다**: 바꿔도 검수 필요 표시나 수정 시각이 바뀌지 않는다.

## 구현
| 층 | 변경 |
|---|---|
| 스키마 | V10: `question.refs JSONB NOT NULL DEFAULT '[]'` |
| 콘텐츠 | `ContentParser`(목록·문자열만), `ContentValidator`(≤10개, 항목 1~200자), `ContentLoader`(저장) |
| API | `GET /api/v1/questions/{slug}` 의 `refs: string[]`(없으면 빈 배열, 키는 항상 있다) |
| 웹 | 질문 상세에 "이 질문의 책 근거" 구역(일반 텍스트, 비어 있으면 그리지 않음) |

## 확인
`ContentRefsTest`(읽기·순서·공백 정리·해시 불변·삭제·잘못된 형식·한도·읽기 모델), 웹 단위 시험(일반 텍스트·링크 아님·빈 구역 없음), 모바일 감사(긴 책 근거가 있는 질문 상세 × 폭 4 × 라이트·다크), 통합 e2e(API 응답 키 집합에 `refs`).
