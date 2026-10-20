interface Option<T extends string> {
  value: T;
  label: string;
  /** 라벨 옆의 작은 숫자(개수) */
  count?: number;
}

interface Props<T extends string> {
  /** 그룹 이름(스크린 리더) */
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}

/**
 * 분할 버튼(F0): 한 줄에서 하나를 고른다(예: 난이도 전체/기본/심화/함정). 각 버튼은 aria-pressed 로 선택을 알리고 44px 이상이다.
 */
export function Segmented<T extends string>({ label, value, options, onChange }: Props<T>) {
  return (
    <div role="group" aria-label={label} className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`min-h-11 min-w-0 flex-1 rounded-md px-2 text-sm ${
              on ? 'bg-[var(--color-accent)] font-semibold text-[var(--color-accent-contrast)]' : 'text-[var(--color-text)]'
            }`}
          >
            {o.label}
            {o.count !== undefined && (
              <>
                {' '}
                <span className="opacity-80">({o.count})</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
