import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCategories } from '../api/catalog';
import { ApiError, userMessage } from '../api/client';
import { fetchProgressSummary } from '../api/progress';
import { fetchPrefs, fetchStats, putPrefs } from '../api/quiz';
import type { CategoryView, ProgressSummary, QuizStats } from '../api/types';
import { AsyncView } from '../components/AsyncView';
import { TierBadge } from '../components/Chips';
import { TitleText } from '../components/TitleText';
import { ProgressBar } from '../components/ProgressBar';
import { ReviewList } from '../components/ReviewList';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { questionLink, quizStartPath, topicPath } from '../routes';
import { loginUrl, useSession, useSessionKey } from '../session/SessionProvider';

function Last30Days({ stats }: { stats: QuizStats }) {
  const judged = stats.correctLast30Days + stats.wrongLast30Days;
  return (
    <section aria-labelledby="recent-heading">
      <h2 id="recent-heading" className="text-lg font-bold">
        최근 30일
      </h2>
      {stats.sessionsLast30Days === 0 ? (
        <p className="mt-1 text-[var(--color-muted)]">
          아직 본 시험이 없습니다.{' '}
          <Link to={quizStartPath()} className="inline-flex min-h-11 items-center">
            시험 보러 가기
          </Link>
        </p>
      ) : (
        <dl className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['시험 횟수', `${stats.sessionsLast30Days}회`],
            ['채점한 문제', `${judged}문제`],
            ['정답률', judged === 0 ? '—' : `${Math.round((stats.correctLast30Days / judged) * 100)}%`],
            ['건너뜀', `${stats.skippedLast30Days}문제`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <dt className="text-sm text-[var(--color-muted)]">{label}</dt>
              <dd className="text-xl font-bold">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function MostMissed({ stats }: { stats: QuizStats }) {
  if (stats.mostMissed.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby="missed-heading">
      <h2 id="missed-heading" className="text-lg font-bold">
        자주 틀린 질문
      </h2>
      <ol className="mt-2 space-y-2">
        {stats.mostMissed.map((m) => (
          <li key={m.questionSlug} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <Link to={questionLink(m.questionSlug)} className="inline-flex min-h-11 items-center font-semibold no-underline">
              <TitleText text={m.title} />
            </Link>
            <div className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--color-muted)]">
              <TierBadge tier={m.tier} />
              <span>{m.topicName}</span>
              <span>
                · {m.askCount}번 중 {m.missCount}번 틀림
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Progress({ categories, summary }: { categories: CategoryView[]; summary: ProgressSummary }) {
  const byTopic = new Map(summary.topics.map((t) => [t.topicSlug, t]));
  return (
    <section aria-labelledby="progress-heading">
      <h2 id="progress-heading" className="text-lg font-bold">
        학습 진도{' '}
        <span className="text-base font-normal text-[var(--color-muted)]">
          ({summary.learned}/{summary.total})
        </span>
      </h2>
      <div className="mt-2 space-y-4">
        {categories.map((c) => (
          <div key={c.slug}>
            <h3 className="font-semibold">{c.name}</h3>
            <ul className="mt-1 space-y-2">
              {c.topics.map((t) => {
                const p = byTopic.get(t.slug);
                return (
                  <li key={t.slug}>
                    <Link to={topicPath(t.slug)} className="inline-flex min-h-11 items-center no-underline">
                      {t.name}
                    </Link>
                    {p && <ProgressBar value={p.learned} max={p.total} label={`${t.name} 학습 진도`} />}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Settings() {
  const { markAnonymous } = useSession();
  const { state } = useApi('prefs', (signal) => fetchPrefs(signal));
  const [override, setOverride] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  if (state.status !== 'success') {
    return null;
  }
  const value = override ?? state.data.includeUnlearnedDefault;

  async function change(next: boolean) {
    const previous = value;
    setOverride(next); // 낙관적으로 바꾸고 실패하면 되돌린다
    setMessage(null);
    try {
      await putPrefs({ includeUnlearnedDefault: next });
    } catch (e) {
      setOverride(previous);
      if (e instanceof ApiError && e.isUnauthorized) {
        markAnonymous();
      }
      setMessage(e instanceof ApiError ? userMessage(e) : '저장하지 못했습니다. 다시 시도해 주세요.');
    }
  }

  return (
    <section aria-labelledby="settings-heading">
      <h2 id="settings-heading" className="text-lg font-bold">
        설정
      </h2>
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" className="size-5" checked={value} onChange={(e) => void change(e.target.checked)} />
        <span>시험을 볼 때 체크하지 않은 질문도 기본으로 포함</span>
      </label>
      {message && (
        <p role="status" aria-live="polite" className="text-[var(--color-extra)]">
          {message}
        </p>
      )}
    </section>
  );
}

function Loaded() {
  const stats = useApi('stats', (signal) => fetchStats(signal));
  const categories = useApi('categories', (signal) => fetchCategories(signal));
  const summary = useApi('summary-stats', (signal) => fetchProgressSummary(signal));
  const onReleased = summary.reload;
  return (
    <div className="space-y-8">
      <AsyncView state={stats.state} reload={stats.reload}>
        {(s) => (
          <>
            <Last30Days stats={s} />
            <ReviewList onReleased={onReleased} />
            <MostMissed stats={s} />
          </>
        )}
      </AsyncView>
      {categories.state.status === 'success' && summary.state.status === 'success' && (
        <Progress categories={categories.state.data} summary={summary.state.data} />
      )}
      <Settings />
    </div>
  );
}

export function StatsPage() {
  useDocumentTitle('내 현황');
  const session = useSessionKey();
  const { state, refresh } = useSession();
  return (
    <div>
      <h1 className="text-2xl font-bold">내 현황</h1>
      <div className="mt-4">
        {!session.ready ? (
          <p role="status" className="py-8 text-center text-[var(--color-muted)]">
            불러오는 중…
          </p>
        ) : session.authenticated ? (
          <Loaded />
        ) : state.status === 'error' ? (
          <div role="alert">
            <p>로그인 상태를 확인하지 못했습니다.</p>
            <button type="button" onClick={refresh} className="mt-2 min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4">
              다시 시도
            </button>
          </div>
        ) : (
          <p>
            내 현황은 로그인한 뒤에 볼 수 있습니다.{' '}
            <a href={loginUrl('/stats')} className="inline-flex min-h-11 items-center font-semibold">
              로그인
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
