import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** 닫힐 때 포커스를 돌려줄 요소(호출한 버튼) */
  returnFocusTo?: React.RefObject<HTMLElement | null>;
}

/**
 * 확인창(`<dialog>`). 열리면 취소 버튼에 포커스가 가고(실수로 확인하지 않게), Esc 로 닫히며, 닫히면 호출한 버튼으로 포커스가 돌아간다.
 * 모달이라 뒤의 화면은 브라우저가 비활성으로 만든다.
 */
export function ConfirmDialog({ open, title, children, confirmLabel, onConfirm, onCancel, returnFocusTo }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleClose() {
    // Esc 로 브라우저가 직접 닫은 경우도 같은 경로로 정리한다
    if (open) {
      onCancel();
    }
    returnFocusTo?.current?.focus();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      onClose={handleClose}
      className="m-auto w-[min(92vw,26rem)] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-[var(--color-text)] backdrop:bg-black/50"
    >
      <h2 id="confirm-title" className="text-lg font-bold">
        {title}
      </h2>
      <div className="mt-2">{children}</div>
      <div className="mt-5 flex justify-end gap-2">
        <button
          ref={cancelRef}
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4"
        >
          취소
        </button>
        <button type="button" onClick={onConfirm} className="min-h-11 rounded-md bg-[var(--color-accent)] px-4 font-semibold text-[var(--color-accent-contrast)]">
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
