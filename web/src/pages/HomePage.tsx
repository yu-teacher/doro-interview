import { Link } from 'react-router-dom';
import { fetchCategories } from '../api/catalog';
import { AsyncView } from '../components/AsyncView';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { TIER_LABEL } from '../lib/labels';
import { topicPath } from '../routes';

export function HomePage() {
  useDocumentTitle(null);
  const { state, reload } = useApi('categories', (signal) => fetchCategories(signal));
  return (
    <AsyncView state={state} reload={reload}>
      {(categories) =>
        categories.length === 0 ? (
          <div className="py-10 text-center">
            <h1 className="text-xl font-bold">검수 중인 주제입니다</h1>
            <p className="mt-2 text-[var(--color-muted)]">공식 문서와 대조해 검수가 끝난 주제부터 공개합니다. 곧 열립니다.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <h1 className="sr-only">주제 목록</h1>
            {categories.map((category) => (
              <section key={category.slug} aria-labelledby={`cat-${category.slug}`}>
                <h2 id={`cat-${category.slug}`} className="mb-3 text-xl font-bold">
                  {category.name}
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {category.topics.map((topic) => {
                    const total = topic.counts.basic + topic.counts.deep + topic.counts.tricky;
                    return (
                      <li key={topic.slug} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
                        <Link to={topicPath(topic.slug)} className="block min-h-11 p-4 no-underline">
                          <span className="block text-lg font-semibold text-[var(--color-text)]">{topic.name}</span>
                          <span className="mt-1 block text-sm text-[var(--color-muted)]">{topic.description}</span>
                          <span className="mt-2 block text-sm text-[var(--color-text)]">
                            질문 {total}개 · {TIER_LABEL.BASIC} {topic.counts.basic} · {TIER_LABEL.DEEP} {topic.counts.deep} · {TIER_LABEL.TRICKY}{' '}
                            {topic.counts.tricky}
                          </span>
                          {topic.baseVersion && <span className="mt-1 block text-sm text-[var(--color-muted)]">기준 버전: {topic.baseVersion}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )
      }
    </AsyncView>
  );
}
