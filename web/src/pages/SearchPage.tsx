import { Link, useSearchParams } from 'react-router-dom';
import { searchQuestions } from '../api/catalog';
import { AsyncView } from '../components/AsyncView';
import { useApi } from '../hooks/useApi';
import { questionPath } from '../routes';

export function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const { state, reload } = useApi(`search:${q}`, (signal) =>
    q ? searchQuestions(q, undefined, signal) : Promise.resolve({ words: [], total: 0, hits: [] }),
  );
  if (!q) {
    return <p className="py-8 text-center text-[var(--color-muted)]">검색어를 입력해 주세요.</p>;
  }
  return (
    <AsyncView state={state} reload={reload}>
      {(result) =>
        result.hits.length === 0 ? (
          <p className="py-8 text-center text-[var(--color-muted)]">&lsquo;{q}&rsquo; 에 해당하는 질문이 없습니다.</p>
        ) : (
          <div>
            <h1 className="text-xl font-bold">검색 결과 {result.total}건</h1>
            <ul className="mt-4 space-y-2">
              {result.hits.map((hit) => (
                <li key={hit.question.slug} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <Link to={questionPath(hit.question.slug)} className="block min-h-11 p-3 no-underline">
                    <span className="block font-semibold">{hit.question.title}</span>
                    <span className="block text-sm text-[var(--color-muted)]">{hit.topicName}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      }
    </AsyncView>
  );
}
