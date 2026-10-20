import type { ReactNode } from 'react';

/** 인라인 SVG 아이콘(라이브러리 없음). 장식이라 스크린 리더에서 숨기고, 의미는 항상 옆의 글자 라벨이 맡는다. */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export const HomeIcon = () => (
  <Icon>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10v10h13V10" />
  </Icon>
);

export const CompassIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="m15.5 8.5-2 5-5 2 2-5z" />
  </Icon>
);

export const QuizIcon = () => (
  <Icon>
    <rect x="4" y="3.5" width="16" height="17" rx="2" />
    <path d="M8 9h8M8 13h8M8 17h4" />
  </Icon>
);

export const UserIcon = () => (
  <Icon>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </Icon>
);

export const SearchIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Icon>
);

export const FilterIcon = () => (
  <Icon>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </Icon>
);

export const NextIcon = () => (
  <Icon>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);
