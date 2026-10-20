interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** 스크린 리더가 어느 질문의 체크인지 알도록 이름에 덧붙인다(화면에는 보이지 않는다). */
  title: string;
  /** 목록 카드용 작은 형태(보이는 글자는 "학습함") */
  compact?: boolean;
}

/**
 * "완전히 학습함" 체크. 보이는 글자가 이름의 앞부분이라(WCAG 라벨-이름 일치) 음성 제어로도 부를 수 있다.
 * 터치 영역은 44px 이상이다.
 */
export function LearnedCheckbox({ checked, onChange, title, compact = false }: Props) {
  const visible = compact ? '학습함' : '완전히 학습함';
  return (
    <label className={`flex min-h-11 min-w-11 cursor-pointer items-center gap-2 ${compact ? 'flex-col justify-center px-2 text-xs' : ''}`}>
      {/* 이름을 aria-label 로 못 박는다: 숨은 글자를 라벨에 이어 붙이면 브라우저마다 공백이 달라진다(실제 Chromium 은 "학습함 : 제목") */}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={`${visible}: ${title}`} className="size-6 shrink-0" />
      <span aria-hidden="true">{visible}</span>
    </label>
  );
}
