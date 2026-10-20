import { Link } from 'react-router-dom';
import { fetchCategories, fetchFeatured } from '../api/catalog';
import { fetchProgressSummary } from '../api/progress';
import type { CategoryView, ProgressSummary } from '../api/types';
import { AsyncView } from '../components/AsyncView';
import { CategoryBrowser } from '../components/CategoryBrowser';
import { TierBadge } from '../components/Chips';
import { ProgressBar } from '../components/ProgressBar';
import { ReviewList } from '../components/ReviewList';
import { Skeleton } from '../components/Skeleton';
import { TitleText } from '../components/TitleText';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { explorePath, questionPath, quizStartPath } from '../routes';
import { loginUrl, useSessionKey } from '../session/SessionProvider';

const PRIMARY = 'inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-accent)] px-5 font-semibold text-[var(--color-accent-contrast)] no-underline';
const SECONDARY = 'inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-5 font-semibold no-underline';

/** 처음 온 사람(비로그인)에게: 무엇을 하는 곳인지, 어디서 시작하는지, 자주 나오는 질문 몇 개. */
function Guest() {
  const featured = useApi('featured', (signal) => fetchFeatured(signal));
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-[var(--color-surface-2)] p-5">
        <h1 className="text-2xl font-bold leading-snug">개발 면접 질문, 공식 문서로 정리했습니다</h1>
        <p className="mt-2 text-[var(--color-text)]">질문을 읽고, 학습한 질문은 체크하고, 체크한 질문으로 랜덤 면접을 봅니다.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={explorePath()} className={PRIMARY}>
            질문 둘러보기
          </Link>
          <a href={loginUrl('/')} className={SECONDARY}>
            로그인하고 시작
          </a>
        </div>
      </section>
      {/* 못 불러와도 홈의 나머지는 그대로다(보조 정보) */}
      {featured.state.status === 'success' && featured.state.data.length > 0 && (
        <section aria-labelledby="featured-heading">
          <h2 id="featured-heading" className="text-xl font-bold">
            자주 나오는 질문
          </h2>
          <ul className="mt-2 space-y-2">
            {featured.state.data.map((q) => (
              <li key={q.slug}>
                <Link to={questionPath(q.slug)} className="block min-h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 no-underline">
                  <span className="block font-semibold text-[var(--color-text)]">
                    <TitleText text={q.title} />
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-[var(--color-muted)]">
                    <TierBadge tier={q.tier as 'BASIC' | 'DEEP' | 'TRICKY'} />
                    <span>{q.topicName}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** 로그인한 사람에게: 오늘 할 일(시험·다시 공부 후보·전체 진도). */
function Today({ progress, reloadProgress }: { progress: ProgressSummary | null; reloadProgress: () => void }) {
  const learned = progress?.learned ?? null;
  const hasLearned = learned === null || learned > 0;
  return (
    <section aria-labelledby="today-heading" className="space-y-4">
      <h2 id="today-heading" className="text-xl font-bold">
        오늘 할 일
      </h2>
      <div className="rounded-2xl bg-[var(--color-surface-2)] p-4">
        {hasLearned ? (
          <>
            <p className="text-[var(--color-text)]">
              {learned === null ? '체크한 질문으로 랜덤 면접을 봅니다.' : `체크한 질문 ${learned}개 중에서 무작위로 묻습니다.`}
            </p>
            <Link to={quizStartPath()} className={`${PRIMARY} mt-3 w-full sm:w-auto`}>
              랜덤 면접 시작
            </Link>
          </>
        ) : (
          <>
            <p className="text-[var(--color-text)]">아직 체크한 질문이 없습니다. 질문을 읽고 학습한 것은 체크하면 그 질문으로 면접을 볼 수 있습니다.</p>
            <Link to={explorePath()} className={`${PRIMARY} mt-3 w-full sm:w-auto`}>
              질문 둘러보기
            </Link>
          </>
        )}
        {progress && progress.total > 0 && (
          <div className="mt-4">
            <p className="mb-1 text-sm text-[var(--color-muted)]">전체 진도</p>
            <ProgressBar value={progress.learned} max={progress.total} label="전체 학습 진도" />
          </div>
        )}
        <p className="mt-2 text-sm">
          <Link to="/stats" className="inline-flex min-h-11 items-center">
            내 현황 보기
          </Link>
        </p>
      </div>
      <ReviewList limit={3} onReleased={reloadProgress} />
    </section>
  );
}

export function HomePage() {
  useDocumentTitle(null);
  const { state, reload } = useApi('categories', (signal) => fetchCategories(signal));
  const session = useSessionKey();
  // 진도는 보조 정보다: 못 불러와도 사전은 그대로 보인다
  const summary = useApi(`summary:${session.key}`, (signal) => fetchProgressSummary(signal), session.authenticated);
  const progress: ProgressSummary | null = session.authenticated && summary.state.status === 'success' ? summary.state.data : null;
  const byTopic = new Map(progress?.topics.map((t) => [t.topicSlug, t]) ?? []);
  // 세션을 확인하는 동안 위쪽(소개/오늘 할 일)만 뼈대로 두고, 질문 은행은 기다리지 않고 바로 보인다
  return (
    <div className="space-y-8">
      {!session.ready ? (
        <Skeleton rows={2} />
      ) : session.authenticated ? (
        <>
          <h1 className="sr-only">홈</h1>
          <Today progress={progress} reloadProgress={summary.reload} />
        </>
      ) : (
        <Guest />
      )}
      <AsyncView state={state} reload={reload}>
        {(categories: CategoryView[]) =>
          categories.length === 0 ? (
            <div className="py-6 text-center">
              <h2 className="text-xl font-bold">검수 중인 주제입니다</h2>
              <p className="mt-2 text-[var(--color-muted)]">공식 문서와 대조해 검수가 끝난 주제부터 공개합니다. 곧 열립니다.</p>
            </div>
          ) : (
            <CategoryBrowser categories={categories} byTopic={byTopic} />
          )
        }
      </AsyncView>
    </div>
  );
}
