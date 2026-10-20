// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { a11yViolations } from '../testing/axe';
import { authed, detail, quizItem, quizSession, SESSION_URL } from '../testing/fixtures';
import { errorResponse, mockApi, okResponse, respond } from '../testing/mockFetch';
import { renderApp } from '../testing/renderApp';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const SID = '66666666-6666-4666-8666-666666666666';
const QUIZ = `/interview/api/v1/quiz/${SID}`;
const AI = '/interview/api/v1/me/ai';
const FEEDBACK = `PUT ${QUIZ}/items/1/feedback`;

const base = (routes: Record<string, unknown> = {}, item = {}) =>
  mockApi({
    [SESSION_URL]: authed(),
    [QUIZ]: quizSession([quizItem(1, item)], { sessionId: SID }),
    '/interview/api/v1/questions/tx-01': detail({ slug: 'tx-01', spokenAnswer: '모범 답변입니다.', keywords: [], importance: null }),
    [AI]: { enabled: true, perUserPerDay: 20, remainingToday: 7 },
    ...routes,
  });

async function reveal(answer = '') {
  renderApp(`/quiz/${SID}`);
  await screen.findByRole('heading', { level: 2, name: '질문 1' });
  if (answer) {
    fireEvent.change(screen.getByRole('textbox', { name: /내 답/ }), { target: { value: answer } });
  }
  fireEvent.click(screen.getByRole('button', { name: '모범 답변 보기' }));
  await screen.findByText('모범 답변입니다.');
}

describe('AI 피드백', () => {
  it('서버가 꺼져 있으면 구역도 버튼도 없다', async () => {
    base({ [AI]: { enabled: false, perUserPerDay: 20, remainingToday: 0 } });
    await reveal('내 답');
    await waitFor(() => expect(screen.getByRole('button', { name: '맞음' })).toBeTruthy());
    expect(screen.queryByRole('heading', { name: 'AI 피드백' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'AI 피드백 받기' })).toBeNull();
  });

  it('상태를 못 받아도(404 등) 시험에는 영향이 없고 구역이 없다', async () => {
    base({ [AI]: respond(() => errorResponse(500, 'X', 'x')) });
    await reveal('내 답');
    await waitFor(() => expect(screen.getByRole('button', { name: '맞음' })).toBeTruthy());
    expect(screen.queryByRole('heading', { name: 'AI 피드백' })).toBeNull();
  });

  it('켜져 있으면 전송 안내와 남은 횟수를 보이고, 누르기 전에는 요청하지 않는다', async () => {
    const { requests } = base();
    await reveal('내 답');
    expect(await screen.findByRole('heading', { name: 'AI 피드백' })).toBeTruthy();
    expect(screen.getByText(/외부 AI 서비스로 전송됩니다/)).toBeTruthy();
    expect(screen.getByText(/오늘 7회 남았습니다/)).toBeTruthy();
    expect(requests.some((r) => r.path.endsWith('/feedback'))).toBe(false);
  });

  it('내 답이 비어 있으면 받을 수 없다고 알리고 버튼을 막는다', async () => {
    base();
    await reveal('');
    const button = (await screen.findByRole('button', { name: 'AI 피드백 받기' })) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(screen.getByText(/내 답을 적어야 피드백을 받을 수 있습니다/)).toBeTruthy();
  });

  it('누르면 내 답을 PUT 하고 피드백을 일반 텍스트로 보여 준다', async () => {
    const { requests } = base({ [FEEDBACK]: { feedback: '잘했어요 <b>굵게</b>\n둘째 줄', cached: false, remainingToday: 6 } });
    await reveal('프록시가 대신 받습니다');
    fireEvent.click(await screen.findByRole('button', { name: 'AI 피드백 받기' }));
    const box = await screen.findByTestId('ai-feedback');
    expect(box.textContent).toBe('잘했어요 <b>굵게</b>\n둘째 줄');
    expect(box.querySelector('b')).toBeNull();
    const put = requests.find((r) => r.method === 'PUT' && r.path.endsWith('/feedback')) as unknown as { body: unknown; headers: Record<string, string> };
    expect(put.body).toEqual({ answerText: '프록시가 대신 받습니다' });
    expect(put.headers['X-Interview-Csrf']).toBe('1');
    expect(screen.queryByRole('button', { name: 'AI 피드백 받기' })).toBeNull(); // 문항마다 한 번
    expect(screen.getByRole('button', { name: '맞음' })).toBeTruthy();
  });

  it('만드는 동안에는 버튼이 막히고 한 번만 보낸다', async () => {
    let release: (r: Response) => void = () => undefined;
    const { requests } = base({ [FEEDBACK]: respond(() => new Promise<Response>((resolve) => { release = resolve; })) });
    await reveal('답');
    const button = await screen.findByRole('button', { name: 'AI 피드백 받기' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect((await screen.findByRole('button', { name: '피드백을 만드는 중…' }) as HTMLButtonElement).disabled).toBe(true);
    expect(requests.filter((r) => r.path.endsWith('/feedback'))).toHaveLength(1);
    release(okResponse({ feedback: '완료', cached: false, remainingToday: 1 }));
    expect(await screen.findByTestId('ai-feedback')).toBeTruthy();
  });

  it('한도(429)와 장애(503)는 안내만 하고 시험은 계속할 수 있으며 다시 시도할 수 있다', async () => {
    let attempt = 0;
    base({
      [FEEDBACK]: respond(() => {
        attempt += 1;
        if (attempt === 1) {
          return errorResponse(429, 'AI-429-01', 'AI 피드백 한도를 모두 썼습니다. 잠시 뒤에 다시 시도해 주세요.');
        }
        if (attempt === 2) {
          return errorResponse(503, 'AI-503-01', '지금은 AI 피드백을 받을 수 없습니다. 시험은 그대로 계속할 수 있습니다.');
        }
        return okResponse({ feedback: '이번엔 됐습니다', cached: false, remainingToday: 5 });
      }),
    });
    await reveal('답');
    const ask = () => screen.findByRole('button', { name: 'AI 피드백 받기' });
    fireEvent.click(await ask());
    expect((await screen.findByRole('alert')).textContent).toContain('한도');
    expect(screen.getByRole('button', { name: '맞음' })).toBeTruthy(); // 평가는 계속 가능
    fireEvent.click(await ask());
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('계속할 수 있습니다'));
    fireEvent.click(await ask());
    expect((await screen.findByTestId('ai-feedback')).textContent).toBe('이번엔 됐습니다');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('오늘 남은 횟수가 0이면 버튼이 막힌다', async () => {
    base({ [AI]: { enabled: true, perUserPerDay: 20, remainingToday: 0 } });
    await reveal('답');
    expect((await screen.findByRole('button', { name: 'AI 피드백 받기' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/오늘 0회 남았습니다/)).toBeTruthy();
  });

  it('이미 받은 피드백은 이어 풀 때 바로 보이고, 기능이 꺼져 있어도 보인다', async () => {
    base({ [AI]: { enabled: false, perUserPerDay: 20, remainingToday: 0 } }, { feedback: '저장해 둔 피드백' });
    await reveal('답');
    expect((await screen.findByTestId('ai-feedback')).textContent).toBe('저장해 둔 피드백');
    expect(screen.queryByRole('button', { name: 'AI 피드백 받기' })).toBeNull();
  });

  it('결과 화면에서 틀린 문항의 AI 피드백을 펼쳐 볼 수 있다', async () => {
    mockApi({
      [SESSION_URL]: authed(),
      [QUIZ]: quizSession([quizItem(1, { result: 'WRONG', feedback: '결과 화면의 피드백' })], { sessionId: SID, finishedAt: '2026-10-20T01:00:00Z' }),
    });
    renderApp(`/quiz/${SID}`);
    const summary = await screen.findByText('AI 피드백 보기');
    const details = summary.closest('details') as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(within(details).getByTestId('ai-feedback').textContent).toBe('결과 화면의 피드백');
  });

  it('접근성 위반이 없다', async () => {
    base({ [FEEDBACK]: { feedback: '피드백', cached: false, remainingToday: 3 } });
    await reveal('답');
    expect(await a11yViolations()).toEqual([]);
    fireEvent.click(await screen.findByRole('button', { name: 'AI 피드백 받기' }));
    await screen.findByTestId('ai-feedback');
    expect(await a11yViolations()).toEqual([]);
  });
});
