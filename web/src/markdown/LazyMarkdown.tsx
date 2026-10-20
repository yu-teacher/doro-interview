import { lazy, Suspense } from 'react';

// react-markdown 과 코드 하이라이트는 질문 화면에서만 필요하다. 홈·주제 화면의 초기 번들에 싣지 않도록 나중에 불러온다.
const Markdown = lazy(() => import('./Markdown').then((m) => ({ default: m.Markdown })));

/** 불러오는 동안은 원문 글을 그대로 보여 준다(내용이 먼저 읽히고, 렌더러가 오면 서식만 입혀진다). */
export function LazyMarkdown({ source }: { source: string }) {
  return (
    <Suspense fallback={<p className="my-2 whitespace-pre-wrap leading-7">{source}</p>}>
      <Markdown source={source} />
    </Suspense>
  );
}
