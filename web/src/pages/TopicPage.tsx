import { Link, useParams } from 'react-router-dom';
import { fetchTopic } from '../api/catalog';
import { AsyncView } from '../components/AsyncView';
import { useApi } from '../hooks/useApi';
import { questionPath } from '../routes';

export function TopicPage() {
  const { topic = '' } = useParams();
  const { state, reload } = useApi(`topic:${topic}`, (signal) => fetchTopic(topic, signal));
  return (
    <AsyncView state={state} reload={reload} notFoundMessage="찾을 수 없는 주제입니다.">
      {(view) => (
        <div>
          <h1 className="text-2xl font-bold">{view.summary.name}</h1>
          <p className="mt-1 text-[var(--color-muted)]">{view.summary.description}</p>
          <ul className="mt-4 space-y-2">
            {view.questions.map((q) => (
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
