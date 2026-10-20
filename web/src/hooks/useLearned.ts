import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, userMessage } from '../api/client';
import { putLearned } from '../api/progress';
import { useSession } from '../session/SessionProvider';

export interface LearnedControls {
  isLearned: (slug: string) => boolean;
  /** 체크/해제. 화면은 바로 바뀌고(낙관적 갱신) 서버가 거절하면 되돌린다. */
  toggle: (slug: string, next: boolean) => void;
  /** 서버가 확정한 값으로 여러 개를 한꺼번에 맞춘다(주제 일괄 성공 뒤). */
  setMany: (slugs: string[], value: boolean) => void;
  /** 마지막 실패 안내(없으면 null). `role="status"` 로 알린다. */
  message: string | null;
  clearMessage: () => void;
}

/**
 * 질문의 체크 상태를 낙관적으로 갱신한다.
 * - 같은 질문의 요청은 한 번에 하나만 나간다. 진행 중에 또 누르면 **마지막 의도**만 이어서 보낸다(더블 클릭이 뒤엉키지 않는다).
 * - 실패하면 서버가 마지막으로 확정한 값으로 되돌리고 안내를 남긴다. 401 이면 세션을 비로그인으로 맞춘다.
 * `server` 는 방금 받은 데이터의 체크 상태, `resetKey` 가 바뀌면(데이터를 다시 받음) 낙관적 값을 버리고 서버 값에서 다시 시작한다.
 */
export function useLearned(server: ReadonlyMap<string, boolean>, resetKey: string): LearnedControls {
  const { markAnonymous } = useSession();
  const [values, setValues] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<string | null>(null);
  const serverRef = useRef(server);
  const confirmed = useRef(new Map<string, boolean>());
  const desired = useRef(new Map<string, boolean>());
  const inflight = useRef(new Set<string>());

  useEffect(() => {
    serverRef.current = server;
  });

  useEffect(() => {
    confirmed.current.clear();
    desired.current.clear();
    setValues({});
    setMessage(null);
  }, [resetKey]);

  const confirmedValue = useCallback((slug: string) => confirmed.current.get(slug) ?? serverRef.current.get(slug) ?? false, []);

  const toggle = useCallback(
    (slug: string, next: boolean) => {
      desired.current.set(slug, next);
      setValues((v) => ({ ...v, [slug]: next }));
      setMessage(null);
      if (inflight.current.has(slug)) {
        return; // 진행 중인 요청이 끝나면 최신 의도를 이어서 보낸다
      }
      inflight.current.add(slug);
      void (async () => {
        try {
          for (;;) {
            const want = desired.current.get(slug) ?? false;
            if (want === confirmedValue(slug)) {
              break;
            }
            try {
              await putLearned(slug, want);
              confirmed.current.set(slug, want);
            } catch (e) {
              const back = confirmedValue(slug);
              desired.current.set(slug, back);
              setValues((v) => ({ ...v, [slug]: back }));
              if (e instanceof ApiError) {
                if (e.isUnauthorized) {
                  markAnonymous();
                }
                setMessage(userMessage(e));
              } else {
                setMessage('저장하지 못했습니다. 다시 시도해 주세요.');
              }
              break;
            }
          }
        } finally {
          inflight.current.delete(slug);
        }
      })();
    },
    [confirmedValue, markAnonymous],
  );

  const setMany = useCallback((slugs: string[], value: boolean) => {
    for (const slug of slugs) {
      confirmed.current.set(slug, value);
      desired.current.set(slug, value);
    }
    setValues((v) => {
      const copy = { ...v };
      for (const slug of slugs) {
        copy[slug] = value;
      }
      return copy;
    });
  }, []);

  const isLearned = useCallback((slug: string) => values[slug] ?? server.get(slug) ?? false, [values, server]);
  const clearMessage = useCallback(() => setMessage(null), []);
  return { isLearned, toggle, setMany, message, clearMessage };
}
