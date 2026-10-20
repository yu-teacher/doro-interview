/** 화면 경로(BrowserRouter basename `/interview` 기준). 경로를 만드는 곳은 여기 하나다. */
export const topicPath = (slug: string) => `/t/${encodeURIComponent(slug)}`;
export const questionPath = (slug: string) => `/q/${encodeURIComponent(slug)}`;
export const conceptPath = (slug: string) => `/c/${encodeURIComponent(slug)}`;
export const conceptsPath = () => '/concepts';
export const searchPath = (q: string) => `/search?q=${encodeURIComponent(q)}`;
export const quizStartPath = () => '/quiz';
export const skimPath = (topic?: string) => (topic === undefined ? '/skim' : `/skim/${encodeURIComponent(topic)}`);
export const statsPath = () => '/stats';
export const explorePath = () => '/explore';
export const mePath = () => '/me';
export const minePath = (id?: string) => (id === undefined ? '/mine' : `/mine/${encodeURIComponent(id)}`);

/** 내 질문의 slug(`my-<id>`)에서 id 를 꺼낸다. 내 질문이 아니면 null. */
export const mineIdOf = (slug: string): string | null => (slug.startsWith('my-') ? slug.slice(3) : null);

/** 질문 slug 로 가는 화면 경로: 내 질문이면 내 질문 화면, 아니면 공용 질문 화면. */
export const questionLink = (slug: string): string => {
  const id = mineIdOf(slug);
  return id === null ? questionPath(slug) : minePath(id);
};
export const quizPath = (id: string) => `/quiz/${encodeURIComponent(id)}`;

/**
 * 앱이 그리는 화면 경로(react-router 형식, 기준 경로 `/interview` 제외). 두 곳의 단일 원본이다: App.tsx 가 이 목록으로 라우트를 만들고,
 * 서비스 워커의 내비게이션 허용 목록(src/pwa/allowlist.ts)이 이 목록에서 만들어진다. 새 화면은 여기에 추가하면 둘 다 따라온다.
 */
export const APP_ROUTE_PATHS = ['/', '/t/:topic', '/q/:slug', '/concepts', '/c/:concept', '/search', '/quiz', '/quiz/:id', '/skim', '/skim/:topic', '/stats', '/mine', '/mine/:id', '/explore', '/me'] as const;
export type AppRoutePath = (typeof APP_ROUTE_PATHS)[number];
