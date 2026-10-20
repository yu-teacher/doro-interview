import { Link } from 'react-router-dom';
import { fetchConcepts } from '../api/catalog';
import { AsyncView } from '../components/AsyncView';
import { useApi } from '../hooks/useApi';
import { conceptPath } from '../routes';

export function ConceptsPage() {
  const { state, reload } = useApi('concepts', (signal) => fetchConcepts(signal));
  return (
    <AsyncView state={state} reload={reload}>
      {(concepts) =>
        concepts.length === 0 ? (
          <p className="py-8 text-center text-[var(--color-muted)]">아직 공개된 개념이 없습니다.</p>
        ) : (
          <div>
            <h1 className="text-2xl font-bold">개념</h1>
            <ul className="mt-4 flex flex-wrap gap-2">
              {concepts.map((c) => (
                <li key={c.slug}>
                  <Link
                    to={conceptPath(c.slug)}
                    className="inline-flex min-h-11 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 no-underline"
                  >
                    {c.name} <span className="ml-2 text-sm text-[var(--color-muted)]">{c.questionCount}</span>
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
