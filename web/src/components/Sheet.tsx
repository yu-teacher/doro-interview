import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** 닫힐 때 포커스를 돌려줄 요소(연 버튼) */
  returnFocusTo?: React.RefObject<HTMLElement | null>;
}

/**
 * 아래에서 올라오는 시트(F0). `<dialog>` 라서 모달(뒤 화면 비활성)이고 Esc 로 닫히며 포커스가 안에 갇힌다. 열리면 제목으로 포커스가 가고,
 * 닫히면 연 버튼으로 돌아간다. 폰에서는 화면 아래에 붙고 데스크톱에서는 가운데 상자다. 바깥(배경)을 누르면 닫힌다.
 */
export function Sheet({ open, title, onClose, children, returnFocusTo }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
      titleRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="sheet-title"
      onClose={() => {
        if (open) {
          onClose();
        }
        returnFocusTo?.current?.focus();
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          onClose(); // 배경(dialog 자체)을 눌렀다
        }
      }}
      className="m-0 mt-auto max-h-[85vh] w-full max-w-none rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-0 text-[var(--color-text)] backdrop:bg-black/50 md:m-auto md:w-[min(92vw,32rem)] md:rounded-2xl"
    >
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-2">
        <h2 id="sheet-title" ref={titleRef} tabIndex={-1} className="text-lg font-bold outline-none">
          {title}
        </h2>
        <button type="button" onClick={onClose} className="min-h-11 min-w-11 rounded-md px-3">
          닫기
        </button>
      </div>
      <div className="max-h-[calc(85vh-4rem)] overflow-y-auto px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">{children}</div>
    </dialog>
  );
}
