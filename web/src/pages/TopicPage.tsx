import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { fetchConcepts, fetchTopic } from '../api/catalog';
import { ApiError, userMessage } from '../api/client';
import { putTopicLearned } from '../api/progress';
import type { TopicView } from '../api/types';
import { AsyncView } from '../components/AsyncView';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FilterIcon } from '../components/icons';
import { ProgressBar } from '../components/ProgressBar';
import { QuestionCard } from '../components/QuestionCard';
import { Segmented } from '../components/Segmented';
import { Sheet } from '../components/Sheet';
import { TopicSources } from '../components/Sources';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useLearned } from '../hooks/useLearned';
import { conceptsIn, filterQuestions, isFiltered, parseFilters, tierCounts, toSearchParams, EMPTY_FILTERS, type Filters, type ImportanceFilter, type LearnedFilter } from '../lib/filter';
import { TIER_LABEL, TIERS } from '../lib/labels';
import { loginUrl, useSession, useSessionKey } from '../session/SessionProvider';
import { useLocation } from 'react-router-dom';

const FIELD = 'min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base';

function toggleClass(on: boolean): string {
  return `min-h-11 rounded-full border px-4 text-sm ${
    on ? 'border-[var(--color-accent)] bg-[var(--color-accent)] font-semibold text-[var(--color-accent-contrast)]' : 'border-[var(--color-border)] bg-[var(--color-surface)]'
  }`;
}

interface ContentProps {
  view: TopicView;
  conceptNames: Map<string, string>;
  /** 일괄 확인창이 409 로 닫힌 뒤 다시 받은 데이터로 확인창을 다시 열 때의 방향 */
  reopenBulk: boolean | null;
  onBulkConflict: (learned: boolean) => void;
  onReopened: () => void;
}

function TopicContent({ view, conceptNames, reopenBulk, onBulkConflict, onReopened }: ContentProps) {
  useDocumentTitle(view.summary.name);
  const [params, setParams] = useSearchParams();
  const { pathname, search } = useLocation();
  const session = useSessionKey();
  const { markAnonymous } = useSession();
  const filters = parseFilters(params);
  const update = (patch: Partial<Filters>) => setParams(toSearchParams({ ...filters, ...patch }), { replace: true });

  const questions = view.questions;
  const server = useMemo(() => new Map(questions.map((q) => [q.slug, q.learned === true])), [questions]);
  const learned = useLearned(server, `${view.summary.slug}:${session.key}:${questions.length}`);
  const isLearned = (q: { slug: string }) => learned.isLearned(q.slug);
  const shown = filterQuestions(questions, filters, isLearned);
  const counts = tierCounts(questions, filters, isLearned);
  const concepts = conceptsIn(questions);
  const learnedCount = questions.filter(isLearned).length;

  // 주제 일괄 체크/해제: 확인창(취소가 기본 포커스)을 거쳐, 확인창에 보여 준 개수를 서버에 함께 보낸다
  const [sheetOpen, setSheetOpen] = useState(false);
  const filterButton = useRef<HTMLButtonElement>(null);
  // 시트 밖에서 한눈에 보이는 "적용한 필터"(난이도·검색어는 이미 화면에 있으니 제외). 누르면 그 필터만 푼다
  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  if (filters.importance !== 'all') {
    activeChips.push({ key: 'imp', label: { all: '', '3': '꼭 나와요만', ge2: '자주 나와요 이상', none: '필수도 미분류' }[filters.importance], clear: () => update({ importance: 'all' }) });
  }
  if (filters.extraOnly) {
    activeChips.push({ key: 'extra', label: '공식 문서 밖 설명', clear: () => update({ extraOnly: false }) });
  }
  if (filters.concept) {
    activeChips.push({ key: 'concept', label: `개념: ${conceptNames.get(filters.concept) ?? filters.concept}`, clear: () => update({ concept: '' }) });
  }
  if (session.authenticated && filters.learned !== 'all') {
    activeChips.push({ key: 'ls', label: filters.learned === 'yes' ? '학습함' : '아직 안 함', clear: () => update({ learned: 'all' }) });
  }
  const [bulk, setBulk] = useState<boolean | null>(null);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  // 확인창이 닫히면 포커스를 돌려줄, 마지막으로 누른 일괄 버튼
  const triggerRef = useRef<HTMLElement | null>(null);
  const openBulk = (target: boolean, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setBulk(target);
  };
  useEffect(() => {
    if (reopenBulk !== null) {
      setBulk(reopenBulk);
      onReopened();
    }
  }, [reopenBulk, onReopened]);

  async function confirmBulk() {
    if (bulk === null || bulkBusy) {
      return;
    }
    const target = bulk;
    setBulkBusy(true);
    try {
      await putTopicLearned(view.summary.slug, target, questions.length);
      learned.setMany(questions.map((q) => q.slug), target);
      setBulkMessage(`${questions.length}개 질문을 ${target ? '학습함으로 표시' : '학습 표시 해제'}했습니다.`);
      setBulk(null);
    } catch (e) {
      setBulk(null);
      if (e instanceof ApiError && e.status === 409) {
        setBulkMessage('질문 수가 바뀌었습니다. 다시 확인해 주세요.');
        onBulkConflict(target);
      } else {
        if (e instanceof ApiError && e.isUnauthorized) {
          markAnonymous();
        }
        setBulkMessage(e instanceof ApiError ? userMessage(e) : '저장하지 못했습니다. 다시 시도해 주세요.');
      }
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{view.summary.name}</h1>
      <p className="mt-1 text-[var(--color-muted)]">{view.summary.description}</p>
      {view.summary.baseVersion && <p className="mt-1 text-sm text-[var(--color-muted)]">기준 버전: {view.summary.baseVersion}</p>}

      {session.authenticated && (
        <section aria-label="내 학습 진도" className="mt-4 space-y-2">
          <ProgressBar value={learnedCount} max={questions.length} label={`${view.summary.name} 학습 진도`} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={questions.length === 0 || bulkBusy}
              onClick={(e) => openBulk(true, e.currentTarget)}
              className="min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4"
            >
              모두 학습함으로 표시
            </button>
            <button
              type="button"
              disabled={questions.length === 0 || bulkBusy}
              onClick={(e) => openBulk(false, e.currentTarget)}
              className="min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4"
            >
              모두 해제
            </button>
          </div>
        </section>
      )}
      {(learned.message || bulkMessage) && (
        <p role="status" aria-live="polite" className="mt-2 text-[var(--color-extra)]">
          {learned.message ?? bulkMessage}
        </p>
      )}

      <section aria-label="필터" className="mt-5 space-y-3">
        <Segmented
          label="난이도 구분"
          value={filters.tier}
          onChange={(tier) => update({ tier })}
          options={[{ value: 'ALL' as const, label: '전체', count: counts.ALL }, ...TIERS.map((t) => ({ value: t, label: TIER_LABEL[t], count: counts[t] }))]}
        />
        <div className="flex flex-wrap gap-2">
          {/* 자주 쓰는 필터는 시트를 열지 않고 바로 켠다 */}
          <button
            type="button"
            aria-pressed={filters.importance === '3'}
            onClick={() => update({ importance: filters.importance === '3' ? 'all' : '3' })}
            className={toggleClass(filters.importance === '3')}
          >
            꼭 나와요만 보기
          </button>
        </div>
        <div className="flex gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">이 주제에서 찾기</span>
            <input
              type="search"
              value={filters.text}
              onChange={(e) => update({ text: e.target.value })}
              maxLength={100}
              autoComplete="off"
              placeholder="이 주제에서 찾기"
              className={`${FIELD} w-full`}
            />
          </label>
          <button
            ref={filterButton}
            type="button"
            onClick={() => setSheetOpen(true)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
          >
            <FilterIcon />
            <span>필터{activeChips.length > 0 ? ` ${activeChips.length}` : ''}</span>
          </button>
        </div>

        {activeChips.length > 0 && (
          <ul aria-label="적용한 필터" className="flex flex-wrap items-center gap-2">
            {activeChips.map((chip) => (
              <li key={chip.key}>
                <button
                  type="button"
                  aria-label={`필터 해제: ${chip.label}`}
                  onClick={chip.clear}
                  className="inline-flex min-h-11 items-center gap-1 rounded-full border border-[var(--color-accent)] px-3 text-sm text-[var(--color-accent)]"
                >
                  {chip.label} <span aria-hidden="true">✕</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {isFiltered(filters) && (
          <button type="button" onClick={() => setParams(toSearchParams(EMPTY_FILTERS), { replace: true })} className="min-h-11 underline">
            필터 초기화
          </button>
        )}
      </section>

      <Sheet open={sheetOpen} title="필터" onClose={() => setSheetOpen(false)} returnFocusTo={filterButton}>
        <div className="space-y-4">
          <label className="flex flex-col gap-1">
            <span className="font-semibold">필수도</span>
            <select value={filters.importance} onChange={(e) => update({ importance: e.target.value as ImportanceFilter })} className={FIELD}>
              <option value="all">전체</option>
              <option value="3">꼭 나와요만 (3)</option>
              <option value="ge2">자주 나와요 이상 (2~3)</option>
              <option value="none">미분류</option>
            </select>
          </label>
          {session.authenticated && (
            <label className="flex flex-col gap-1">
              <span className="font-semibold">내 체크 상태</span>
              <select value={filters.learned} onChange={(e) => update({ learned: e.target.value as LearnedFilter })} className={FIELD}>
                <option value="all">전체</option>
                <option value="yes">학습함</option>
                <option value="no">아직 안 함</option>
              </select>
            </label>
          )}
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" checked={filters.extraOnly} onChange={(e) => update({ extraOnly: e.target.checked })} className="size-5" />
            <span>공식 문서 밖 설명이 있는 질문만</span>
          </label>
          {concepts.length > 0 && (
            <div role="group" aria-label="개념" className="space-y-2">
              <p className="font-semibold">개념</p>
              <div className="flex flex-wrap gap-2">
                {concepts.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={filters.concept === c}
                    onClick={() => update({ concept: filters.concept === c ? '' : c })}
                    className={toggleClass(filters.concept === c)}
                  >
                    {conceptNames.get(c) ?? c}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <button type="button" onClick={() => setSheetOpen(false)} className="min-h-11 rounded-md bg-[var(--color-accent)] px-5 font-semibold text-[var(--color-accent-contrast)]">
              질문 {shown.length}개 보기
            </button>
            {isFiltered(filters) && (
              <button type="button" onClick={() => setParams(toSearchParams(EMPTY_FILTERS), { replace: true })} className="min-h-11 rounded-md border border-[var(--color-border)] px-4">
                모두 초기화
              </button>
            )}
          </div>
        </div>
      </Sheet>

      <p role="status" aria-live="polite" className="mt-4 text-sm text-[var(--color-muted)]">
        질문 {shown.length}개{isFiltered(filters) ? ` (전체 ${questions.length}개 중)` : ''}
      </p>

      {shown.length === 0 ? (
        <p className="py-6 text-center text-[var(--color-muted)]">조건에 맞는 질문이 없습니다.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {shown.map((q) => (
            <QuestionCard
              key={q.slug}
              question={q}
              learned={session.authenticated ? { checked: learned.isLearned(q.slug), onChange: (next) => learned.toggle(q.slug, next) } : undefined}
            />
          ))}
        </ul>
      )}
      {session.authenticated === false && session.ready && (
        <p className="mt-4 text-sm text-[var(--color-muted)]">
          <a href={loginUrl(pathname + search)} className="inline-flex min-h-11 items-center">
            로그인하고 학습 체크하기
          </a>
        </p>
      )}

      <ConfirmDialog
        open={bulk !== null}
        title={bulk ? '모두 학습함으로 표시' : '학습 표시를 모두 해제'}
        confirmLabel={bulk ? '표시하기' : '해제하기'}
        onConfirm={() => void confirmBulk()}
        onCancel={() => setBulk(null)}
        returnFocusTo={triggerRef}
      >
        <p>
          {questions.length}개 질문을 {bulk ? '학습 완료로 표시합니다.' : '학습 표시에서 해제합니다.'}
        </p>
      </ConfirmDialog>

      <TopicSources sources={view.sources} />
    </div>
  );
}

export function TopicPage() {
  const { topic = '' } = useParams();
  const session = useSessionKey();
  const { state, reload } = useApi(`topic:${topic}:${session.key}`, (signal) => fetchTopic(topic, signal), session.ready);
  // 일괄 확인창이 개수 불일치(409)로 닫히면 데이터를 다시 받고, 새 개수로 같은 확인창을 다시 연다(화면이 로딩으로 바뀌어도 잊지 않도록 여기서 쥔다)
  const [reopen, setReopen] = useState<boolean | null>(null);
  const clearReopen = useCallback(() => setReopen(null), []);
  // 개념 이름은 보조 정보다: 못 불러와도 slug 로 보여 주고 화면은 계속 쓸 수 있다
  const concepts = useApi('concepts', (signal) => fetchConcepts(signal));
  const names = new Map<string, string>(concepts.state.status === 'success' ? concepts.state.data.map((c) => [c.slug, c.name]) : []);
  return (
    <AsyncView state={state} reload={reload} notFoundMessage="찾을 수 없는 주제입니다.">
      {(view) => (
        <TopicContent
          view={view}
          conceptNames={names}
          reopenBulk={reopen}
          onBulkConflict={(learned) => {
            setReopen(learned);
            reload();
          }}
          onReopened={clearReopen}
        />
      )}
    </AsyncView>
  );
}
