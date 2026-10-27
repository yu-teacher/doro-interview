---
slug: "frt-13"
topic: "frontend-react-ts"
tier: DEEP
difficulty: 3
title: "React 서버 컴포넌트는 무엇이고 클라이언트 컴포넌트와 어떻게 다른가요? `'use client'`와 `'use server'`는 각각 무엇을 뜻하나요?"
keywords: ["번들링 전 별도 환경에서 렌더", "브라우저로 보내지지 않음", "useState 같은 상호작용 불가", "use client는 서버·클라이언트 경계", "use server는 서버 함수용 지시어"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://react.dev/reference/rsc/server-components", "https://react.dev/reference/rsc/use-server", "https://react.dev/reference/rsc/use-client"]
concepts: [react-optimization, react-state-rendering]
importance: 1
---
**모범 답변 (30~60초)**
서버 컴포넌트는 클라이언트 앱이나 SSR 서버와 분리된 환경에서 번들링 전에 미리 렌더되는 컴포넌트입니다. 빌드 시점에 한 번 돌 수도, 요청마다 웹 서버에서 돌 수도 있어서 별도 API 없이 데이터 계층을 읽고 `async`와 `await`도 쓸 수 있습니다. 브라우저로 보내지지 않으므로 `useState` 같은 상호작용 API는 쓸 수 없습니다. 파일 맨 위의 `"use client"`는 그 모듈과 의존 모듈을 클라이언트 코드로 표시해 서버와 클라이언트의 경계를 만드는 지시어여서, 상호작용은 여기서 만듭니다. 서버 컴포넌트를 표시하는 지시어는 없고, `"use server"`는 클라이언트가 호출하는 서버 함수용입니다.

(공식 문서) React 레퍼런스의 Server Components는 서버 컴포넌트를 클라이언트 앱이나 SSR 서버와 분리된 환경에서 번들링 전에 미리 렌더되는 컴포넌트라고 정의하고, 빌드 때 한 번 또는 요청마다 실행할 수 있다고 한다. 서버 컴포넌트는 API 없이 데이터 계층에 접근할 수 있고, `async` 컴포넌트로 렌더 중에 `await`할 수 있으며, 브라우저는 원래 컴포넌트가 아닌 렌더 결과만 받는다고 한다. 서버 컴포넌트는 브라우저로 보내지지 않아 `useState`를 쓸 수 없고, 상호작용은 `"use client"` 클라이언트 컴포넌트와 조합해 추가한다고 한다. 서버 컴포넌트에는 지시어가 없고 `"use server"`는 서버 함수용이라고 문서가 못 박는다. `'use client'` 레퍼런스는 파일 맨 위에 붙이면 그 모듈과 전이 의존성을 클라이언트 코드로 표시하고, 서버에서 실행되는 모듈이 그 파일을 import하면 호환 번들러가 서버 실행 코드와 클라이언트 실행 코드의 경계로 취급하며, 서버 컴포넌트가 기본이라고 설명한다. 문서 노트는 React 19의 서버 컴포넌트가 안정적이지만 번들러와 프레임워크 구현용 하위 API는 semver를 따르지 않아 마이너 버전에서 깨질 수 있다고 한다. `'use server'` 문서는 서버 함수의 인자를 클라이언트가 완전히 통제하므로 신뢰하지 말고 검증과 인가를 하라고 권고한다.
