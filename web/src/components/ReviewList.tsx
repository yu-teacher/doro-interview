import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, userMessage } from '../api/client';
import { putLearned } from '../api/progress';
import { fetchReviewCandidates } from '../api/quiz';
import type { ReviewCandidate } from '../api/types';
import { useApi } from '../hooks/useApi';
import { questionLink } from '../routes';
import { useSession, useSessionKey } from '../session/SessionProvider';
import { TierBadge } from './Chips';

/**
 * 다시 공부 후보(체크했는데 마지막 시험에서 틀린 질문) 목록. 후보는 틀려도 **자동으로 체크가 풀리지 않고**, 여기서 사용자가 직접 해제한다
 * (DESIGN 결정 3). 후보를 못 불러와도 화면의 나머지는 그대로다(보조 정보).
 */
export function ReviewList({ limit, heading = '다시 공부 후보', onReleased }: { limit?: number; heading?: string; onReleased?: () => void }) {
  const session = useSessionKey();
  const { markAnonymous } = useSession();
  const { state } = useApi(`review:${session.key}`, (signal) => fetchReviewCandidates(signal), session.authenticated);
  const [released, setReleased] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if (!session.authenticated || state.status !== 'success') {
    return null;
  }
  const all = state.data.filter((c) => !released.has(c.slug));
  if (all.length === 0) {
    return null;
  }
  const shown = limit === undefined ? all : all.slice(0, limit);

  async function release(candidate: ReviewCandidate) {
    setBusy(candidate.slug);
    setMessage(null);
    try {
      await putLearned(candidate.slug, false);
      setReleased((prev) => new Set(prev).add(candidate.slug));
      onReleased?.(); // 체크가 줄었으니 진도 막대·숫자를 다시 받는다
    } catch (e) {
      if (e instanceof ApiError && e.isUnauthorized) {
        markAnonymous();
      }
      setMessage(e instanceof ApiError ? userMessage(e) : '해제하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="review-heading" className="rounded-lg border border-[var(--color-extra)] p-4">
      <h2 id="review-heading" className="text-lg font-bold">
        {heading} ({all.length})
      </h2>
      <p className="text-sm text-[var(--color-muted)]">학습함으로 체크했지만 최근 시험에서 틀린 질문입니다. 다시 공부한 뒤 체크를 유지하거나, 아직 아니라면 해제하세요.</p>
      {message && (
        <p role="status" aria-live="polite" className="mt-2 text-[var(--color-extra)]">
          {message}
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {shown.map((c) => (
          <li key={c.slug} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="min-w-0">
              <Link to={questionLink(c.slug)} className="inline-flex min-h-11 items-center font-semibold no-underline">
                {c.title}
              </Link>
              <div className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--color-muted)]">
                <TierBadge tier={c.tier} />
                <span>{c.topicName}</span>
              </div>
            </div>
            <button
              type="button"
              disabled={busy === c.slug}
              onClick={() => void release(c)}
              aria-label={`체크 해제: ${c.title}`}
              className="min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4"
            >
              체크 해제
            </button>
          </li>
        ))}
      </ul>
      {limit !== undefined && all.length > limit && (
        <p className="mt-2 text-sm">
          <Link to="/stats" className="inline-flex min-h-11 items-center">
            전체 {all.length}개 보기
          </Link>
        </p>
      )}
    </section>
  );
}
