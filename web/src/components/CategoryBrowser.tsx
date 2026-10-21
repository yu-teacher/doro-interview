import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CategoryView } from '../api/types';
import { topicPath } from '../routes';
import { ProgressBar } from './ProgressBar';

const STORAGE_KEY = 'interview.homeCategory';

function remembered(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // 저장소를 못 쓰는 환경(사생활 보호 모드 등)에서도 화면은 그대로 동작한다
  }
}

function remember(slug: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, slug);
  } catch {
    // 기억하지 못해도 괜찮다
  }
}

interface Props {
  categories: CategoryView[];
  /** 로그인했을 때 주제별 진도(없으면 막대를 그리지 않는다) */
  byTopic: Map<string, { learned: number; total: number }>;
}

/**
 * 카테고리 칩(가로로 스크롤) + 고른 카테고리의 주제 카드(F1). 주제가 수십 개라 한 줄 목록으로 두면 폰에서 스크롤이 너무 길어진다.
 * 마지막에 고른 카테고리를 기억한다(저장소를 못 써도 첫 카테고리로 동작한다).
 */
export function CategoryBrowser({ categories, byTopic }: Props) {
  const [picked, setPicked] = useState<string | null>(() => remembered());
  const current = categories.find((c) => c.slug === picked) ?? categories[0];
  if (!current) {
    return null;
  }
  return (
    <section aria-labelledby="browse-heading">
      <h2 id="browse-heading" className="text-xl font-bold">
        질문 은행
      </h2>
      <div role="group" aria-label="카테고리" className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {categories.map((c) => {
          const on = c.slug === current.slug;
          return (
            <button
              key={c.slug}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setPicked(c.slug);
                remember(c.slug);
              }}
              className={`min-h-11 shrink-0 rounded-full border px-4 text-sm ${
                on ? 'border-[var(--color-accent)] bg-[var(--color-accent)] font-semibold text-[var(--color-accent-contrast)]' : 'border-[var(--color-border)] bg-[var(--color-surface)]'
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>
      <h3 className="mt-4 text-lg font-bold">{current.name}</h3>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {current.topics.map((topic) => {
          const total = topic.counts.basic + topic.counts.deep + topic.counts.tricky;
          const p = byTopic.get(topic.slug);
          return (
            <li key={topic.slug} className="min-w-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
              <Link to={topicPath(topic.slug)} className="block min-h-11 min-w-0 p-3 no-underline">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 break-words font-semibold text-[var(--color-text)]">{topic.name}</span>
                  <span className="shrink-0 text-sm text-[var(--color-muted)]">질문 {total}개</span>
                </span>
                {topic.description && <span className="mt-0.5 block truncate text-sm text-[var(--color-muted)]">{topic.description}</span>}
              </Link>
              {p && (
                <div className="px-3 pb-3">
                  <ProgressBar value={p.learned} max={p.total} label={`${topic.name} 학습 진도`} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
