import { Fragment } from 'react';

/**
 * 질문 제목처럼 한 줄 글 속의 `백틱 코드` 를 코드 서식으로 그린다(F0). 짝이 안 맞는 백틱은 글자 그대로 둔다.
 * 마크다운 전체를 해석하지 않는다: HTML 은 만들지 않고 텍스트와 <code> 만 낸다.
 */
export function TitleText({ text }: { text: string }) {
  const parts = text.split(/(`[^`\n]+`)/);
  return (
    <>
      {parts.map((part, i) =>
        part.length > 2 && part.startsWith('`') && part.endsWith('`') ? (
          <code key={i} className="rounded bg-[var(--color-surface-2)] px-1 py-0.5 text-[0.92em]">
            {part.slice(1, -1)}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
