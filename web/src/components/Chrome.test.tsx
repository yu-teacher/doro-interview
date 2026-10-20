// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useRef, useState } from 'react';
import { MemoryRouter, Route, Routes, Link } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { a11yViolations } from '../testing/axe';
import { BottomBar } from './chrome';
import { Layout } from './Layout';
import { Segmented } from './Segmented';
import { Sheet } from './Sheet';
import { Skeleton } from './Skeleton';
import { TitleText } from './TitleText';
import { SessionProvider } from '../session/SessionProvider';
import { mockApi } from '../testing/mockFetch';
import { anonymous, SESSION_URL } from '../testing/fixtures';

afterEach(cleanup);

const tabs = () => within(screen.getByRole('navigation', { name: '하단 메뉴' }));

function shell(path: string, withBar = false) {
  mockApi({ [SESSION_URL]: anonymous() });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<div>홈 화면<Link to="/bar">동작 바 화면으로</Link></div>} />
            <Route path="/bar" element={withBar ? <div>바 있는 화면<BottomBar label="이 질문의 동작"><button type="button">학습함</button><button type="button">다음</button></BottomBar></div> : <div>바 없음</div>} />
            <Route path="/explore" element={<div>탐색 화면</div>} />
            <Route path="/t/:topic" element={<div>주제 화면</div>} />
            <Route path="/quiz/:id" element={<div>시험 화면</div>} />
            <Route path="/mine" element={<div>내 질문 화면</div>} />
            <Route path="/stats" element={<div>현황 화면</div>} />
          </Route>
        </Routes>
      </SessionProvider>
    </MemoryRouter>,
  );
}

describe('아래 탭 바', () => {
  it('탭 4개가 순서대로 있고 각각 올바른 경로로 간다', () => {
    shell('/');
    const links = tabs().getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['홈', '탐색', '시험', '내 공부']);
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/', '/explore', '/quiz', '/me']);
  });

  it.each([
    ['/', '홈'],
    ['/explore', '탐색'],
    ['/t/transaction', '탐색'],
    ['/quiz/abc', '시험'],
    ['/mine', '내 공부'],
    ['/stats', '내 공부'],
  ])('%s 에서는 "%s" 탭이 현재 위치(aria-current)이고 다른 탭은 아니다', (path, label) => {
    shell(path);
    const current = tabs().getAllByRole('link').filter((l) => l.getAttribute('aria-current') === 'page');
    expect(current.map((l) => l.textContent)).toEqual([label]);
  });

  it('데스크톱 상단 메뉴도 같은 4개와 현재 위치를 쓴다', () => {
    shell('/explore');
    const nav = within(screen.getByRole('navigation', { name: '주요 메뉴' }));
    expect(nav.getAllByRole('link').map((l) => l.textContent)).toEqual(['홈', '탐색', '시험', '내 공부']);
    expect(nav.getByRole('link', { name: '탐색' }).getAttribute('aria-current')).toBe('page');
  });

  it('헤더에 검색 아이콘 링크(검색 화면으로)와 이름이 있다', () => {
    shell('/');
    expect(screen.getByRole('link', { name: '검색' }).getAttribute('href')).toBe('/search');
  });

  it('axe 위반이 없다', async () => {
    shell('/');
    expect(await a11yViolations()).toEqual([]);
  });
});

describe('아래 동작 바', () => {
  it('동작 바가 있는 화면에서는 탭 바 자리를 대신하고, 떠나면 탭 바가 돌아온다', async () => {
    shell('/', true);
    expect(screen.getByRole('navigation', { name: '하단 메뉴' })).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: '동작 바 화면으로' }));
    expect(await screen.findByRole('region', { name: '이 질문의 동작' })).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: '하단 메뉴' })).toBeNull();
    expect(within(screen.getByRole('region', { name: '이 질문의 동작' })).getAllByRole('button').map((b) => b.textContent)).toEqual(['학습함', '다음']);
  });

  it('동작 바가 없는 화면은 탭 바를 그대로 둔다', () => {
    shell('/bar', false);
    expect(screen.getByRole('navigation', { name: '하단 메뉴' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: '이 질문의 동작' })).toBeNull();
  });
});

describe('TitleText', () => {
  it('백틱 코드를 <code> 로 그리고 나머지는 글자 그대로 둔다', () => {
    const { container } = render(<TitleText text="`@Transactional`은 어떻게 동작하나요? (`ThreadLocal` 포함)" />);
    expect(Array.from(container.querySelectorAll('code')).map((c) => c.textContent)).toEqual(['@Transactional', 'ThreadLocal']);
    expect(container.textContent).toBe('@Transactional은 어떻게 동작하나요? (ThreadLocal 포함)');
  });

  it('짝이 안 맞는 백틱·빈 백틱은 글자 그대로 둔다', () => {
    for (const text of ['a ` b', 'x `` y', '` 끝']) {
      const { container, unmount } = render(<TitleText text={text} />);
      expect(container.querySelector('code'), text).toBeNull();
      expect(container.textContent).toBe(text);
      unmount();
    }
  });

  it('HTML 은 해석하지 않는다', () => {
    const { container } = render(<TitleText text="<b>굵게</b> `<i>x</i>`" />);
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('i')).toBeNull();
    expect(container.querySelector('code')?.textContent).toBe('<i>x</i>');
  });
});

describe('Segmented', () => {
  function Harness() {
    const [v, setV] = useState<'ALL' | 'BASIC'>('ALL');
    return <Segmented label="난이도" value={v} onChange={setV} options={[{ value: 'ALL', label: '전체', count: 25 }, { value: 'BASIC', label: '기본', count: 8 }]} />;
  }

  it('선택을 aria-pressed 로 알리고 누르면 바뀐다', () => {
    render(<Harness />);
    const group = screen.getByRole('group', { name: '난이도' });
    expect(within(group).getByRole('button', { name: '전체 (25)' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(within(group).getByRole('button', { name: '기본 (8)' }));
    expect(within(group).getByRole('button', { name: '기본 (8)' }).getAttribute('aria-pressed')).toBe('true');
    expect(within(group).getByRole('button', { name: '전체 (25)' }).getAttribute('aria-pressed')).toBe('false');
  });
});

describe('Sheet', () => {
  function Harness() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLButtonElement>(null);
    return (
      <div>
        <button ref={ref} type="button" onClick={() => setOpen(true)}>필터 열기</button>
        <Sheet open={open} title="필터" onClose={() => setOpen(false)} returnFocusTo={ref}>
          <button type="button">안의 버튼</button>
        </Sheet>
      </div>
    );
  }

  it('열면 제목으로 포커스가 가고 닫기 버튼으로 닫히며 연 버튼으로 포커스가 돌아온다', () => {
    render(<Harness />);
    const dialog = document.querySelector('dialog') as HTMLDialogElement;
    expect(dialog.open).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: '필터 열기' }));
    expect(dialog.open).toBe(true);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: '필터' }));
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '필터 열기' }));
  });

  it('배경을 누르면 닫히고 안쪽을 누르면 닫히지 않는다', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '필터 열기' }));
    const dialog = document.querySelector('dialog') as HTMLDialogElement;
    fireEvent.click(screen.getByRole('button', { name: '안의 버튼' }));
    expect(dialog.open).toBe(true);
    fireEvent.click(dialog); // 배경(dialog 자체)
    expect(dialog.open).toBe(false);
  });

  it('Esc(close 이벤트)로 닫히면 상태도 닫힘으로 맞춘다', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '필터 열기' }));
    const dialog = document.querySelector('dialog') as HTMLDialogElement;
    dialog.removeAttribute('open');
    fireEvent(dialog, new Event('close'));
    fireEvent.click(screen.getByRole('button', { name: '필터 열기' }));
    expect(dialog.open).toBe(true); // 상태가 닫힘으로 맞춰졌으니 다시 열린다
  });
});

describe('Skeleton', () => {
  it('스크린 리더에는 불러오는 중만 알리고 뼈대는 숨긴다', () => {
    const { container } = render(<Skeleton rows={2} />);
    expect(screen.getByRole('status').textContent).toBe('불러오는 중…');
    expect(container.querySelector('[aria-hidden="true"]')?.children).toHaveLength(2);
  });
});
