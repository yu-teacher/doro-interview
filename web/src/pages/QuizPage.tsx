import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchQuestion } from '../api/catalog';
import { ApiError, userMessage } from '../api/client';
import { fetchQuiz, finishQuiz, putQuizItem } from '../api/quiz';
import type { QuestionDetail, QuizItem, QuizResult, QuizSession } from '../api/types';
import { AsyncView } from '../components/AsyncView';
import { ImportanceBadge, KeywordList, TierBadge } from '../components/Chips';
import { setDraftDirty } from '../drafts/draftRegistry';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { LazyMarkdown } from '../markdown/LazyMarkdown';
import { questionPath, quizStartPath } from '../routes';
import { loginUrl, useSession, useSessionKey } from '../session/SessionProvider';

/** 노트와 같은 상한(코드포인트 기준). 서버가 다시 검사한다. */
const ANSWER_MAX = 2000;
const codePoints = (text: string) => [...text].length;

const BUTTON = 'min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4';
const PRIMARY = 'min-h-11 rounded-md bg-[var(--color-accent)] px-5 font-semibold text-[var(--color-accent-contrast)] disabled:opacity-60';

/** 경과 시간(초)을 "m:ss" 로. */
function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function useElapsed(resetKey: string): () => number {
  const startedRef = useRef(Date.now());
  const [, setTick] = useState(0);
  useEffect(() => {
    startedRef.current = Date.now();
    setTick(0);
  }, [resetKey]);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [resetKey]);
  return useCallback(() => Math.floor((Date.now() - startedRef.current) / 1000), []);
}

// ---------------------------------------------------------------------------- 문제 하나

interface AskProps {
  sessionId: string;
  item: QuizItem;
  total: number;
  answered: number;
  onDone: (session: QuizSession) => void;
  onProblem: (message: string) => void;
}

function Ask({ sessionId, item, total, answered, onDone, onProblem }: AskProps) {
  const { markAnonymous } = useSession();
  const [text, setText] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const elapsed = useElapsed(`${sessionId}:${item.seq}`);
  const closed = item.title === null;
  const answerState = useApi<QuestionDetail | null>(
    `quiz-answer:${item.questionSlug}:${revealed}`,
    (signal) => (revealed ? fetchQuestion(item.questionSlug, signal) : Promise.resolve(null)),
    revealed,
  );
  const tooLong = codePoints(text) > ANSWER_MAX;

  // 작성 중인 답이 있으면 서비스 워커 업데이트(새로고침)를 미룬다
  useEffect(() => {
    const id = `quiz:${sessionId}`;
    setDraftDirty(id, text.trim() !== '');
    return () => setDraftDirty(id, false);
  }, [text, sessionId]);

  async function record(result: QuizResult) {
    if (busy || tooLong) {
      return;
    }
    setBusy(true);
    try {
      const updated = await putQuizItem(sessionId, item.seq, {
        result,
        seconds: Math.min(elapsed(), 86_400),
        ...(text.trim() !== '' ? { answerText: text } : {}),
      });
      onDone(updated);
    } catch (e) {
      if (e instanceof ApiError && e.isUnauthorized) {
        markAnonymous();
      }
      onProblem(e instanceof ApiError ? userMessage(e) : '기록하지 못했습니다. 다시 시도해 주세요.');
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="ask-heading">
      <p className="text-sm text-[var(--color-muted)]">
        <span aria-live="off">
          {answered + 1} / {total}
        </span>
        {' · '}
        <span data-testid="elapsed" aria-hidden="true">
          {clock(elapsed())}
        </span>
      </p>
      <h2 id="ask-heading" className="mt-2 text-xl font-bold">
        {closed ? '이 질문은 더 이상 공개되지 않습니다.' : item.title}
      </h2>
      {!closed && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {item.tier && <TierBadge tier={item.tier} />}
          {item.topicName && <span className="text-sm text-[var(--color-muted)]">{item.topicName}</span>}
        </div>
      )}

      {closed ? (
        <button type="button" disabled={busy} onClick={() => void record('SKIPPED')} className={`mt-6 ${PRIMARY}`}>
          건너뛰기
        </button>
      ) : (
        <>
          <label className="mt-6 block">
            <span className="font-bold">내 답 (선택)</span>
            <span className="ml-2 text-sm text-[var(--color-muted)]">소리 내어 말해 본 뒤, 기억나는 만큼 적어도 됩니다.</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              disabled={revealed}
              // 16px 이상이라야 iOS 가 입력할 때 화면을 확대하지 않는다
              className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-base"
            />
          </label>
          <p className={`text-sm ${tooLong ? 'font-semibold text-[var(--color-extra)]' : 'text-[var(--color-muted)]'}`}>
            {codePoints(text).toLocaleString()}/{ANSWER_MAX.toLocaleString()}자{tooLong ? ' — 너무 깁니다' : ''}
          </p>

          {!revealed ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => setRevealed(true)} disabled={tooLong} className={PRIMARY}>
                모범 답변 보기
              </button>
              <button type="button" onClick={() => void record('SKIPPED')} disabled={busy || tooLong} className={BUTTON}>
                건너뛰기
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <h3 className="font-bold">모범 답변</h3>
              <AsyncView state={answerState.state} reload={answerState.reload} notFoundMessage="이 질문은 더 이상 공개되지 않습니다.">
                {(q) =>
                  q === null ? null : (
                    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                      <LazyMarkdown source={q.spokenAnswer} />
                      {q.keywords.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-semibold">핵심 키워드 — 말한 것에 표시해 보세요</p>
                          <KeywordList keywords={q.keywords} />
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <ImportanceBadge importance={q.importance} />
                        <Link to={questionPath(q.slug)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm">
                          사전에서 자세히 보기(새 탭)
                        </Link>
                      </div>
                    </div>
                  )
                }
              </AsyncView>
              <p className="mt-4 font-bold">내가 말한 것은 어땠나요?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" disabled={busy || tooLong} onClick={() => void record('CORRECT')} className={PRIMARY}>
                  맞음
                </button>
                <button type="button" disabled={busy || tooLong} onClick={() => void record('WRONG')} className={BUTTON}>
                  틀림
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------- 결과

function Result({ session }: { session: QuizSession }) {
  const counts = useMemo(() => {
    const c = { CORRECT: 0, WRONG: 0, SKIPPED: 0, none: 0 };
    for (const i of session.items) {
      c[i.result ?? 'none'] += 1;
    }
    return c;
  }, [session.items]);
  const judged = counts.CORRECT + counts.WRONG;
  const wrong = session.items.filter((i) => i.result === 'WRONG');
  return (
    <section aria-labelledby="result-heading">
      <h2 id="result-heading" className="text-xl font-bold">
        시험 결과
      </h2>
      <p className="mt-2 text-lg">
        {judged === 0 ? '채점한 문제가 없습니다.' : `${judged}문제 중 ${counts.CORRECT}문제 맞음 (${Math.round((counts.CORRECT / judged) * 100)}%)`}
      </p>
      <p className="text-sm text-[var(--color-muted)]">
        맞음 {counts.CORRECT} · 틀림 {counts.WRONG} · 건너뜀 {counts.SKIPPED}
        {counts.none > 0 ? ` · 풀지 않음 ${counts.none}` : ''}
      </p>

      {wrong.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold">틀린 질문</h3>
          <p className="text-sm text-[var(--color-muted)]">학습함으로 체크한 질문이 틀렸다면 사전에서 "다시 공부 후보" 로 표시됩니다. 체크 해제는 직접 합니다.</p>
          <ul className="mt-2 space-y-2">
            {wrong.map((i) => (
              <li key={i.seq} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <p className="font-semibold">{i.title ?? '(더 이상 공개되지 않는 질문)'}</p>
                {i.title !== null && (
                  <Link to={questionPath(i.questionSlug)} className="inline-flex min-h-11 items-center">
                    사전에서 보기
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link to={quizStartPath()} className={`inline-flex items-center no-underline !text-[var(--color-accent-contrast)] ${PRIMARY}`}>
          다시 시험 보기
        </Link>
        <Link to="/" className={`inline-flex items-center no-underline ${BUTTON}`}>
          질문 은행으로
        </Link>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------- 세션

function SessionView({ initial }: { initial: QuizSession }) {
  const [session, setSession] = useState(initial);
  const [problem, setProblem] = useState<string | null>(null);
  const finishing = useRef(false);
  const next = session.items.find((i) => i.result === null);
  const answered = session.items.filter((i) => i.result !== null).length;
  const done = next === undefined;
  useDocumentTitle(done ? '시험 결과' : '시험');

  // 모두 풀었으면 끝낸다(멱등): 끝났다는 기록이 남아야 현황의 세션 수·재방문이 맞다
  useEffect(() => {
    if (done && session.finishedAt === null && !finishing.current) {
      finishing.current = true;
      finishQuiz(session.sessionId)
        .then((s) => setSession(s))
        .catch(() => {
          finishing.current = false; // 결과 화면은 그대로 보이고, 끝내기는 다음 방문에서 다시 시도된다
        });
    }
  }, [done, session.finishedAt, session.sessionId]);

  return (
    <div>
      {problem && (
        <p role="alert" className="mb-4 rounded-md border border-[var(--color-extra)] p-3 text-[var(--color-extra)]">
          {problem}
        </p>
      )}
      {done ? (
        <Result session={session} />
      ) : (
        <Ask
          key={next.seq}
          sessionId={session.sessionId}
          item={next}
          total={session.items.length}
          answered={answered}
          onDone={(s) => {
            setProblem(null);
            setSession(s);
          }}
          onProblem={setProblem}
        />
      )}
    </div>
  );
}

export function QuizPage() {
  const { id = '' } = useParams();
  const key = useSessionKey();
  const { state, refresh } = useSession();
  const { state: data, reload } = useApi(`quiz:${id}:${key.key}`, (signal) => fetchQuiz(id, signal), key.authenticated);
  useDocumentTitle('시험');

  if (!key.ready) {
    return (
      <p role="status" className="py-8 text-center text-[var(--color-muted)]">
        불러오는 중…
      </p>
    );
  }
  if (!key.authenticated) {
    return (
      <div className="py-4">
        <h1 className="text-xl font-bold">시험</h1>
        {state.status === 'error' ? (
          <div role="alert">
            <p>로그인 상태를 확인하지 못했습니다.</p>
            <button type="button" onClick={refresh} className={`mt-2 ${BUTTON}`}>
              다시 시도
            </button>
          </div>
        ) : (
          <p className="mt-2">
            시험은 로그인한 뒤에 볼 수 있습니다.{' '}
            <a href={loginUrl(`/quiz/${id}`)} className="inline-flex min-h-11 items-center font-semibold">
              로그인
            </a>
          </p>
        )}
      </div>
    );
  }
  return (
    <div>
      <h1 className="sr-only">랜덤 면접</h1>
      <AsyncView state={data} reload={reload} notFoundMessage="찾을 수 없는 시험입니다.">
        {(session) => <SessionView key={session.sessionId} initial={session} />}
      </AsyncView>
    </div>
  );
}
