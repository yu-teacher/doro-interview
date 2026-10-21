// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { a11yViolations } from '../testing/axe';
import { anonymous, authed, SESSION_URL } from '../testing/fixtures';
import { errorResponse, mockApi, respond } from '../testing/mockFetch';
import { renderApp } from '../testing/renderApp';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const RESET = 'PUT /interview/api/v1/me/reset';
const resets = (requests: { method: string; path: string }[]) => requests.filter((r) => r.method === 'PUT' && r.path.endsWith('/me/reset'));

async function openSheet() {
  renderApp('/me');
  fireEvent.click(await screen.findByRole('button', { name: '학습 현황 초기화…' }));
  return within(await screen.findByRole('dialog', { name: '학습 현황을 초기화할까요?' }));
}

describe('학습 현황 초기화(내 공부)', () => {
  it('비로그인에게는 초기화 구역이 없다', async () => {
    mockApi({ [SESSION_URL]: anonymous() });
    renderApp('/me');
    await screen.findByRole('heading', { level: 1, name: '내 공부' });
    expect(screen.queryByRole('button', { name: '학습 현황 초기화…' })).toBeNull();
  });

  it('누르면 지워지는 것과 남는 것을 알리는 확인창이 뜨고, 확인 전에는 요청하지 않는다', async () => {
    const { requests } = mockApi({ [SESSION_URL]: authed(), [RESET]: { reset: true } });
    const sheet = await openSheet();
    expect(sheet.getByText('학습 체크(진도)')).toBeTruthy();
    expect(sheet.getByText('시험 기록과 통계, 다시 공부 후보')).toBeTruthy();
    expect(sheet.getByText(/노트, 내 질문, 설정은 그대로 남습니다/)).toBeTruthy();
    expect(resets(requests)).toHaveLength(0);
  });

  it('취소하면 아무것도 보내지 않는다', async () => {
    const { requests } = mockApi({ [SESSION_URL]: authed(), [RESET]: { reset: true } });
    const sheet = await openSheet();
    fireEvent.click(sheet.getByRole('button', { name: '취소' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: '학습 현황을 초기화할까요?' })).toBeNull());
    expect(resets(requests)).toHaveLength(0);
  });

  it('확인하면 한 번 PUT 하고 확인창을 닫으며 결과를 알린다', async () => {
    const { requests } = mockApi({ [SESSION_URL]: authed(), [RESET]: { reset: true } });
    const sheet = await openSheet();
    fireEvent.click(sheet.getByRole('button', { name: '초기화' }));
    expect(await screen.findByRole('status')).toBeTruthy();
    expect(screen.getByText('학습 현황을 초기화했습니다.')).toBeTruthy();
    expect(resets(requests)).toHaveLength(1);
    expect((resets(requests)[0] as unknown as { headers: Record<string, string> }).headers['X-Interview-Csrf']).toBe('1');
  });

  it('실패하면 안내하고 다시 시도할 수 있다', async () => {
    let calls = 0;
    mockApi({
      [SESSION_URL]: authed(),
      [RESET]: respond(() => {
        calls += 1;
        return calls === 1 ? errorResponse(500, 'X', 'x') : new Response(JSON.stringify({ success: true, data: { reset: true } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }),
    });
    let sheet = await openSheet();
    fireEvent.click(sheet.getByRole('button', { name: '초기화' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '학습 현황 초기화…' }));
    sheet = within(await screen.findByRole('dialog', { name: '학습 현황을 초기화할까요?' }));
    fireEvent.click(sheet.getByRole('button', { name: '초기화' }));
    await waitFor(() => expect(screen.getByText('학습 현황을 초기화했습니다.')).toBeTruthy());
  });

  it('접근성 위반이 없다(확인창이 열린 상태)', async () => {
    mockApi({ [SESSION_URL]: authed(), [RESET]: { reset: true } });
    await openSheet();
    expect(await a11yViolations()).toEqual([]);
  });
});
