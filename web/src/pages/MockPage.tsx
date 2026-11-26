import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchQuestion } from '../api/catalog';
import { ApiError, userMessage } from '../api/client';
import { fetchMock, finishMock, putMockTurn } from '../api/mock';
import type { MockSession, MockTurn, QuestionDetail, QuizResult } from '../api/types';
import { AsyncView } from '../components/AsyncView';
import { TierBadge } from '../components/Chips';
import { BottomBar } from '../components/chrome';
import { TitleText } from '../components/TitleText';
import { setDraftDirty } from '../drafts/draftRegistry';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { chains, originLabel } from '../lib/mock';
import { mockStartPath, questionLink } from '../routes';
import { loginUrl, useSession, useSessionKey } from '../session/SessionProvider';
import { CatalogAnswerCard } from './QuizPage';

/** 답 상한(코드포인트 기준, 서버가 다시 검사한다). */
const ANSWER_MAX = 2000;
/** 말하기 우선(docs/M7-PLAN.md D7): 질문마다 60초를 보여 준다. 넘겨도 계속할 수 있다(표시만). */
const SPEAK_SECONDS = 60;
const codePoints = (text: string) => [...text].length;

const BUTTON = 'min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4';
const PRIMARY = 'min-h-11 rounded-md bg-[var(--color-accent)] px-5 font-semibold text-[var(--color-accent-contrast)] disabled:opacity-60';

const RESULT_LABEL: Record<QuizResult, string> = { CORRECT: '맞음', WRONG: '틀림', SKIPPED: '건너뜀' };

function mmss(seconds: number): string {
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

/** 60초 타이머. 시간이 지나도 막지 않고 "초과" 로만 보여 준다. */
function SpeakTimer({ elapsed }: { elapsed: number }) {
  const over = elapsed > SPEAK_SECONDS;
  return (
    <span data-testid="speak-timer" className={over ? 'font-semibold text-[var(--color-extra)]' : ''}>
      {over ? `시간 초과 +${mmss(elapsed - SPEAK_SECONDS)}` : `남은 시간 ${mmss(SPEAK_SECONDS - elapsed)}`}
    </span>
  );
}

// ---------------------------------------------------------------------------- 질문 하나

interface AskProps {
  session: MockSession;
  turn: MockTurn;
  onDone: (session: MockSession) => void;
  onProblem: (message: string) => void;
}

function Ask({ session, turn, onDone, onProblem }: AskProps) {
  const { markAnonymous } = useSession();
  const [text, setText] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const elapsed = useElapsed(`${session.sessionId}:${turn.seq}`);
  const closed = turn.title === null;
  const tooLong = codePoints(text) > ANSWER_MAX;
  const parent = turn.parentSeq === null ? undefined : session.turns.find((t) => t.seq === turn.parentSeq);
  const mainNumber = session.turns.filter((t) => t.origin === 'MAIN' && t.seq <= turn.seq).length;
  // 모범 답변은 "보기" 를 누른 뒤에만 받는다(미리 보이면 연습이 아니다)
  const answer = useApi<QuestionDetail | null>(
    `mock-answer:${turn.questionSlug}:${revealed}`,
    (signal) => (revealed && turn.questionSlug !== null ? fetchQuestion(turn.questionSlug, signal) : Promise.resolve(null)),
    revealed,
  );

  // 적고 있는 답이 있으면 서비스 워커 업데이트(새로고침)를 미룬다
  useEffect(() => {
    const id = `mock:${session.sessionId}`;
    setDraftDirty(id, text.trim() !== '');
    return () => setDraftDirty(id, false);
  }, [text, session.sessionId]);

  async function record(result: QuizResult) {
    if (busy || tooLong) {
      return;
    }
    setBusy(true);
    try {
      const updated = await putMockTurn(session.sessionId, turn.seq, {
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
    <section aria-labelledby="mock-heading">
      <BottomBar label="모의면접 동작">
        {closed ? (
          <button type="button" disabled={busy} onClick={() => void record('SKIPPED')} className={`${PRIMARY} flex-1`}>
            건너뛰기
          </button>
        ) : !revealed ? (
          <>
            <button type="button" onClick={() => void record('SKIPPED')} disabled={busy || tooLong} className={BUTTON}>
              건너뛰기
            </button>
            <button type="button" onClick={() => setRevealed(true)} disabled={tooLong} className={`${PRIMARY} flex-1`}>
              모범 답변 보기
            </button>
          </>
        ) : (
          <>
            <span className="sr-only">내가 말한 것은 어땠나요?</span>
            <button type="button" disabled={busy || tooLong} onClick={() => void record('WRONG')} className={`${BUTTON} flex-1`}>
              틀림
            </button>
            <button type="button" disabled={busy || tooLong} onClick={() => void record('CORRECT')} className={`${PRIMARY} flex-1`}>
              맞음
            </button>
          </>
        )}
      </BottomBar>

      <p className="flex flex-wrap items-center gap-x-2 text-sm text-[var(--color-muted)]">
        <span>
          본 질문 {mainNumber} / {session.plannedMains}
        </span>
        <span aria-hidden="true">·</span>
        <span data-testid="turn-origin" className={turn.origin === 'MAIN' ? '' : 'font-semibold text-[var(--color-accent)]'}>
          {originLabel(turn)}
        </span>
        <span aria-hidden="true">·</span>
        <SpeakTimer elapsed={elapsed()} />
      </p>
      {parent && parent.title !== null && (
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {turn.origin === 'PREREQ' ? '앞 질문에서 막혔다면, 먼저 이것부터: ' : '앞 질문에 이어서: '}
          <TitleText text={parent.title} />
        </p>
      )}
      <h2 id="mock-heading" className="mt-2 text-xl font-bold">
        {closed ? '이 질문은 더 이상 공개되지 않습니다.' : <TitleText text={turn.title ?? ''} />}
      </h2>
      {!closed && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {turn.tier && <TierBadge tier={turn.tier} />}
          {turn.topicName && <span className="text-sm text-[var(--color-muted)]">{turn.topicName}</span>}
        </div>
      )}

      {closed ? (
        <p className="mt-6 text-[var(--color-muted)]">이 질문은 건너뛰고 다음으로 가세요.</p>
      ) : (
        <>
          <p className="mt-6">면접관에게 말하듯 소리 내어 답해 보세요. 다 말했으면 모범 답변과 비교합니다.</p>
          <details className="mt-3" open={text !== '' ? true : undefined}>
            <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold">답 적어 두기 (선택)</summary>
            <label className="block">
              <span className="sr-only">내 답</span>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                disabled={revealed}
                // 16px 이상이라야 iOS 가 입력할 때 화면을 확대하지 않는다
                className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-base"
              />
            </label>
            <p className={`text-sm ${tooLong ? 'font-semibold text-[var(--color-extra)]' : 'text-[var(--color-muted)]'}`}>
              {codePoints(text).toLocaleString()}/{ANSWER_MAX.toLocaleString()}자{tooLong ? ' — 너무 깁니다' : ''}
            </p>
          </details>

          {revealed && (
            <div className="mt-4">
              <h3 className="font-bold">모범 답변</h3>
              <AsyncView state={answer.state} reload={answer.reload} notFoundMessage="이 질문은 더 이상 공개되지 않습니다.">
                {(q) => (q === null ? null : <CatalogAnswerCard q={q} />)}
              </AsyncView>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------- 결과

function ResultMark({ result }: { result: QuizResult | null }) {
  if (result === null) {
    return <span className="text-sm text-[var(--color-muted)]">답하지 않음</span>;
  }
  const tone = result === 'CORRECT' ? 'text-[var(--color-accent)]' : result === 'WRONG' ? 'text-[var(--color-extra)]' : 'text-[var(--color-muted)]';
  return <span className={`text-sm font-semibold ${tone}`}>{RESULT_LABEL[result]}</span>;
}

function Result({ session }: { session: MockSession }) {
  const answered = session.turns.filter((t) => t.result !== null);
  const correct = answered.filter((t) => t.result === 'CORRECT').length;
  const judged = answered.filter((t) => t.result !== 'SKIPPED').length;
  const deepest = Math.max(0, ...session.turns.filter((t) => t.result === 'CORRECT').map((t) => t.depth));
  const groups = useMemo(() => chains(session.turns), [session.turns]);
  return (
    <section aria-labelledby="result-heading">
      <h2 id="result-heading" className="text-xl font-bold">
        모의면접 결과
      </h2>
      <p className="mt-2 text-lg">{judged === 0 ? '채점한 질문이 없습니다.' : `${judged}문항 중 ${correct}문항 맞음 (${Math.round((correct / judged) * 100)}%)`}</p>
      <p className="text-sm text-[var(--color-muted)]">
        본 질문 {groups.length}개 · 전체 {session.turns.length}문항 · 맞힌 꼬리질문 최대 {deepest}단계
      </p>

      <ol className="mt-6 space-y-3" aria-label="질문 줄기">
        {groups.map((chain) => (
          <li key={chain[0].seq} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <ul className="space-y-1">
              {chain.map((t) => (
                <li key={t.seq} style={{ paddingLeft: `${t.origin === 'MAIN' ? 0 : Math.max(1, t.depth) * 0.75}rem` }}>
                  <p className="text-xs text-[var(--color-muted)]">{originLabel(t)}</p>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    {t.title === null || t.questionSlug === null ? (
                      <span>(더 이상 공개되지 않는 질문)</span>
                    ) : (
                      <Link to={questionLink(t.questionSlug)} className="inline-flex min-h-11 items-center">
                        <TitleText text={t.title} />
                      </Link>
                    )}
                    <ResultMark result={t.result} />
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-[var(--color-muted)]">맞음·틀림은 랜덤 시험과 같은 출제 기록에 쌓입니다. 학습함으로 체크한 질문을 틀렸다면 사전에서 "다시 공부 후보" 로 표시됩니다.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link to={mockStartPath()} className={`inline-flex items-center no-underline ${PRIMARY}`}>
          다시 모의면접 보기
        </Link>
        <Link to="/" className={`inline-flex items-center no-underline ${BUTTON}`}>
          질문 은행으로
        </Link>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------- 세션

function SessionView({ initial }: { initial: MockSession }) {
  const [session, setSession] = useState(initial);
  const [problem, setProblem] = useState<string | null>(null);
  const [stopping, setStopping] = useState(false);
  const current = session.turns.find((t) => t.result === null);
  const done = session.finishedAt !== null || current === undefined;
  useDocumentTitle(done ? '모의면접 결과' : '모의면접');

  async function stop() {
    if (stopping) {
      return;
    }
    setStopping(true);
    try {
      setSession(await finishMock(session.sessionId));
      setProblem(null);
    } catch (e) {
      setProblem(e instanceof ApiError ? userMessage(e) : '끝내지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setStopping(false);
    }
  }

  return (
    <div>
      {problem && (
        <p role="alert" className="mb-4 rounded-md border border-[var(--color-extra)] p-3 text-[var(--color-extra)]">
          {problem}
        </p>
      )}
      {done || current === undefined ? (
        <Result session={session} />
      ) : (
        <>
          <Ask
            key={current.seq}
            session={session}
            turn={current}
            onDone={(s) => {
              setProblem(null);
              setSession(s);
            }}
            onProblem={setProblem}
          />
          <div className="mt-8 border-t border-[var(--color-border)] pt-4">
            <button type="button" onClick={() => void stop()} disabled={stopping} className={BUTTON}>
              여기서 그만하고 결과 보기
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function MockPage() {
  const { id = '' } = useParams();
  const key = useSessionKey();
  const { state, refresh } = useSession();
  const { state: data, reload } = useApi(`mock:${id}:${key.key}`, (signal) => fetchMock(id, signal), key.authenticated);
  useDocumentTitle('모의면접');

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
        <h1 className="text-xl font-bold">모의면접</h1>
        {state.status === 'error' ? (
          <div role="alert">
            <p>로그인 상태를 확인하지 못했습니다.</p>
            <button type="button" onClick={refresh} className={`mt-2 ${BUTTON}`}>
              다시 시도
            </button>
          </div>
        ) : (
          <p className="mt-2">
            모의면접은 로그인한 뒤에 볼 수 있습니다.{' '}
            <a href={loginUrl(`/mock/${id}`)} className="inline-flex min-h-11 items-center font-semibold">
              로그인
            </a>
          </p>
        )}
      </div>
    );
  }
  return (
    <div>
      <h1 className="sr-only">꼬리질문 모의면접</h1>
      <AsyncView state={data} reload={reload} notFoundMessage="찾을 수 없는 모의면접입니다.">
        {(session) => <SessionView key={session.sessionId} initial={session} />}
      </AsyncView>
    </div>
  );
}
