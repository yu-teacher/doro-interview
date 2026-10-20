import { Link } from 'react-router-dom';
import type { MatchedIn, QuestionSummary } from '../api/types';
import { MATCHED_LABEL } from '../lib/labels';
import { questionPath } from '../routes';
import { ExtraFlag, ImportanceBadge, TierBadge } from './Chips';

interface Props {
  question: QuestionSummary;
  /** 검색 결과에서 어느 주제의 질문인지 */
  topicName?: string;
  matchedIn?: MatchedIn[];
}

/** 질문 목록의 한 줄. 카드 전체가 하나의 링크다(터치 영역 ≥ 44px). */
export function QuestionCard({ question, topicName, matchedIn }: Props) {
  return (
    <li className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <Link to={questionPath(question.slug)} className="block min-h-11 p-3 no-underline">
        <span className="block font-semibold text-[var(--color-text)]">{question.title}</span>
        {topicName && <span className="mt-0.5 block text-sm text-[var(--color-muted)]">{topicName}</span>}
        <span className="mt-2 flex flex-wrap gap-1.5">
          <TierBadge tier={question.tier} />
          <ImportanceBadge importance={question.importance} />
          {question.hasExtra && <ExtraFlag />}
        </span>
        {matchedIn && matchedIn.length > 0 && (
          <span className="mt-1.5 block text-sm text-[var(--color-muted)]">일치: {matchedIn.map((m) => MATCHED_LABEL[m]).join(', ')}</span>
        )}
      </Link>
    </li>
  );
}
