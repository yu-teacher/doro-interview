import { useState, type FormEvent } from 'react';
import { Link, Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { SERVICE_NAME } from '../config';
import { conceptsPath, searchPath } from '../routes';

function SearchForm() {
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
    <form role="search" onSubmit={submit} className="flex w-full gap-2 sm:w-auto">
      <label htmlFor="search-input" className="sr-only">
        질문 검색
      </label>
      <input
        id="search-input"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="질문 검색 (예: 프록시 전파)"
        maxLength={100}
        autoComplete="off"
        // 16px 이상이라야 iOS 가 입력할 때 화면을 확대하지 않는다
        className="min-h-11 min-w-0 flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base sm:w-72"
      />
      <button
        type="submit"
        className="min-h-11 rounded-md bg-[var(--color-accent)] px-4 font-semibold text-[var(--color-accent-contrast)]"
      >
        검색
      </button>
    </form>
  );
}

export function Layout() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4">
      <header className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="주요 메뉴" className="flex items-center gap-4">
          <Link to="/" className="inline-flex min-h-11 items-center text-lg font-bold no-underline">
            {SERVICE_NAME}
          </Link>
          <Link to={conceptsPath()} className="inline-flex min-h-11 items-center">
            개념
          </Link>
        </nav>
        <SearchForm />
      </header>
      <main id="main" className="flex-1 pb-12">
        <Outlet />
      </main>
      <footer className="border-t border-[var(--color-border)] py-4 text-sm text-[var(--color-muted)]">
        공식 문서를 읽고 정리한 면접 질문입니다. 검수 상태와 근거 표기를 확인하세요.
      </footer>
    </div>
  );
}
