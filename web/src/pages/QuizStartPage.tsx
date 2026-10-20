import { useEffect, useId, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchCategories } from '../api/catalog';
import { ApiError, userMessage } from '../api/client';
import { fetchPrefs, startQuiz } from '../api/quiz';
import type { QuizMode, Tier } from '../api/types';
import { AsyncView } from '../components/AsyncView';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { TIER_LABEL, TIERS } from '../lib/labels';
import { quizPath, skimPath } from '../routes';
import { loginUrl, useSession, useSessionKey } from '../session/SessionProvider';

const FIELD = 'min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base';
const MAX_COUNT = 30;
/** 시험 범위에서 "내 질문" 을 고르는 가짜 주제(서버와 같은 값). 고르지 않으면 주제 필터가 없을 때만 내 질문이 들어간다. */
const MINE_TOPIC = '@mine';

function newSessionId(): string {
  return crypto.randomUUID();
}

interface FormProps {
  categories: { slug: string; name: string; topics: { slug: string; name: string }[] }[];
  includeUnlearnedDefault: boolean;
}

function StartForm({ categories, includeUnlearnedDefault }: FormProps) {
  const navigate = useNavigate();
  const { markAnonymous } = useSession();
  const countId = useId();
  const [count, setCount] = useState('10');
  const [includeUnlearned, setIncludeUnlearned] = useState(includeUnlearnedDefault);
  const [random, setRandom] = useState(false);
  const [topics, setTopics] = useState<Set<string>>(new Set());
  const [tiers, setTiers] = useState<Set<Tier>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; poolEmpty: boolean } | null>(null);

  const n = Number(count);
  const countOk = Number.isInteger(n) && n >= 1 && n <= MAX_COUNT;

  function toggle<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    setter(next);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!countOk || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const id = newSessionId();
      await startQuiz(id, {
        count: n,
        includeUnlearned,
        ...(topics.size > 0 ? { topics: [...topics] } : {}),
        ...(tiers.size > 0 ? { tiers: [...tiers] } : {}),
        mode: (random ? 'RANDOM' : 'WEIGHTED') satisfies QuizMode,
      });
      navigate(quizPath(id));
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) {
        markAnonymous();
      }
      setError({ message: err instanceof ApiError ? userMessage(err) : '시험을 시작하지 못했습니다. 다시 시도해 주세요.', poolEmpty: err instanceof ApiError && err.code === 'QUIZ-400-01' });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-6">
      <fieldset className="space-y-2">
        <legend className="font-bold">주제 (고르지 않으면 전부)</legend>
        {categories.map((c) => (
          <div key={c.slug} role="group" aria-label={c.name} className="space-y-1">
            <p className="text-sm text-[var(--color-muted)]">{c.name}</p>
            <div className="flex flex-wrap gap-x-4">
              {c.topics.map((t) => (
                <label key={t.slug} className="flex min-h-11 items-center gap-2">
                  <input type="checkbox" className="size-5" checked={topics.has(t.slug)} onChange={() => toggle(topics, t.slug, setTopics)} />
                  <span>{t.name}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        <div role="group" aria-label="내 질문" className="space-y-1">
          <p className="text-sm text-[var(--color-muted)]">내 질문</p>
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" className="size-5" checked={topics.has(MINE_TOPIC)} onChange={() => toggle(topics, MINE_TOPIC, setTopics)} />
            <span>내 질문</span>
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-wrap items-center gap-x-4">
        <legend className="font-bold">난이도 (고르지 않으면 전부)</legend>
        {TIERS.map((t) => (
          <label key={t} className="flex min-h-11 items-center gap-2">
            <input type="checkbox" className="size-5" checked={tiers.has(t)} onChange={() => toggle(tiers, t, setTiers)} />
            <span>{TIER_LABEL[t]}</span>
          </label>
        ))}
      </fieldset>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <label htmlFor={countId} className="flex items-center gap-2">
          <span className="font-bold">문제 수</span>
          <input
            id={countId}
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_COUNT}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            aria-invalid={!countOk}
            className={`${FIELD} w-24`}
          />
          <span className="text-sm text-[var(--color-muted)]">(1~{MAX_COUNT})</span>
        </label>
        {!countOk && (
          <p role="alert" className="text-[var(--color-extra)]">
            문제 수는 1~{MAX_COUNT} 사이의 정수여야 합니다.
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" className="size-5" checked={includeUnlearned} onChange={(e) => setIncludeUnlearned(e.target.checked)} />
          <span>아직 학습함으로 체크하지 않은 질문도 포함</span>
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" className="size-5" checked={random} onChange={(e) => setRandom(e.target.checked)} />
          <span>완전 무작위(오래 안 나왔거나 자주 틀린 질문을 더 내지 않음)</span>
        </label>
      </div>

      {error && (
        <div role="alert" className="rounded-md border border-[var(--color-extra)] p-3 text-[var(--color-extra)]">
          <p>{error.message}</p>
          {error.poolEmpty && (
            <p className="mt-1">
              <Link to="/" className="inline-flex min-h-11 items-center underline">
                질문 은행에서 학습한 질문을 체크하기
              </Link>
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={!countOk || busy}
        className="min-h-11 rounded-md bg-[var(--color-accent)] px-6 font-semibold text-[var(--color-accent-contrast)] disabled:opacity-60"
      >
        {busy ? '시작하는 중…' : '시험 시작'}
      </button>
    </form>
  );
}

function Loaded() {
  const categories = useApi('categories', (signal) => fetchCategories(signal));
  const prefs = useApi('prefs', (signal) => fetchPrefs(signal));
  // 설정은 보조 정보다: 못 불러와도 기본값(꺼짐)으로 시험을 볼 수 있다
  const [prefsSettled, setPrefsSettled] = useState(false);
  useEffect(() => {
    if (prefs.state.status !== 'loading') {
      setPrefsSettled(true);
    }
  }, [prefs.state.status]);
  return (
    <AsyncView state={categories.state} reload={categories.reload}>
      {(data) =>
        prefsSettled ? (
          <StartForm categories={data} includeUnlearnedDefault={prefs.state.status === 'success' && prefs.state.data.includeUnlearnedDefault} />
        ) : (
          <p role="status" className="py-8 text-center text-[var(--color-muted)]">
            불러오는 중…
          </p>
        )
      }
    </AsyncView>
  );
}

export function QuizStartPage() {
  useDocumentTitle('시험');
  const session = useSessionKey();
  const { state, refresh } = useSession();
  return (
    <div>
      <h1 className="text-2xl font-bold">시험 보기</h1>
      <p className="mt-1 text-[var(--color-muted)]">학습함으로 체크한 질문 중에서 무작위로 묻습니다. 내 답을 말해 본 뒤 모범 답변과 비교해 맞음·틀림을 스스로 고릅니다.</p>
      <p className="text-sm">
        기록 없이 가볍게 보고 싶다면{' '}
        <Link to={skimPath()} className="inline-flex min-h-11 items-center">
          주제별 훑기
        </Link>
        를 이용하세요(로그인 없이 가능).
      </p>
      <div className="mt-6">
        {!session.ready ? (
          <p role="status" className="py-8 text-center text-[var(--color-muted)]">
            불러오는 중…
          </p>
        ) : session.authenticated ? (
          <Loaded />
        ) : state.status === 'error' ? (
          <div role="alert" className="py-4">
            <p>로그인 상태를 확인하지 못했습니다.</p>
            <button type="button" onClick={refresh} className="mt-2 min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4">
              다시 시도
            </button>
          </div>
        ) : (
          <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p>시험은 로그인한 뒤에 볼 수 있습니다. 질문을 학습함으로 체크한 기록으로 문제를 냅니다.</p>
            <a href={loginUrl('/quiz')} className="mt-2 inline-flex min-h-11 items-center font-semibold">
              로그인하고 시험 보기
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
