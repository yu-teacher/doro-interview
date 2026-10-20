import { Link } from 'react-router-dom';
import type { CategoryView } from '../api/types';
import { TIER_LABEL } from '../lib/labels';
import { topicPath } from '../routes';
import { ProgressBar } from './ProgressBar';

interface Props {
  categories: CategoryView[];
  /** 로그인했을 때 주제별 진도(없으면 막대를 그리지 않는다) */
  byTopic: Map<string, { learned: number; total: number }>;
}

/** 카테고리별 주제 카드 목록(탐색 화면과 홈이 같이 쓴다). */
export function CategorySections({ categories, byTopic }: Props) {
  return (
    <>
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
                  {byTopic.has(topic.slug) && (
                    <div className="px-4 pb-4">
                      <ProgressBar value={byTopic.get(topic.slug)?.learned ?? 0} max={byTopic.get(topic.slug)?.total ?? total} label={`${topic.name} 학습 진도`} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
