// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import { AsyncView } from './AsyncView';

afterEach(cleanup);

function view(state: Parameters<typeof AsyncView<string>>[0]['state'], reload = vi.fn(), notFound?: string) {
  render(
    <MemoryRouter>
      <AsyncView state={state} reload={reload} notFoundMessage={notFound}>
        {(data) => <p>데이터: {data}</p>}
      </AsyncView>
    </MemoryRouter>,
  );
  return reload;
}

describe('AsyncView', () => {
  it('로딩은 status 역할로 알린다', () => {
    view({ status: 'loading' });
    expect(screen.getByRole('status').textContent).toContain('불러오는 중');
  });

  it('성공이면 자식을 그린다', () => {
    view({ status: 'success', data: '값' });
    expect(screen.getByText('데이터: 값')).toBeTruthy();
  });

  it('일반 오류는 alert 와 다시 시도 버튼을 보여 주고 누르면 reload 를 부른다', () => {
    const reload = view({ status: 'error', error: new ApiError(0, 'NETWORK', '서버에 연결할 수 없습니다.') });
    expect(screen.getByRole('alert').textContent).toContain('서버에 연결할 수 없습니다.');
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('404 는 재시도 버튼 없이 찾을 수 없음 안내와 처음으로 링크를 보여 준다', () => {
    view({ status: 'error', error: new ApiError(404, 'COMMON-404-01', '요청한 리소스를 찾을 수 없습니다.') }, vi.fn(), '찾을 수 없는 질문입니다.');
    expect(screen.getByRole('alert').textContent).toContain('찾을 수 없는 질문입니다.');
    expect(screen.queryByRole('button', { name: '다시 시도' })).toBeNull();
    expect(screen.getByRole('link', { name: '처음으로' }).getAttribute('href')).toBe('/');
  });
});
