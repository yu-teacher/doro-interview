import { useEffect, useState } from 'react';

/**
 * 새 배포가 옛 해시 파일을 지워서 열려 있던 옛 화면이 지연 조각(마크다운 렌더러 등)을 받지 못할 때(`vite:preloadError`)의 안내.
 * 빈 화면 대신 "새 버전" 이라고 알려 주고, 새로고침은 **사용자가 누른다**(작성 중인 글을 말없이 날리지 않는다).
 * 서비스 워커 유무와 무관하게 첫 방문자도 지켜 준다.
 */
export function UpdateNotice() {
  const [stale, setStale] = useState(false);
  useEffect(() => {
    const onError = (event: Event) => {
      event.preventDefault(); // 기본 동작(오류 던지기)을 막고 안내로 바꾼다
      setStale(true);
    };
    window.addEventListener('vite:preloadError', onError);
    return () => window.removeEventListener('vite:preloadError', onError);
  }, []);
  if (!stale) {
    return null;
  }
  return (
    <div role="alert" className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center shadow-lg">
      <p className="font-semibold">새 버전이 나왔습니다.</p>
      <p className="mt-1 text-sm text-[var(--color-muted)]">화면을 새로 불러와야 이어서 볼 수 있습니다. 쓰던 글이 있으면 먼저 저장해 주세요.</p>
      {/* 사용자가 직접 누르는 새로고침이다(상태 불일치를 숨기는 자동 location.reload 가 아니다: eslint 규칙은 그 호출만 막는다) */}
      <button
        type="button"
        onClick={() => window.location.assign(window.location.href)}
        className="mt-2 min-h-11 rounded-md bg-[var(--color-accent)] px-4 font-semibold text-[var(--color-accent-contrast)]"
      >
        새로고침
      </button>
    </div>
  );
}
