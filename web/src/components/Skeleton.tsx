/**
 * 로딩 뼈대(F0). 화면이 비어 보이지 않게 줄 모양을 보이고, 스크린 리더에는 "불러오는 중…" 만 알린다(뼈대 자체는 숨긴다).
 * 움직임을 줄이는 설정이면 깜빡이지 않는다.
 */
export function Skeleton({ rows = 3, label = '불러오는 중…' }: { rows?: number; label?: string }) {
  return (
    <div role="status" className="py-4">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="h-16 rounded-lg bg-[var(--color-surface-2)] motion-safe:animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
        ))}
      </div>
    </div>
  );
}
