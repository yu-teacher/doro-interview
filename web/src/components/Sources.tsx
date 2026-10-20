import type { SourceView } from '../api/types';

function Source({ url, note }: { url: string; note?: string | null }) {
  return (
    <li className="break-all">
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center">
        {url}
      </a>
      {note && <span className="ml-2 text-sm text-[var(--color-muted)]">({note})</span>}
    </li>
  );
}

/** 이 질문을 검수하며 실제로 대조한 출처. */
export function QuestionSources({ urls }: { urls: string[] }) {
  if (urls.length === 0) {
    return null;
  }
  return (
    <section aria-label="이 질문의 근거 문서" className="mt-6">
      <h2 className="mb-1 text-base font-bold">이 질문의 근거 문서</h2>
      <ul>
        {urls.map((u) => (
          <Source key={u} url={u} />
        ))}
      </ul>
    </section>
  );
}

/** 주제(문서) 전체의 출처. 길어질 수 있어 접어 둔다. */
export function TopicSources({ sources, label = '이 주제의 출처' }: { sources: SourceView[]; label?: string }) {
  if (sources.length === 0) {
    return null;
  }
  return (
    <details className="mt-6">
      <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold">
        {label} ({sources.length})
      </summary>
      <ul>
        {sources.map((s) => (
          <Source key={s.url} url={s.url} note={s.note} />
        ))}
      </ul>
    </details>
  );
}
