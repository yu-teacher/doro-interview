import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchPath } from '../routes';

/** 검색 입력. 데스크톱 헤더와 폰의 검색 화면이 같이 쓴다. 입력은 16px 이상이라야 iOS 가 확대하지 않는다. */
/** `landmark`: 검색 영역의 이름. 한 화면에 입력이 둘(헤더·본문)일 수 있어 서로 다른 이름을 준다. */
export function SearchBox({ id = 'search-input', autoFocus = false, landmark = '질문 검색' }: { id?: string; autoFocus?: boolean; landmark?: string }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [value, setValue] = useState(params.get('q') ?? '');

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q) {
      navigate(searchPath(q));
    }
  }

  return (
    <form role="search" aria-label={landmark} onSubmit={submit} className="flex w-full gap-2">
      <label htmlFor={id} className="sr-only">
        질문 검색
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="질문 검색 (예: 프록시 전파)"
        maxLength={100}
        autoComplete="off"
        autoFocus={autoFocus}
        className="min-h-11 min-w-0 flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base md:w-64"
      />
      <button type="submit" className="min-h-11 rounded-md bg-[var(--color-accent)] px-4 font-semibold text-[var(--color-accent-contrast)]">
        검색
      </button>
    </form>
  );
}
