/** 화면 경로(BrowserRouter basename `/interview` 기준). 경로를 만드는 곳은 여기 하나다. */
export const topicPath = (slug: string) => `/t/${encodeURIComponent(slug)}`;
export const questionPath = (slug: string) => `/q/${encodeURIComponent(slug)}`;
export const conceptPath = (slug: string) => `/c/${encodeURIComponent(slug)}`;
export const conceptsPath = () => '/concepts';
export const searchPath = (q: string) => `/search?q=${encodeURIComponent(q)}`;
