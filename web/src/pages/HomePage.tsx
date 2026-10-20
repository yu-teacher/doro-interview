import { Link } from 'react-router-dom';
import { fetchCategories } from '../api/catalog';
import { AsyncView } from '../components/AsyncView';
import { useApi } from '../hooks/useApi';
import { topicPath } from '../routes';

export function HomePage() {
  const { state, reload } = useApi('categories', (signal) => fetchCategories(signal));
  return (
    <AsyncView state={state} reload={reload}>
      {(categories) =>
        categories.length === 0 ? (
          <p className="py-8 text-center text-[var(--color-muted)]">검수 중인 주제입니다. 곧 공개됩니다.</p>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => (
              <section key={category.slug} aria-labelledby={`cat-${category.slug}`}>
                <h2 id={`cat-${category.slug}`} className="mb-3 text-xl font-bold">
                  {category.name}
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {category.topics.map((topic) => (
                    <li key={topic.slug} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
                      <Link to={topicPath(topic.slug)} className="block min-h-11 p-4 no-underline">
                        <span className="block font-semibold">{topic.name}</span>
                        <span className="mt-1 block text-sm text-[var(--color-muted)]">{topic.description}</span>
                        <span className="mt-2 block text-sm text-[var(--color-muted)]">
                          질문 {topic.counts.basic + topic.counts.deep + topic.counts.tricky}개
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )
      }
    </AsyncView>
  );
}
