import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, userMessage } from '../api/client';
import { startMock } from '../api/mock';
import { fetchPrefs } from '../api/quiz';
import type { Tier } from '../api/types';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { TIER_LABEL, TIERS } from '../lib/labels';
import { mockPath, quizStartPath } from '../routes';
import { loginUrl, useSession, useSessionKey } from '../session/SessionProvider';

/** 눌러서 고르는 알약(시험 시작 화면과 같은 모양). 안쪽은 진짜 입력이라 접근 이름·키보드는 그대로다. */
const PILL =
  'relative inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[var(--color-text)] ' +
  'has-[:checked]:border-[var(--color-accent)] has-[:checked]:bg-[var(--color-accent)] has-[:checked]:font-semibold has-[:checked]:text-[var(--color-accent-contrast)] ' +
  'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--color-accent)]';

/** 기본값(docs/M7-PLAN.md Q1): 본 질문 3개, 꼬리 2단계 — 최대 12턴, 약 15분. */
const MAINS = [1, 2, 3, 4, 5] as const;
const DEPTHS = [0, 1, 2, 3] as const;
const DEFAULT_MAINS = 3;
const DEFAULT_DEPTH = 2;
const DEPTH_HINT: Record<number, string> = { 0: '꼬리질문 없이 본 질문만', 1: '한 번 더 묻기', 2: '두 번까지 파고들기', 3: '세 번까지 파고들기' };

function Choice({ name, label, checked, onChange }: { name: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className={PILL}>
      <input type="radio" name={name} className="absolute inset-0 size-full cursor-pointer opacity-0" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className={PILL}>
      <input type="checkbox" className="absolute inset-0 size-full cursor-pointer opacity-0" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function StartForm({ includeUnlearnedDefault }: { includeUnlearnedDefault: boolean }) {
  const navigate = useNavigate();
  const { markAnonymous } = useSession();
  const [mains, setMains] = useState(DEFAULT_MAINS);
  const [depth, setDepth] = useState(DEFAULT_DEPTH);
  const [tiers, setTiers] = useState<Set<Tier>>(new Set());
  const [includeUnlearned, setIncludeUnlearned] = useState(includeUnlearnedDefault);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; poolEmpty: boolean } | null>(null);

  function toggleTier(t: Tier) {
    const next = new Set(tiers);
    if (next.has(t)) {
      next.delete(t);
    } else {
      next.add(t);
    }
    setTiers(next);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const id = crypto.randomUUID();
      await startMock(id, { mainCount: mains, maxDepth: depth, includeUnlearned, ...(tiers.size > 0 ? { tiers: [...tiers] } : {}) });
      navigate(mockPath(id));
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) {
        markAnonymous();
      }
      setError({
        message: err instanceof ApiError ? userMessage(err) : '모의면접을 시작하지 못했습니다. 다시 시도해 주세요.',
        poolEmpty: err instanceof ApiError && err.code === 'QUIZ-400-02',
      });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-6">
      <fieldset className="space-y-2">
        <legend className="font-bold">본 질문 수</legend>
        <div className="flex flex-wrap gap-2">
          {MAINS.map((n) => (
            <Choice key={n} name="mains" label={`${n}개`} checked={mains === n} onChange={() => setMains(n)} />
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="font-bold">꼬리질문 깊이</legend>
        <div className="flex flex-wrap gap-2">
          {DEPTHS.map((n) => (
            <Choice key={n} name="depth" label={`${n}단계`} checked={depth === n} onChange={() => setDepth(n)} />
          ))}
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          {DEPTH_HINT[depth]} · 최대 {mains * (depth + 1)}문항
        </p>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="font-bold">본 질문 난이도 (고르지 않으면 전부)</legend>
        <div className="flex flex-wrap gap-2">
          {TIERS.map((t) => (
            <Toggle key={t} label={TIER_LABEL[t]} checked={tiers.has(t)} onChange={() => toggleTier(t)} />
          ))}
        </div>
      </fieldset>

      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" className="size-5" checked={includeUnlearned} onChange={(e) => setIncludeUnlearned(e.target.checked)} />
        <span>아직 학습함으로 체크하지 않은 질문도 본 질문으로 내기</span>
      </label>

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
        disabled={busy}
        className="min-h-11 rounded-md bg-[var(--color-accent)] px-6 font-semibold text-[var(--color-accent-contrast)] disabled:opacity-60"
      >
        {busy ? '시작하는 중…' : '모의면접 시작'}
      </button>
    </form>
  );
}

function Loaded() {
  const prefs = useApi('prefs', (signal) => fetchPrefs(signal));
  // 설정은 보조 정보다: 못 불러와도 기본값(꺼짐)으로 시작할 수 있다
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (prefs.state.status !== 'loading') {
      setSettled(true);
    }
  }, [prefs.state.status]);
  return settled ? (
    <StartForm includeUnlearnedDefault={prefs.state.status === 'success' && prefs.state.data.includeUnlearnedDefault} />
  ) : (
    <p role="status" className="py-8 text-center text-[var(--color-muted)]">
      불러오는 중…
    </p>
  );
}

export function MockStartPage() {
  useDocumentTitle('꼬리질문 모의면접');
  const session = useSessionKey();
  const { state, refresh } = useSession();
  return (
    <div>
      <h1 className="text-2xl font-bold">꼬리질문 모의면접</h1>
      <p className="mt-1 text-[var(--color-muted)]">
        본 질문에 답하면 면접관처럼 이어서 묻습니다. 맞으면 한 단계 더 파고들고, 막히면 먼저 알아야 할 기초를 확인한 뒤 다음 질문으로 넘어갑니다.
        꼬리질문은 사람이 검수해 연결해 둔 질문에서 고릅니다.
      </p>
      <p className="text-sm">
        질문을 하나씩 따로 풀고 싶다면{' '}
        <Link to={quizStartPath()} className="inline-flex min-h-11 items-center">
          랜덤 시험
        </Link>
        을 이용하세요.
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
            <p>모의면접은 로그인한 뒤에 볼 수 있습니다. 학습함으로 체크한 질문에서 본 질문을 냅니다.</p>
            <a href={loginUrl('/mock')} className="mt-2 inline-flex min-h-11 items-center font-semibold">
              로그인하고 모의면접 보기
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
