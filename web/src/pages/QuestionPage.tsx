import { useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { fetchQuestion } from '../api/catalog';
import type { QuestionDetail } from '../api/types';
import { AsyncView } from '../components/AsyncView';
import { ConceptList, ExtraFlag, ImportanceBadge, KeywordList, TierBadge } from '../components/Chips';
import { LearnedCheckbox } from '../components/LearnedCheckbox';
import { NoteEditor } from '../components/NoteEditor';
import { RefList } from '../components/RefList';
import { QuestionSources, TopicSources } from '../components/Sources';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useLearned } from '../hooks/useLearned';
import { loginUrl, useSessionKey } from '../session/SessionProvider';
import { reviewedDate } from '../lib/labels';
import { LazyMarkdown } from '../markdown/LazyMarkdown';
import { questionPath, topicPath } from '../routes';

function QuestionContent({ q }: { q: QuestionDetail }) {
  useDocumentTitle(q.title);
  const reviewed = reviewedDate(q.reviewedAt);
  const session = useSessionKey();
  const { pathname, search } = useLocation();
  const server = useMemo(() => new Map([[q.slug, q.learned === true]]), [q.slug, q.learned]);
  const learned = useLearned(server, `${q.slug}:${session.key}`);
  return (
    <article>
      <nav aria-label="경로" className="mb-3 text-sm">
        <Link to="/" className="inline-flex min-h-11 items-center">
          처음
        </Link>
        <span aria-hidden="true"> › </span>
        <Link to={topicPath(q.topicSlug)} className="inline-flex min-h-11 items-center">
          {q.topicName}
        </Link>
      </nav>

      <h1 className="text-2xl font-bold">{q.title}</h1>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <TierBadge tier={q.tier} />
        <ImportanceBadge importance={q.importance} />
        {q.hasExtra && <ExtraFlag />}
      </div>

      <div className="mt-3">
        {session.authenticated ? (
          <LearnedCheckbox checked={learned.isLearned(q.slug)} onChange={(next) => learned.toggle(q.slug, next)} title={q.title} />
        ) : session.ready ? (
          <a href={loginUrl(pathname + search)} className="inline-flex min-h-11 items-center">
            로그인하고 학습 체크하기
          </a>
        ) : null}
        {learned.message && (
          <p role="status" aria-live="polite" className="text-[var(--color-extra)]">
            {learned.message}
          </p>
        )}
      </div>

      {q.status === 'DRAFT' && (
        <p role="note" className="mt-4 rounded-md border border-[var(--color-extra)] p-3 text-[var(--color-extra)]">
          검수 전 초안입니다. 내용이 틀릴 수 있으니 공식 문서와 대조해 읽으세요.
        </p>
      )}
      {q.needsReview && (
        <p role="note" className="mt-4 rounded-md border border-[var(--color-extra)] p-3 text-[var(--color-extra)]">
          검수 뒤에 내용이 바뀌어 다시 확인하는 중입니다.
        </p>
      )}

      <div className="mt-4 space-y-3">
        <KeywordList keywords={q.keywords} />
        <ConceptList concepts={q.concepts} />
      </div>

      <section aria-labelledby="answer-heading" className="mt-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 id="answer-heading" className="mb-1 text-base font-bold">
          모범 답변
        </h2>
        <LazyMarkdown source={q.spokenAnswer} />
      </section>

      {q.detailMd && (
        <details className="mt-4">
          <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold">근거 · 코드 · 실험 설명 보기</summary>
          <div className="mt-2">
            <LazyMarkdown source={q.detailMd} />
          </div>
        </details>
      )}

      <RefList title="먼저 볼 질문" items={q.prerequisites} />
      <RefList title="이어 볼 질문" items={q.followups} />
      <RefList title="관련 질문" items={q.related} />

      {session.authenticated && <NoteEditor slug={q.slug} />}

      <QuestionSources urls={q.sources} />
      <TopicSources sources={q.topicSources} label="이 주제 전체의 출처" />

      <p className="mt-6 text-sm text-[var(--color-muted)]">
        {q.status === 'REVIEWED' ? `검수 완료${reviewed ? ` (${reviewed})` : ''}` : '검수 전'}
        {q.baseVersion ? ` · 기준 버전: ${q.baseVersion}` : ''}
      </p>

      {(q.prevSlug || q.nextSlug) && (
        <nav aria-label="이전·다음 질문" className="mt-6 flex justify-between gap-4 border-t border-[var(--color-border)] pt-3">
          {q.prevSlug ? (
            <Link to={questionPath(q.prevSlug)} rel="prev" className="inline-flex min-h-11 items-center">
              ← 이전 질문
            </Link>
          ) : (
            <span />
          )}
          {q.nextSlug ? (
            <Link to={questionPath(q.nextSlug)} rel="next" className="inline-flex min-h-11 items-center">
              다음 질문 →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </article>
  );
}

export function QuestionPage() {
  const { slug = '' } = useParams();
  const session = useSessionKey();
  const { state, reload } = useApi(`question:${slug}:${session.key}`, (signal) => fetchQuestion(slug, signal), session.ready);
  return (
    <AsyncView state={state} reload={reload} notFoundMessage="찾을 수 없는 질문입니다.">
      {(q) => <QuestionContent q={q} />}
    </AsyncView>
  );
}
