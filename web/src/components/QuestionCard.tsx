import { Link } from 'react-router-dom';
import type { MatchedIn, QuestionSummary } from '../api/types';
import { MATCHED_LABEL } from '../lib/labels';
import { questionPath } from '../routes';
import { ExtraFlag, ImportanceBadge, TierBadge } from './Chips';
import { LearnedCheckbox } from './LearnedCheckbox';

interface Props {
  question: QuestionSummary;
  /** 검색 결과에서 어느 주제의 질문인지 */
  topicName?: string;
  matchedIn?: MatchedIn[];
  /** 주어지면 카드 왼쪽에 체크박스를 둔다(주제 목록). 없으면 서버가 준 `learned` 를 읽기 전용 표시로만 보인다(검색·개념). */
  learned?: { checked: boolean; onChange: (next: boolean) => void };
}

/** 질문 목록의 한 줄. 카드 전체가 하나의 링크다(터치 영역 ≥ 44px). */
export function QuestionCard({ question, topicName, matchedIn, learned }: Props) {
  return (
    <li className="flex items-stretch rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      {learned && (
        <div className="flex shrink-0 items-center border-r border-[var(--color-border)]">
          <LearnedCheckbox checked={learned.checked} onChange={learned.onChange} title={question.title} compact />
        </div>
      )}
      <Link to={questionPath(question.slug)} className="block min-h-11 min-w-0 flex-1 p-3 no-underline">
        <span className="block font-semibold text-[var(--color-text)]">{question.title}</span>
        {topicName && <span className="mt-0.5 block text-sm text-[var(--color-muted)]">{topicName}</span>}
        <span className="mt-2 flex flex-wrap gap-1.5">
          <TierBadge tier={question.tier} />
          <ImportanceBadge importance={question.importance} />
          {question.hasExtra && <ExtraFlag />}
          {!learned && question.learned === true && (
            <span className="inline-flex items-center rounded-full border border-[var(--color-official)] px-2.5 text-sm leading-6 text-[var(--color-official)]">
              ✓ 학습함
            </span>
          )}
        </span>
        {matchedIn && matchedIn.length > 0 && (
          <span className="mt-1.5 block text-sm text-[var(--color-muted)]">일치: {matchedIn.map((m) => MATCHED_LABEL[m]).join(', ')}</span>
        )}
      </Link>
    </li>
  );
}
