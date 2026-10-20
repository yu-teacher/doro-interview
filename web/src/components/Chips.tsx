import { Link } from 'react-router-dom';
import type { ConceptRef, Tier } from '../api/types';
import { conceptPath } from '../routes';
import { importanceLabel, TIER_LABEL } from '../lib/labels';

const PILL = 'inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-sm leading-6';

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span data-tier={tier} className={PILL}>
      {TIER_LABEL[tier]}
    </span>
  );
}

export function ImportanceBadge({ importance }: { importance: number | null }) {
  return (
    <span data-importance={importance ?? 'none'} className={`${PILL} ${importance === null ? 'text-[var(--color-muted)]' : 'font-semibold'}`}>
      {importanceLabel(importance)}
    </span>
  );
}

export function ExtraFlag() {
  return <span className={`${PILL} text-[var(--color-extra)] border-[var(--color-extra)]`}>보충 있음</span>;
}

/** "다시 공부 후보": 체크했는데 최근 시험에서 틀린 질문. 색뿐 아니라 글자로도 알린다. */
export function ReviewBadge() {
  return <span className={`${PILL} border-[var(--color-extra)] font-semibold text-[var(--color-extra)]`}>다시 공부 후보</span>;
}

export function KeywordList({ keywords }: { keywords: string[] }) {
  if (keywords.length === 0) {
    return null;
  }
  return (
    <ul aria-label="핵심 키워드" className="flex flex-wrap gap-1.5">
      {keywords.map((k) => (
        <li key={k}>
          <span className={PILL}>{k}</span>
        </li>
      ))}
    </ul>
  );
}

/** 개념 칩: 개념 화면으로 가는 링크. 터치 영역을 44px 이상으로 둔다. */
export function ConceptList({ concepts }: { concepts: ConceptRef[] }) {
  if (concepts.length === 0) {
    return null;
  }
  return (
    <ul aria-label="개념" className="flex flex-wrap gap-1.5">
      {concepts.map((c) => (
        <li key={c.slug}>
          <Link to={conceptPath(c.slug)} className={`${PILL} min-h-11 no-underline`}>
            {c.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
