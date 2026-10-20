import { useEffect, useState } from 'react';
import { ApiError, userMessage } from '../api/client';
import { fetchNote, putNote } from '../api/progress';
import { setDraftDirty } from '../drafts/draftRegistry';
import { useApi } from '../hooks/useApi';
import { useSession } from '../session/SessionProvider';

/** 서버의 상한과 같다(유니코드 코드포인트 기준 — 이모지 하나가 1이다). */
export const NOTE_MAX = 2000;

const codePoints = (text: string) => [...text].length;

type Save = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'error'; message: string };

function Editor({ slug, initial }: { slug: string; initial: string }) {
  const { markAnonymous } = useSession();
  const [text, setText] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [save, setSave] = useState<Save>({ kind: 'idle' });
  const dirty = text !== saved;
  const count = codePoints(text);
  const over = count > NOTE_MAX;

  // 저장하지 않은 글이 있으면 등록부에 알리고(업데이트 새로고침을 미룬다), 탭을 닫을 때 경고한다
  useEffect(() => {
    const id = `note:${slug}`;
    setDraftDirty(id, dirty);
    if (!dirty) {
      return undefined;
    }
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => {
      window.removeEventListener('beforeunload', warn);
      setDraftDirty(id, false);
    };
  }, [dirty, slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (over || save.kind === 'saving') {
      return;
    }
    setSave({ kind: 'saving' });
    try {
      const result = await putNote(slug, text);
      const stored = result.body ?? '';
      // 공백뿐인 글은 서버가 노트를 지운다: 화면도 빈 상태로 맞춘다
      setText((current) => (current === text ? stored : current));
      setSaved(stored);
      setSave({ kind: 'saved' });
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) {
        markAnonymous();
      }
      setSave({ kind: 'error', message: err instanceof ApiError ? userMessage(err) : '저장하지 못했습니다. 다시 시도해 주세요.' });
    }
  }

  const status =
    save.kind === 'saving' ? '저장 중…' : save.kind === 'saved' && !dirty ? '저장했습니다.' : save.kind === 'error' ? save.message : dirty ? '저장하지 않은 변경이 있습니다.' : '';

  return (
    <form onSubmit={(e) => void submit(e)} className="mt-2">
      <label htmlFor="note-text" className="block">
        <span className="sr-only">이 질문에 대한 내 노트</span>
      </label>
      <textarea
        id="note-text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (save.kind !== 'saving') {
            setSave({ kind: 'idle' });
          }
        }}
        rows={6}
        // 16px 이상이라야 iOS 가 입력할 때 화면을 확대하지 않는다
        className="min-h-32 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-base"
        aria-describedby="note-count"
        placeholder="이 질문에서 헷갈린 점, 나만의 설명을 적어 두세요."
      />
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <span id="note-count" className={`text-sm ${over ? 'font-semibold text-[var(--color-extra)]' : 'text-[var(--color-muted)]'}`}>
          {count.toLocaleString()}/{NOTE_MAX.toLocaleString()}자{over ? ' — 너무 깁니다' : ''}
        </span>
        <button
          type="submit"
          disabled={over || save.kind === 'saving' || !dirty}
          className="min-h-11 rounded-md bg-[var(--color-accent)] px-4 font-semibold text-[var(--color-accent-contrast)] disabled:opacity-60"
        >
          저장
        </button>
      </div>
      <p role="status" aria-live="polite" className="mt-1 min-h-6 text-sm text-[var(--color-muted)]">
        {status}
      </p>
    </form>
  );
}

/** 질문 상세의 내 노트(로그인했을 때만). 노트는 일반 텍스트이고 입력 상자 안에서만 보여 준다(HTML 로 해석되지 않는다). */
export function NoteEditor({ slug }: { slug: string }) {
  const { state, reload } = useApi(`note:${slug}`, (signal) => fetchNote(slug, signal));
  return (
    <section aria-labelledby="note-heading" className="mt-8">
      <h2 id="note-heading" className="text-base font-bold">
        내 노트 <span className="text-sm font-normal text-[var(--color-muted)]">(나만 볼 수 있습니다)</span>
      </h2>
      {state.status === 'loading' && (
        <p role="status" className="py-2 text-[var(--color-muted)]">
          노트를 불러오는 중…
        </p>
      )}
      {state.status === 'error' && (
        <div role="alert" className="py-2">
          <p>{userMessage(state.error)}</p>
          {state.error.status !== 404 && (
            <button type="button" onClick={reload} className="mt-2 min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4">
              다시 시도
            </button>
          )}
        </div>
      )}
      {state.status === 'success' && <Editor slug={slug} initial={state.data.body ?? ''} />}
    </section>
  );
}
