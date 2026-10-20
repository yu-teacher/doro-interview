interface Props {
  value: number;
  max: number;
  /** 무엇의 진도인지(스크린 리더용 이름) */
  label: string;
}

/** 진도 막대. 숫자(n/m)를 함께 보여 색에만 의존하지 않고, progressbar 역할로 값을 알린다. */
export function ProgressBar({ value, max, label }: Props) {
  const percent = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${max}개 중 ${value}개 학습함`}
        className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-border)]"
      >
        <div className="h-full bg-[var(--color-accent)]" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-sm tabular-nums text-[var(--color-text)]">
        {value}/{max}
      </span>
    </div>
  );
}
