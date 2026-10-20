import { Link, useParams } from 'react-router-dom';
import { fetchConcept } from '../api/catalog';
import { AsyncView } from '../components/AsyncView';
import { useApi } from '../hooks/useApi';
import { questionPath } from '../routes';

export function ConceptPage() {
  const { concept = '' } = useParams();
  const { state, reload } = useApi(`concept:${concept}`, (signal) => fetchConcept(concept, signal));
  return (
    <AsyncView state={state} reload={reload} notFoundMessage="찾을 수 없는 개념입니다.">
      {(detail) => (
        <div>
          <h1 className="text-2xl font-bold">{detail.concept.name}</h1>
          <p className="mt-1 text-[var(--color-muted)]">{detail.concept.description}</p>
          <ul className="mt-4 space-y-2">
            {detail.questions.map((q) => (
              <li key={q.slug} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
                <Link to={questionPath(q.slug)} className="block min-h-11 p-3 no-underline">
                  {q.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AsyncView>
  );
}
