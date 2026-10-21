import { useState } from 'react';
import { ApiError, userMessage } from '../api/client';
import { fetchAiStatus, putFeedback } from '../api/quiz';
import { useApi } from '../hooks/useApi';
import { LazyMarkdown } from '../markdown/LazyMarkdown';
import { useSession } from '../session/SessionProvider';

const BUTTON = 'min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 disabled:opacity-60';

interface Props {
  sessionId: string;
  seq: number;
  /** 사용자가 적은 내 답(비어 있으면 요청할 수 없다) */
  answer: string;
  /** 이미 받아 저장된 피드백(이어 풀 때) */
  saved?: string;
  /** 답이 너무 길면(상한 초과) 요청하지 않는다 */
  tooLong: boolean;
}

/**
 * AI 피드백(선택 기능, docs/M6-PLAN.md). 서버가 꺼져 있으면 아무것도 그리지 않는다. 버튼을 눌러야만 질문과 내 답이 외부 AI 서비스로
 * 전송되고(안내를 함께 보인다), 실패해도 시험은 그대로 계속된다(맞음/틀림은 사용자가 고른다). 결과는 마크다운으로 그리되 원시 HTML 은 해석하지 않는다(렌더러 규칙).
 */
export function AiFeedbackBox({ sessionId, seq, answer, saved, tooLong }: Props) {
  const { markAnonymous } = useSession();
  const status = useApi('ai-status', (signal) => fetchAiStatus(signal));
  const [text, setText] = useState<string | undefined>(saved);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const enabled = status.state.status === 'success' && status.state.data.enabled;
  if (text === undefined && !enabled) {
    return null; // 꺼져 있고 받아 둔 것도 없다
  }
  const left = remaining ?? (status.state.status === 'success' ? status.state.data.remainingToday : null);

  async function ask() {
    if (busy) {
      return;
    }
    setBusy(true);
    setProblem(null);
    try {
      const result = await putFeedback(sessionId, seq, answer);
      setText(result.feedback);
      setRemaining(result.remainingToday);
    } catch (e) {
      if (e instanceof ApiError && e.isUnauthorized) {
        markAnonymous();
      }
      setProblem(e instanceof ApiError ? userMessage(e) : '지금은 AI 피드백을 받을 수 없습니다. 시험은 그대로 계속할 수 있습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="ai-heading" className="mt-4">
      <h3 id="ai-heading" className="font-bold">
        AI 피드백
      </h3>
      {text !== undefined ? (
        <div data-testid="ai-feedback" className="mt-1 break-words rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2">
          <LazyMarkdown source={text} />
        </div>
      ) : (
        <>
          <p className="text-sm text-[var(--color-muted)]">
            내 답을 모범 답변과 비교한 짧은 의견을 받습니다. 맞음·틀림은 직접 고릅니다. 버튼을 누르면 질문과 내 답이 외부 AI 서비스로 전송됩니다.
            {left !== null && ` 오늘 ${left}회 남았습니다.`}
          </p>
          {answer.trim() === '' && <p className="text-sm text-[var(--color-muted)]">내 답을 적어야 피드백을 받을 수 있습니다.</p>}
          <button type="button" onClick={() => void ask()} disabled={busy || answer.trim() === '' || tooLong || left === 0} className={`${BUTTON} mt-2`}>
            {busy ? '피드백을 만드는 중…' : 'AI 피드백 받기'}
          </button>
          {busy && (
            <p role="status" className="mt-1 text-sm text-[var(--color-muted)]">
              20초 정도 걸릴 수 있습니다.
            </p>
          )}
        </>
      )}
      {problem && (
        <p role="alert" className="mt-2 text-[var(--color-extra)]">
          {problem}
        </p>
      )}
    </section>
  );
}
