import { useSearchParams } from 'react-router-dom';
import { searchQuestions } from '../api/catalog';
import type { SearchResult } from '../api/types';
import { AsyncView } from '../components/AsyncView';
import { QuestionCard } from '../components/QuestionCard';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useSessionKey } from '../session/SessionProvider';

function Results({ q, result }: { q: string; result: SearchResult }) {
  useDocumentTitle(`‘${q}’ 검색`);
  return result.hits.length === 0 ? (
    <div className="py-8 text-center">
      <h1 className="text-xl font-bold">검색 결과 없음</h1>
      <p className="mt-2 text-[var(--color-muted)]">&lsquo;{q}&rsquo; 에 해당하는 질문이 없습니다. 다른 단어로 찾아 보세요.</p>
    </div>
  ) : (
    <div>
      <h1 className="text-xl font-bold">
        &lsquo;{q}&rsquo; 검색 결과 {result.total}건
      </h1>
      {result.total > result.hits.length && (
        <p className="mt-1 text-sm text-[var(--color-muted)]">가장 잘 맞는 {result.hits.length}건만 보여 줍니다. 검색어를 더 구체적으로 써 보세요.</p>
      )}
      <ul className="mt-4 space-y-2">
        {result.hits.map((hit) => (
          <QuestionCard key={hit.question.slug} question={hit.question} topicName={hit.topicName} matchedIn={hit.matchedIn} />
        ))}
      </ul>
    </div>
  );
}

export function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  useDocumentTitle(q ? null : '검색');
  const session = useSessionKey();
  const { state, reload } = useApi(
    `search:${q}:${session.key}`,
    (signal) => (q ? searchQuestions(q, undefined, signal) : Promise.resolve({ words: [], total: 0, hits: [] } satisfies SearchResult)),
    session.ready,
  );
  if (!q) {
    return (
      <div className="py-8 text-center">
        <h1 className="text-xl font-bold">검색</h1>
        <p className="mt-2 text-[var(--color-muted)]">검색어를 입력해 주세요.</p>
      </div>
    );
  }
  return (
    <AsyncView state={state} reload={reload}>
      {(result) => <Results q={q} result={result} />}
    </AsyncView>
  );
}
