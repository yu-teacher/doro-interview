import { useMemo, useState } from 'react';
import { TitleText } from '../components/TitleText';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { fetchCategories, fetchTopic } from '../api/catalog';
import type { QuestionSummary, Tier, TopicView } from '../api/types';
import { AsyncView } from '../components/AsyncView';
import { TierBadge } from '../components/Chips';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { TIER_LABEL, TIERS } from '../lib/labels';
import { questionPath, skimPath } from '../routes';

const BUTTON = 'min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4';
const PRIMARY = 'min-h-11 rounded-md bg-[var(--color-accent)] px-4 font-semibold text-[var(--color-accent-contrast)]';

/** 훑기: 주제를 고른다. 로그인도 서버 기록도 없다. */
export function SkimPage() {
  useDocumentTitle('훑기');
  const { state, reload } = useApi('categories', (signal) => fetchCategories(signal));
  return (
    <div>
      <h1 className="text-2xl font-bold">주제별 훑기</h1>
      <p className="mt-1 text-[var(--color-muted)]">질문 제목만 보고 키워드를 떠올린 뒤, 키워드를 열어 스스로 확인합니다. 어떤 기록도 남기지 않습니다.</p>
      <div className="mt-4">
        <AsyncView state={state} reload={reload}>
          {(categories) => (
            <div className="space-y-4">
              {categories.map((c) => (
                <section key={c.slug} aria-label={c.name}>
                  <h2 className="font-bold">{c.name}</h2>
                  <ul>
                    {c.topics.map((t) => (
                      <li key={t.slug}>
                        <Link to={skimPath(t.slug)} className="inline-flex min-h-11 items-center">
                          {t.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </AsyncView>
      </div>
    </div>
  );
}

/** 서버 응답은 그대로 두고, 화면 안에서만 순서를 섞는다(Fisher–Yates). */
function shuffled<T>(items: readonly T[]): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function Deck({ view, tier }: { view: TopicView; tier: Tier | null }) {
  const pool = useMemo(() => shuffled(view.questions.filter((q) => tier === null || q.tier === tier)), [view, tier]);
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  const [unsure, setUnsure] = useState<QuestionSummary[]>([]);

  if (pool.length === 0) {
    return <p>고른 난이도의 질문이 없습니다.</p>;
  }
  if (index >= pool.length) {
    return (
      <section aria-labelledby="skim-done">
        <h2 id="skim-done" className="text-xl font-bold">
          끝났습니다
        </h2>
        <p>
          {pool.length}문제 중 {pool.length - unsure.length}문제는 알았고, {unsure.length}문제는 다시 볼 필요가 있습니다.
        </p>
        {unsure.length > 0 && (
          <ul className="mt-2">
            {unsure.map((q) => (
              <li key={q.slug}>
                <Link to={questionPath(q.slug)} className="inline-flex min-h-11 items-center">
                  <TitleText text={q.title} />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={PRIMARY}
            onClick={() => {
              setIndex(0);
              setShown(false);
              setUnsure([]);
            }}
          >
            처음부터 다시
          </button>
          <Link to={skimPath()} className="inline-flex min-h-11 items-center">
            다른 주제 고르기
          </Link>
        </div>
      </section>
    );
  }

  const q = pool[index];
  function next(knew: boolean) {
    if (!knew) {
      setUnsure((prev) => [...prev, q]);
    }
    setShown(false);
    setIndex((i) => i + 1);
  }

  return (
    <section aria-labelledby="skim-q">
      <p className="text-sm text-[var(--color-muted)]">
        {index + 1} / {pool.length}
      </p>
      <h2 id="skim-q" className="mt-1 text-xl font-bold">
        <TierBadge tier={q.tier} /> <TitleText text={q.title} />
      </h2>
      {!shown ? (
        <button type="button" className={`${PRIMARY} mt-4`} onClick={() => setShown(true)}>
          키워드 보기
        </button>
      ) : (
        <div className="mt-4">
          <h3 className="font-semibold">키워드</h3>
          {q.keywords.length === 0 ? (
            <p className="text-[var(--color-muted)]">이 질문에는 키워드가 없습니다.</p>
          ) : (
            <ul className="mt-1 flex flex-wrap gap-2">
              {q.keywords.map((k) => (
                <li key={k} className="rounded-full border border-[var(--color-border)] px-3 py-1">
                  {k}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={PRIMARY} onClick={() => next(true)}>
              알았음
            </button>
            <button type="button" className={BUTTON} onClick={() => next(false)}>
              모르겠음
            </button>
          </div>
          <p className="mt-2 text-sm">
            <Link to={questionPath(q.slug)} className="inline-flex min-h-11 items-center">
              모범 답변은 질문 화면에서
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}

export function SkimTopicPage() {
  const { topic = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const tierParam = params.get('tier');
  const tier = TIERS.find((t) => t === tierParam) ?? null;
  const { state, reload } = useApi(`skim:${topic}`, (signal) => fetchTopic(topic, signal));
  useDocumentTitle(state.status === 'success' ? `${state.data.summary.name} 훑기` : '훑기');
  return (
    <AsyncView state={state} reload={reload} notFoundMessage="찾을 수 없는 주제입니다.">
      {(view) => (
        <div>
          <h1 className="text-2xl font-bold">{view.summary.name} 훑기</h1>
          <div role="group" aria-label="난이도" className="mt-3 flex flex-wrap gap-2">
            {[null, ...TIERS].map((t) => (
              <button
                key={t ?? 'all'}
                type="button"
                aria-pressed={tier === t}
                onClick={() => setParams(t === null ? {} : { tier: t }, { replace: true })}
                className={`min-h-11 rounded-full border px-4 text-sm ${
                  tier === t ? 'border-[var(--color-accent)] bg-[var(--color-accent)] font-semibold text-[var(--color-accent-contrast)]' : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                }`}
              >
                {t === null ? '전체' : TIER_LABEL[t]}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Deck key={`${view.summary.slug}:${tier ?? 'all'}`} view={view} tier={tier} />
          </div>
        </div>
      )}
    </AsyncView>
  );
}
