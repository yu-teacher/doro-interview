import { Link } from 'react-router-dom';
import { fetchConcepts } from '../api/catalog';
import { AsyncView } from '../components/AsyncView';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { conceptPath } from '../routes';

export function ConceptsPage() {
  useDocumentTitle('개념');
  const { state, reload } = useApi('concepts', (signal) => fetchConcepts(signal));
  return (
    <AsyncView state={state} reload={reload}>
      {(concepts) => (
        <div>
          <h1 className="text-2xl font-bold">개념</h1>
          <p className="mt-1 text-[var(--color-muted)]">주제를 가로질러 같은 개념의 질문을 모아 봅니다.</p>
          {concepts.length === 0 ? (
            <p className="py-8 text-center text-[var(--color-muted)]">아직 공개된 개념이 없습니다.</p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {concepts.map((c) => (
                <li key={c.slug} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <Link to={conceptPath(c.slug)} className="block min-h-11 p-4 no-underline">
                    <span className="block font-semibold text-[var(--color-text)]">{c.name}</span>
                    {c.description && <span className="mt-1 block text-sm text-[var(--color-muted)]">{c.description}</span>}
                    <span className="mt-2 block text-sm text-[var(--color-text)]">질문 {c.questionCount}개</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </AsyncView>
  );
}
