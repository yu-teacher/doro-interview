import { Link } from 'react-router-dom';
import { fetchCategories } from '../api/catalog';
import { fetchProgressSummary } from '../api/progress';
import type { ProgressSummary } from '../api/types';
import { AsyncView } from '../components/AsyncView';
import { CategorySections } from '../components/CategorySections';
import { ReviewList } from '../components/ReviewList';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { loginUrl, useSessionKey } from '../session/SessionProvider';

export function HomePage() {
  useDocumentTitle(null);
  const { state, reload } = useApi('categories', (signal) => fetchCategories(signal));
  const session = useSessionKey();
  // 진도는 보조 정보다: 못 불러와도 사전은 그대로 보인다
  const summary = useApi(`summary:${session.key}`, (signal) => fetchProgressSummary(signal), session.authenticated);
  const progress: ProgressSummary | null = session.authenticated && summary.state.status === 'success' ? summary.state.data : null;
  const byTopic = new Map(progress?.topics.map((t) => [t.topicSlug, t]) ?? []);
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
            {session.authenticated && (
              <>
                <ReviewList limit={5} onReleased={summary.reload} />
                <p className="text-sm">
                  <Link to="/stats" className="inline-flex min-h-11 items-center">
                    내 현황 보기
                  </Link>
                </p>
              </>
            )}
            {session.ready && !session.authenticated && (
              <p className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm">
                로그인하면 완전히 학습한 질문을 체크하고 진도를 볼 수 있습니다.{' '}
                <a href={loginUrl('/')} className="inline-flex min-h-11 items-center font-semibold">
                  로그인
                </a>
              </p>
            )}
            <CategorySections categories={categories} byTopic={byTopic} />
          </div>
        )
      }
    </AsyncView>
  );
}
