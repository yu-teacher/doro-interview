import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteMine, fetchMine, fetchMineQuestion, putMine, putMineBatch } from '../api/mine';
import { ApiError, userMessage } from '../api/client';
import type { MineQuestion, Tier } from '../api/types';
import { AsyncView } from '../components/AsyncView';
import { ReviewBadge, TierBadge } from '../components/Chips';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LearnedCheckbox } from '../components/LearnedCheckbox';
import { EMPTY_DRAFT, MINE_LIMITS, MineForm } from '../components/MineForm';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useLearned } from '../hooks/useLearned';
import { TIER_LABEL, TIERS } from '../lib/labels';
import { minePath, quizStartPath } from '../routes';
import { loginUrl, useSession, useSessionKey } from '../session/SessionProvider';

const BUTTON = 'min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4';
const FIELD = 'min-h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base';
const codePoints = (text: string) => [...text].length;

function SourceBadge({ label }: { label: string }) {
  return <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs">{label}</span>;
}

// ---------------------------------------------------------------------------- 일괄 추가

function BulkForm({ onSaved, remaining }: { onSaved: () => void; remaining: number }) {
  const { markAnonymous } = useSession();
  const [text, setText] = useState('');
  const [tier, setTier] = useState<Tier>('BASIC');
  const [source, setSource] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const titles = text.split('\n').map((l) => l.trim()).filter((l) => l !== '');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) {
      return;
    }
    if (titles.length === 0) {
      setMessage('질문을 한 줄에 하나씩 적어 주세요.');
      return;
    }
    if (titles.length > MINE_LIMITS.batch) {
      setMessage(`한 번에 ${MINE_LIMITS.batch}개까지 추가할 수 있습니다.`);
      return;
    }
    if (titles.length > remaining) {
      setMessage(`내 질문은 ${MINE_LIMITS.perUser}개까지입니다. ${remaining}개만 더 추가할 수 있습니다.`);
      return;
    }
    const tooLong = titles.find((t) => codePoints(t) > MINE_LIMITS.title);
    if (tooLong !== undefined) {
      setMessage(`질문은 ${MINE_LIMITS.title}자까지 쓸 수 있습니다: "${tooLong.slice(0, 20)}…"`);
      return;
    }
    if (codePoints(source.trim()) > MINE_LIMITS.source) {
      setMessage(`출처 표시는 ${MINE_LIMITS.source}자까지 쓸 수 있습니다.`);
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await putMineBatch(titles.map((title) => ({ id: crypto.randomUUID(), title, answerText: '', keywords: [], tier, sourceLabel: source.trim() === '' ? null : source.trim() })));
      setText('');
      setMessage(`${titles.length}개를 추가했습니다.`);
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) {
        markAnonymous();
      }
      setMessage(err instanceof ApiError ? userMessage(err) : '추가하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-3">
      <p className="text-sm text-[var(--color-muted)]">질문을 한 줄에 하나씩 붙여 넣으면 한 번에 추가됩니다. 답은 나중에 각 질문에서 적을 수 있습니다.</p>
      <label className="block">
        <span className="font-semibold">질문 목록</span>
        <textarea value={text} onChange={(e) => { setText(e.target.value); setMessage(null); }} rows={5} className="mt-1 min-h-28 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-base" />
      </label>
      <p className="text-sm text-[var(--color-muted)]">{titles.length}개 (한 번에 최대 {MINE_LIMITS.batch}개)</p>
      <div className="flex flex-wrap gap-4">
        <label className="block">
          <span className="font-semibold">난이도(모두 같게)</span>
          <select value={tier} onChange={(e) => setTier(e.target.value as Tier)} className={`${FIELD} mt-1`}>
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {TIER_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-[12rem] flex-1">
          <span className="font-semibold">출처 표시(모두 같게, 선택)</span>
          <input type="text" value={source} onChange={(e) => setSource(e.target.value)} className={`${FIELD} mt-1`} autoComplete="off" />
        </label>
      </div>
      {message && (
        <p role="status" aria-live="polite" className="text-[var(--color-muted)]">
          {message}
        </p>
      )}
      <button type="submit" disabled={busy} className="min-h-11 rounded-md bg-[var(--color-accent)] px-5 font-semibold text-[var(--color-accent-contrast)] disabled:opacity-60">
        {busy ? '추가하는 중…' : '한 번에 추가'}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------- 목록

function Item({ q, learned }: { q: MineQuestion; learned: ReturnType<typeof useLearned> }) {
  const checked = learned.isLearned(q.slug);
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="min-w-0 flex-1">
        <Link to={minePath(q.id)} className="inline-flex min-h-11 items-center break-words font-semibold no-underline">
          {q.title}
        </Link>
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--color-muted)]">
          <TierBadge tier={q.tier} />
          {q.sourceLabel && <SourceBadge label={q.sourceLabel} />}
          {q.reviewCandidate && checked && <ReviewBadge />}
          {q.answerText === '' && <span>답 없음</span>}
        </div>
      </div>
      <LearnedCheckbox checked={checked} onChange={(next) => learned.toggle(q.slug, next)} title={q.title} compact />
    </li>
  );
}

function List({ items, reload }: { items: MineQuestion[]; reload: () => void }) {
  const session = useSessionKey();
  const server = useMemo(() => new Map(items.map((q) => [q.slug, q.learned])), [items]);
  const learned = useLearned(server, `mine:${session.key}:${items.length}`);
  const [adding, setAdding] = useState<'none' | 'one' | 'bulk'>('none');
  const count = items.filter((q) => learned.isLearned(q.slug)).length;
  const remaining = MINE_LIMITS.perUser - items.length;
  const atLimit = remaining <= 0;

  return (
    <div>
      <p className="text-[var(--color-muted)]">
        {items.length}개 중 {count}개 학습함 · 최대 {MINE_LIMITS.perUser}개 ·{' '}
        <Link to={quizStartPath()} className="inline-flex min-h-11 items-center">
          시험 보기
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={atLimit} aria-expanded={adding === 'one'} onClick={() => setAdding(adding === 'one' ? 'none' : 'one')} className={BUTTON}>
          질문 추가
        </button>
        <button type="button" disabled={atLimit} aria-expanded={adding === 'bulk'} onClick={() => setAdding(adding === 'bulk' ? 'none' : 'bulk')} className={BUTTON}>
          여러 개 한 번에 추가
        </button>
      </div>
      {atLimit && <p className="mt-2 text-[var(--color-extra)]">내 질문은 {MINE_LIMITS.perUser}개까지 만들 수 있습니다. 쓰지 않는 질문을 지운 뒤 추가해 주세요.</p>}
      {adding === 'one' && (
        <section aria-label="질문 추가" className="mt-4 rounded-lg border border-[var(--color-border)] p-4">
          <MineForm
            draftId="new"
            initial={EMPTY_DRAFT}
            submitLabel="추가"
            resetOnSuccess
            onSubmit={async (draft) => {
              await putMine(crypto.randomUUID(), draft);
              reload();
            }}
            onCancel={() => setAdding('none')}
          />
        </section>
      )}
      {adding === 'bulk' && (
        <section aria-label="여러 개 한 번에 추가" className="mt-4 rounded-lg border border-[var(--color-border)] p-4">
          <BulkForm remaining={remaining} onSaved={reload} />
        </section>
      )}
      {learned.message && (
        <p role="status" aria-live="polite" className="mt-3 text-[var(--color-extra)]">
          {learned.message}
        </p>
      )}
      {items.length === 0 ? (
        <p className="mt-6 text-[var(--color-muted)]">아직 추가한 질문이 없습니다. 강사님이 짚어 준 질문이나 직접 만든 질문을 추가해 보세요.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((q) => (
            <Item key={q.id} q={q} learned={learned} />
          ))}
        </ul>
      )}
    </div>
  );
}

function LoginGate({ children, returnTo }: { children: React.ReactNode; returnTo: string }) {
  const session = useSessionKey();
  const { state, refresh } = useSession();
  if (!session.ready) {
    return (
      <p role="status" className="py-8 text-center text-[var(--color-muted)]">
        불러오는 중…
      </p>
    );
  }
  if (session.authenticated) {
    return <>{children}</>;
  }
  if (state.status === 'error') {
    return (
      <div role="alert">
        <p>로그인 상태를 확인하지 못했습니다.</p>
        <button type="button" onClick={refresh} className={`${BUTTON} mt-2`}>
          다시 시도
        </button>
      </div>
    );
  }
  return (
    <p>
      내 질문은 로그인한 뒤에 쓸 수 있습니다.{' '}
      <a href={loginUrl(returnTo)} className="inline-flex min-h-11 items-center font-semibold">
        로그인
      </a>
    </p>
  );
}

function Loaded() {
  const session = useSessionKey();
  const { state, reload } = useApi(`mine:${session.key}`, (signal) => fetchMine(signal));
  return (
    <AsyncView state={state} reload={reload}>
      {(items) => <List items={items} reload={reload} />}
    </AsyncView>
  );
}

export function MinePage() {
  useDocumentTitle('내 질문');
  return (
    <div>
      <h1 className="text-2xl font-bold">내 질문</h1>
      <p className="mt-1 text-[var(--color-muted)]">나만 볼 수 있는 질문입니다. 학습함으로 체크하면 랜덤 면접에 함께 나옵니다.</p>
      <div className="mt-4">
        <LoginGate returnTo={minePath()}>
          <Loaded />
        </LoginGate>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------- 상세

function Detail({ q, reload }: { q: MineQuestion; reload: () => void }) {
  useDocumentTitle(q.title);
  const navigate = useNavigate();
  const { markAnonymous } = useSession();
  const session = useSessionKey();
  const server = useMemo(() => new Map([[q.slug, q.learned]]), [q.slug, q.learned]);
  const learned = useLearned(server, `${q.slug}:${session.key}`);
  const checked = learned.isLearned(q.slug);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const deleteButton = useRef<HTMLButtonElement>(null);

  async function remove() {
    setConfirm(false);
    try {
      await deleteMine(q.id);
      navigate(minePath(), { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.isNotFound) {
        navigate(minePath(), { replace: true }); // 이미 없다
        return;
      }
      if (err instanceof ApiError && err.isUnauthorized) {
        markAnonymous();
      }
      setMessage(err instanceof ApiError ? userMessage(err) : '지우지 못했습니다. 다시 시도해 주세요.');
    }
  }

  return (
    <div>
      <p className="text-sm">
        <Link to={minePath()} className="inline-flex min-h-11 items-center">
          ← 내 질문 목록
        </Link>
      </p>
      <h1 className="break-words text-2xl font-bold">{q.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <TierBadge tier={q.tier} />
        {q.sourceLabel && <SourceBadge label={q.sourceLabel} />}
        {q.reviewCandidate && checked && <ReviewBadge />}
        <LearnedCheckbox checked={checked} onChange={(next) => learned.toggle(q.slug, next)} title={q.title} />
      </div>
      {learned.message && (
        <p role="status" aria-live="polite" className="text-[var(--color-extra)]">
          {learned.message}
        </p>
      )}
      {editing ? (
        <section aria-label="질문 수정" className="mt-4 rounded-lg border border-[var(--color-border)] p-4">
          <MineForm
            draftId={q.id}
            initial={{ title: q.title, answerText: q.answerText, keywords: q.keywords, tier: q.tier, sourceLabel: q.sourceLabel }}
            submitLabel="저장"
            onSubmit={async (draft) => {
              await putMine(q.id, draft);
              setEditing(false);
              reload();
            }}
            onCancel={() => setEditing(false)}
          />
        </section>
      ) : (
        <>
          <h2 className="mt-6 font-bold">내 답</h2>
          {q.answerText === '' ? (
            <p className="text-[var(--color-muted)]">적어 둔 답이 없습니다. 수정에서 적어 보세요.</p>
          ) : (
            <p data-testid="mine-answer" className="whitespace-pre-wrap break-words rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              {q.answerText}
            </p>
          )}
          {q.keywords.length > 0 && (
            <>
              <h2 className="mt-4 font-bold">키워드</h2>
              <ul className="mt-1 flex flex-wrap gap-2">
                {q.keywords.map((k) => (
                  <li key={k} className="rounded-full border border-[var(--color-border)] px-3 py-1 break-all">
                    {k}
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" onClick={() => setEditing(true)} className={BUTTON}>
              수정
            </button>
            <button ref={deleteButton} type="button" onClick={() => setConfirm(true)} className={BUTTON}>
              삭제
            </button>
          </div>
        </>
      )}
      {message && (
        <p role="alert" className="mt-3 text-[var(--color-extra)]">
          {message}
        </p>
      )}
      <ConfirmDialog open={confirm} title="이 질문을 지울까요?" confirmLabel="지우기" onConfirm={() => void remove()} onCancel={() => setConfirm(false)} returnFocusTo={deleteButton}>
        <p>"{q.title}" 과 체크, 시험 통계가 지워집니다. 이미 본 시험 기록에는 제목 없이 남습니다. 되돌릴 수 없습니다.</p>
      </ConfirmDialog>
    </div>
  );
}

export function MineDetailPage() {
  const { id = '' } = useParams();
  const session = useSessionKey();
  const { state, reload } = useApi(`mine:${id}:${session.key}`, (signal) => fetchMineQuestion(id, signal), session.authenticated);
  return (
    <LoginGate returnTo={minePath(id)}>
      <AsyncView state={state} reload={reload} notFoundMessage="찾을 수 없는 질문입니다. 지웠거나 내 질문이 아닙니다.">
        {(q) => <Detail q={q} reload={reload} />}
      </AsyncView>
    </LoginGate>
  );
}
