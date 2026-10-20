import { useEffect, useId, useState, type FormEvent } from 'react';
import { ApiError, userMessage } from '../api/client';
import type { MineDraft, Tier } from '../api/types';
import { setDraftDirty } from '../drafts/draftRegistry';
import { TIER_LABEL, TIERS } from '../lib/labels';
import { useSession } from '../session/SessionProvider';

/** 서버의 상한과 같다(유니코드 코드포인트 기준 — 이모지 하나가 1이다). */
export const MINE_LIMITS = { title: 200, answer: 4000, keywords: 10, keyword: 40, source: 40, perUser: 300, batch: 50 } as const;

const FIELD = 'min-h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base';
const codePoints = (text: string) => [...text].length;

export const EMPTY_DRAFT: MineDraft = { title: '', answerText: '', keywords: [], tier: 'BASIC', sourceLabel: null };

/** "a, b，c" → ["a","b","c"] (쉼표·전각 쉼표 구분, 공백·빈 칸·중복 제거) */
export function parseKeywords(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/[,，]/)) {
    const k = raw.trim();
    if (k !== '' && !out.includes(k)) {
      out.push(k);
    }
  }
  return out;
}

interface FieldValues {
  title: string;
  answer: string;
  keywords: string;
  tier: Tier;
  source: string;
}

const toValues = (d: MineDraft): FieldValues => ({ title: d.title, answer: d.answerText, keywords: d.keywords.join(', '), tier: d.tier, source: d.sourceLabel ?? '' });

/** 입력 오류(없으면 null). 서버가 같은 규칙으로 한 번 더 확인한다. */
export function validate(v: FieldValues): string | null {
  if (v.title.trim() === '') {
    return '질문을 입력해 주세요.';
  }
  if (codePoints(v.title.trim()) > MINE_LIMITS.title) {
    return `질문은 ${MINE_LIMITS.title}자까지 쓸 수 있습니다.`;
  }
  if (codePoints(v.answer) > MINE_LIMITS.answer) {
    return `내 답은 ${MINE_LIMITS.answer.toLocaleString()}자까지 쓸 수 있습니다.`;
  }
  const keywords = parseKeywords(v.keywords);
  if (keywords.length > MINE_LIMITS.keywords) {
    return `키워드는 ${MINE_LIMITS.keywords}개까지 넣을 수 있습니다.`;
  }
  if (keywords.some((k) => codePoints(k) > MINE_LIMITS.keyword)) {
    return `키워드 하나는 ${MINE_LIMITS.keyword}자까지입니다.`;
  }
  if (codePoints(v.source.trim()) > MINE_LIMITS.source) {
    return `출처 표시는 ${MINE_LIMITS.source}자까지 쓸 수 있습니다.`;
  }
  return null;
}

interface Props {
  /** 등록부 식별자(저장하지 않은 입력이 있으면 업데이트 새로고침을 미룬다) */
  draftId: string;
  initial: MineDraft;
  submitLabel: string;
  /** 저장. 실패하면 예외를 던진다(안내 문구는 여기서 만든다). 성공하면 `reset` 이 true 면 입력을 비운다. */
  onSubmit: (draft: MineDraft) => Promise<void>;
  onCancel?: () => void;
  /** 저장 성공 뒤 입력을 비운다(새 질문 폼) */
  resetOnSuccess?: boolean;
}

/** 내 질문 입력 폼(만들기·수정 공용). 모든 글은 일반 텍스트다. */
export function MineForm({ draftId, initial, submitLabel, onSubmit, onCancel, resetOnSuccess = false }: Props) {
  const { markAnonymous } = useSession();
  const ids = { title: useId(), answer: useId(), keywords: useId(), tier: useId(), source: useId(), count: useId() };
  const [values, setValues] = useState<FieldValues>(toValues(initial));
  const [saved, setSaved] = useState<FieldValues>(toValues(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);

  useEffect(() => {
    setDraftDirty(`mine:${draftId}`, dirty);
    if (!dirty) {
      return undefined;
    }
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => {
      window.removeEventListener('beforeunload', warn);
      setDraftDirty(`mine:${draftId}`, false);
    };
  }, [dirty, draftId]);

  const set = <K extends keyof FieldValues>(key: K, value: FieldValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setError(null);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) {
      return;
    }
    const problem = validate(values);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        title: values.title.trim(),
        answerText: values.answer,
        keywords: parseKeywords(values.keywords),
        tier: values.tier,
        sourceLabel: values.source.trim() === '' ? null : values.source.trim(),
      });
      const next = resetOnSuccess ? toValues(EMPTY_DRAFT) : values;
      setValues(next);
      setSaved(next);
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) {
        markAnonymous();
      }
      setError(err instanceof ApiError ? userMessage(err) : '저장하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  const answerCount = codePoints(values.answer);
  const answerOver = answerCount > MINE_LIMITS.answer;

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      <div>
        <label htmlFor={ids.title} className="block font-semibold">
          질문
        </label>
        <input id={ids.title} type="text" value={values.title} onChange={(e) => set('title', e.target.value)} className={`${FIELD} mt-1`} autoComplete="off" />
      </div>
      <div>
        <label htmlFor={ids.answer} className="block font-semibold">
          내 답 <span className="text-sm font-normal text-[var(--color-muted)]">(선택, 시험에서 모범 답변 자리에 보입니다)</span>
        </label>
        <textarea
          id={ids.answer}
          value={values.answer}
          onChange={(e) => set('answer', e.target.value)}
          rows={6}
          aria-describedby={ids.count}
          className="mt-1 min-h-32 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-base"
        />
        <p id={ids.count} className={`text-sm ${answerOver ? 'font-semibold text-[var(--color-extra)]' : 'text-[var(--color-muted)]'}`}>
          {answerCount.toLocaleString()}/{MINE_LIMITS.answer.toLocaleString()}자{answerOver ? ' — 너무 깁니다' : ''}
        </p>
      </div>
      <div>
        <label htmlFor={ids.keywords} className="block font-semibold">
          키워드 <span className="text-sm font-normal text-[var(--color-muted)]">(선택, 쉼표로 구분, 최대 {MINE_LIMITS.keywords}개)</span>
        </label>
        <input id={ids.keywords} type="text" value={values.keywords} onChange={(e) => set('keywords', e.target.value)} className={`${FIELD} mt-1`} autoComplete="off" />
      </div>
      <div className="flex flex-wrap gap-4">
        <div>
          <label htmlFor={ids.tier} className="block font-semibold">
            난이도
          </label>
          <select id={ids.tier} value={values.tier} onChange={(e) => set('tier', e.target.value as Tier)} className={`${FIELD} mt-1`}>
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {TIER_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor={ids.source} className="block font-semibold">
            출처 표시 <span className="text-sm font-normal text-[var(--color-muted)]">(선택, 예: 강사 추천)</span>
          </label>
          <input id={ids.source} type="text" value={values.source} onChange={(e) => set('source', e.target.value)} className={`${FIELD} mt-1`} autoComplete="off" />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-[var(--color-extra)]">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy || answerOver}
          className="min-h-11 rounded-md bg-[var(--color-accent)] px-5 font-semibold text-[var(--color-accent-contrast)] disabled:opacity-60"
        >
          {busy ? '저장하는 중…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-5">
            취소
          </button>
        )}
      </div>
    </form>
  );
}
