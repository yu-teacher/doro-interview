import { useSearchParams, useParams } from 'react-router-dom';
import { fetchConcepts, fetchTopic } from '../api/catalog';
import type { TopicView } from '../api/types';
import { AsyncView } from '../components/AsyncView';
import { QuestionCard } from '../components/QuestionCard';
import { TopicSources } from '../components/Sources';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { conceptsIn, filterQuestions, isFiltered, parseFilters, tierCounts, toSearchParams, EMPTY_FILTERS, type Filters, type ImportanceFilter } from '../lib/filter';
import { TIER_LABEL, TIERS } from '../lib/labels';

const FIELD = 'min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base';

function toggleClass(on: boolean): string {
  return `min-h-11 rounded-full border px-4 text-sm ${
    on ? 'border-[var(--color-accent)] bg-[var(--color-accent)] font-semibold text-[var(--color-accent-contrast)]' : 'border-[var(--color-border)] bg-[var(--color-surface)]'
  }`;
}

function TopicContent({ view, conceptNames }: { view: TopicView; conceptNames: Map<string, string> }) {
  useDocumentTitle(view.summary.name);
  const [params, setParams] = useSearchParams();
  const filters = parseFilters(params);
  const update = (patch: Partial<Filters>) => setParams(toSearchParams({ ...filters, ...patch }), { replace: true });

  const questions = view.questions;
  const shown = filterQuestions(questions, filters);
  const counts = tierCounts(questions, filters);
  const concepts = conceptsIn(questions);

  return (
    <div>
      <h1 className="text-2xl font-bold">{view.summary.name}</h1>
      <p className="mt-1 text-[var(--color-muted)]">{view.summary.description}</p>
      {view.summary.baseVersion && <p className="mt-1 text-sm text-[var(--color-muted)]">기준 버전: {view.summary.baseVersion}</p>}

      <section aria-label="필터" className="mt-5 space-y-3">
        <div role="group" aria-label="난이도 구분" className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={filters.tier === 'ALL'} onClick={() => update({ tier: 'ALL' })} className={toggleClass(filters.tier === 'ALL')}>
            전체 ({counts.ALL})
          </button>
          {TIERS.map((t) => (
            <button key={t} type="button" aria-pressed={filters.tier === t} onClick={() => update({ tier: t })} className={toggleClass(filters.tier === t)}>
              {TIER_LABEL[t]} ({counts[t]})
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex min-h-11 items-center gap-2">
            <span>필수도</span>
            <select value={filters.importance} onChange={(e) => update({ importance: e.target.value as ImportanceFilter })} className={FIELD}>
              <option value="all">전체</option>
              <option value="3">필수만 (3)</option>
              <option value="ge2">자주 이상 (2~3)</option>
              <option value="none">미분류</option>
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" checked={filters.extraOnly} onChange={(e) => update({ extraOnly: e.target.checked })} className="size-5" />
            <span>보충이 있는 질문만</span>
          </label>
        </div>

        {concepts.length > 0 && (
          <div role="group" aria-label="개념" className="flex flex-wrap gap-2">
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
        )}

        <label className="flex flex-col gap-1">
          <span>이 주제에서 찾기</span>
          <input type="search" value={filters.text} onChange={(e) => update({ text: e.target.value })} maxLength={100} autoComplete="off" className={`${FIELD} w-full`} />
        </label>

        {isFiltered(filters) && (
          <button type="button" onClick={() => setParams(toSearchParams(EMPTY_FILTERS), { replace: true })} className="min-h-11 underline">
            필터 초기화
          </button>
        )}
      </section>

      <p role="status" aria-live="polite" className="mt-4 text-sm text-[var(--color-muted)]">
        질문 {shown.length}개{isFiltered(filters) ? ` (전체 ${questions.length}개 중)` : ''}
      </p>

      {shown.length === 0 ? (
        <p className="py-6 text-center text-[var(--color-muted)]">조건에 맞는 질문이 없습니다.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {shown.map((q) => (
            <QuestionCard key={q.slug} question={q} />
          ))}
        </ul>
      )}

      <TopicSources sources={view.sources} />
    </div>
  );
}

export function TopicPage() {
  const { topic = '' } = useParams();
  const { state, reload } = useApi(`topic:${topic}`, (signal) => fetchTopic(topic, signal));
  // 개념 이름은 보조 정보다: 못 불러와도 slug 로 보여 주고 화면은 계속 쓸 수 있다
  const concepts = useApi('concepts', (signal) => fetchConcepts(signal));
  const names = new Map<string, string>(concepts.state.status === 'success' ? concepts.state.data.map((c) => [c.slug, c.name]) : []);
  return (
    <AsyncView state={state} reload={reload} notFoundMessage="찾을 수 없는 주제입니다.">
      {(view) => <TopicContent view={view} conceptNames={names} />}
    </AsyncView>
  );
}
