import { Link } from 'react-router-dom';
import { TitleText } from './TitleText';
import type { QuestionRef } from '../api/types';
import { questionPath } from '../routes';
import { TierBadge } from './Chips';

/** "먼저 볼 질문 / 이어 볼 질문 / 관련 질문" 같은 연결 목록. 비어 있으면 아무것도 그리지 않는다. */
export function RefList({ title, items }: { title: string; items: QuestionRef[] }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <section aria-label={title} className="mt-6">
      <h2 className="mb-2 text-base font-bold">{title}</h2>
      <ul className="space-y-2">
        {items.map((r) => (
          <li key={r.slug} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
            <Link to={questionPath(r.slug)} className="flex min-h-11 flex-wrap items-center gap-2 p-3 no-underline">
              <span>
                <TitleText text={r.title} />
              </span>
              <TierBadge tier={r.tier} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
