import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * 아래 고정 영역(F0). 폰에서는 평소 탭 바가 있고, 화면이 **아래 고정 동작 바**(체크·다음·평가 등)를 내면 그 바가 탭 바를 대신한다
 * (두 줄이 쌓이면 화면의 1/6 이 도구가 된다). 데스크톱에서는 탭 바는 숨고 동작 바는 본문 아래에 붙어 보인다.
 */
interface ChromeValue {
  slot: HTMLElement | null;
  register: () => () => void;
}

export const ChromeContext = createContext<ChromeValue>({ slot: null, register: () => () => undefined });

/** Layout 이 쓴다: 슬롯 요소, 동작 바가 있는지, 컨텍스트 값. */
export function useChromeState() {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [count, setCount] = useState(0);
  const register = useCallback(() => {
    setCount((c) => c + 1);
    return () => setCount((c) => c - 1);
  }, []);
  const value = useMemo(() => ({ slot, register }), [slot, register]);
  return { setSlot, hasBar: count > 0, value };
}

interface BottomBarProps {
  /** 스크린 리더용 이름 */
  label: string;
  children: ReactNode;
}

/** 탭 바 자리에 고정되는 동작 바. 슬롯이 없는 곳에서는 아무것도 그리지 않는다. */
export function BottomBar({ label, children }: BottomBarProps) {
  const { slot, register } = useContext(ChromeContext);
  useEffect(() => register(), [register]);
  if (!slot) {
    return null;
  }
  return createPortal(
    <div role="region" aria-label={label} className="border-t border-[var(--color-border)] bg-[var(--color-surface)] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2">{children}</div>
    </div>,
    slot,
  );
}
