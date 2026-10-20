import type { BadgeKind } from './badges';

const STYLE: Record<BadgeKind, string> = {
  official: 'text-[var(--color-official)] border-[var(--color-official)]',
  extra: 'text-[var(--color-extra)] border-[var(--color-extra)]',
  lab: 'text-[var(--color-lab)] border-[var(--color-lab)]',
};

/** 근거 종류 배지. 색에만 기대지 않도록 글자(공식 문서 / 보충 / 실험 확인)를 항상 보여 준다. */
export function Badge({ kind, children }: { kind: BadgeKind; children: React.ReactNode }) {
  return (
    <span
      data-badge={kind}
      className={`mx-0.5 inline-block rounded border px-1.5 text-xs font-semibold leading-5 align-baseline whitespace-nowrap ${STYLE[kind]}`}
    >
      {children}
    </span>
  );
}
