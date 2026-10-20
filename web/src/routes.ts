/** 화면 경로(BrowserRouter basename `/interview` 기준). 경로를 만드는 곳은 여기 하나다. */
export const topicPath = (slug: string) => `/t/${encodeURIComponent(slug)}`;
export const questionPath = (slug: string) => `/q/${encodeURIComponent(slug)}`;
export const conceptPath = (slug: string) => `/c/${encodeURIComponent(slug)}`;
export const conceptsPath = () => '/concepts';
export const searchPath = (q: string) => `/search?q=${encodeURIComponent(q)}`;
export const quizStartPath = () => '/quiz';
export const quizPath = (id: string) => `/quiz/${encodeURIComponent(id)}`;

/**
 * 앱이 그리는 화면 경로(react-router 형식, 기준 경로 `/interview` 제외). 두 곳의 단일 원본이다: App.tsx 가 이 목록으로 라우트를 만들고,
 * 서비스 워커의 내비게이션 허용 목록(src/pwa/allowlist.ts)이 이 목록에서 만들어진다. 새 화면은 여기에 추가하면 둘 다 따라온다.
 */
export const APP_ROUTE_PATHS = ['/', '/t/:topic', '/q/:slug', '/concepts', '/c/:concept', '/search', '/quiz', '/quiz/:id'] as const;
export type AppRoutePath = (typeof APP_ROUTE_PATHS)[number];
