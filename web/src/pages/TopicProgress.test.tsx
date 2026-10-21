// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { a11yViolations } from '../testing/axe';
import { anonymous, authed, summary, SESSION_URL, topicView } from '../testing/fixtures';
import { errorResponse, mockApi, okResponse, respond, type SentRequest } from '../testing/mockFetch';
import { renderApp } from '../testing/renderApp';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const TOPIC = '/interview/api/v1/topics/transaction';
const BULK = 'PUT /interview/api/v1/progress';

const questions = (learned?: Record<string, boolean>) =>
  ['tx-01', 'tx-02', 'tx-03', 'tx-04', 'tx-05'].map((slug, i) =>
    summary(slug, { title: `질문 ${i + 1}`, tier: i < 3 ? 'BASIC' : 'DEEP', ...(learned ? { learned: learned[slug] ?? false } : {}) }),
  );

const base = (learned?: Record<string, boolean>) => ({
  [TOPIC]: topicView(questions(learned)),
  '/interview/api/v1/concepts': [],
});

const checkbox = (title: string) => screen.getByRole('checkbox', { name: new RegExp(`: ${title}$`) }) as HTMLInputElement;
const putCalls = (requests: SentRequest[]) => requests.filter((r) => r.method === 'PUT');

async function open(routes: Record<string, unknown>, path = '/t/transaction') {
  const api = mockApi(routes);
  renderApp(path);
  await screen.findByRole('heading', { level: 1, name: '트랜잭션' });
  // 마운트 직후의 효과(낙관적 값 초기화)가 끝난 뒤에 조작한다: 느린 환경에서 클릭이 초기화에 덮이는 경합을 없앤다
  await act(async () => undefined);
  return api;
}

describe('주제 화면: 로그인 상태', () => {
  it('질문마다 체크박스가 있고 서버의 체크 상태를 보여 준다', async () => {
    await open({ [SESSION_URL]: authed(), ...base({ 'tx-02': true, 'tx-04': true }) });
    expect(screen.getAllByRole('checkbox').filter((c) => c.closest('li'))).toHaveLength(5);
    expect(checkbox('질문 2').checked).toBe(true);
    expect(checkbox('질문 1').checked).toBe(false);
    // 이름은 보이는 글자("학습함")로 시작하고 질문 제목을 포함한다
    expect(screen.getByRole('checkbox', { name: '학습함: 질문 2' })).toBeTruthy();
  });

  it('체크하면 CSRF 헤더를 붙인 PUT 이 나가고 진도 막대가 바로 바뀐다', async () => {
    const { requests } = await open({
      [SESSION_URL]: authed(), ...base({ 'tx-02': true }),
      'PUT /interview/api/v1/progress/tx-01': okResponse({ slug: 'tx-01', learned: true }),
    });
    const bar = () => screen.getByRole('progressbar', { name: '트랜잭션 학습 진도' });
    expect(bar().getAttribute('aria-valuenow')).toBe('1');
    expect(bar().getAttribute('aria-valuemax')).toBe('5');
    fireEvent.click(checkbox('질문 1'));
    expect(checkbox('질문 1').checked).toBe(true);
    expect(bar().getAttribute('aria-valuenow')).toBe('2');
    await waitFor(() => expect(putCalls(requests)).toHaveLength(1));
    expect(putCalls(requests)[0].headers['X-Interview-Csrf']).toBe('1');
    expect(putCalls(requests)[0].body).toEqual({ learned: true });
  });

  it('저장이 실패하면 체크를 되돌리고 role=status 로 알린다', async () => {
    await open({
      [SESSION_URL]: authed(), ...base(),
      'PUT /interview/api/v1/progress/tx-01': respond(() => errorResponse(503, 'AUTH-503-02', 'x')),
    });
    fireEvent.click(checkbox('질문 1'));
    const status = await screen.findByText(/로그인 서비스에 잠시 연결할 수 없습니다/);
    expect(status.closest('[role="status"]')).toBeTruthy();
    expect(checkbox('질문 1').checked).toBe(false);
    expect(screen.getByRole('progressbar', { name: '트랜잭션 학습 진도' }).getAttribute('aria-valuenow')).toBe('0');
  });

  it('"내 체크 상태" 필터는 낙관적으로 바뀐 값도 반영한다', async () => {
    await open({
      [SESSION_URL]: authed(), ...base({ 'tx-02': true }),
      'PUT /interview/api/v1/progress/tx-03': okResponse({ slug: 'tx-03', learned: true }),
    });
    fireEvent.change(screen.getByLabelText('내 체크 상태'), { target: { value: 'yes' } });
    expect(screen.getAllByRole('checkbox').filter((c) => c.closest('li'))).toHaveLength(1);
    fireEvent.change(screen.getByLabelText('내 체크 상태'), { target: { value: 'no' } });
    expect(screen.getAllByRole('checkbox').filter((c) => c.closest('li'))).toHaveLength(4);
    fireEvent.click(checkbox('질문 3')); // 아직 안 함 목록에서 체크하면 목록에서 빠진다
    await waitFor(() => expect(screen.getAllByRole('checkbox').filter((c) => c.closest('li'))).toHaveLength(3));
    expect(screen.getByRole('status', { name: '' }).textContent).toContain('질문 3개');
  });

  it('필터가 걸린 상태에서도 일괄은 주제 전체 개수를 쓴다', async () => {
    const { requests } = await open({ [SESSION_URL]: authed(), ...base(), [BULK]: okResponse({ topic: 'transaction', learned: true, count: 5 }) }, '/t/transaction?tier=DEEP');
    fireEvent.click(screen.getByRole('button', { name: '모두 학습함으로 표시' }));
    fireEvent.click(screen.getByRole('button', { name: '표시하기' }));
    await waitFor(() => expect(putCalls(requests)).toHaveLength(1));
    expect(putCalls(requests)[0].body).toEqual({ topic: 'transaction', learned: true, expectedCount: 5 });
  });
});

describe('주제 화면: 일괄 확인창', () => {
  it('누르기만 해서는 요청이 나가지 않고, 확인창은 취소에 포커스가 간다', async () => {
    const { requests } = await open({ [SESSION_URL]: authed(), ...base() });
    const trigger = screen.getByRole('button', { name: '모두 학습함으로 표시' });
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: '모두 학습함으로 표시' });
    expect(within(dialog).getByText('5개 질문을 학습 완료로 표시합니다.')).toBeTruthy();
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: '취소' }));
    expect(putCalls(requests)).toHaveLength(0);
  });

  it('취소하면 닫히고 호출한 버튼으로 포커스가 돌아온다', async () => {
    const { requests } = await open({ [SESSION_URL]: authed(), ...base() });
    const trigger = screen.getByRole('button', { name: '모두 해제' });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    await waitFor(() => expect(document.querySelector('dialog[aria-labelledby="confirm-title"]')?.hasAttribute('open')).toBe(false));
    expect(document.activeElement).toBe(trigger);
    expect(putCalls(requests)).toHaveLength(0);
  });

  it('Esc 로 닫혀도 같다(브라우저가 직접 닫는 경우)', async () => {
    const { requests } = await open({ [SESSION_URL]: authed(), ...base() });
    const trigger = screen.getByRole('button', { name: '모두 학습함으로 표시' });
    fireEvent.click(trigger);
    const dialog = document.querySelector('dialog[aria-labelledby="confirm-title"]') as HTMLDialogElement;
    dialog.removeAttribute('open');
    fireEvent(dialog, new Event('close'));
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(putCalls(requests)).toHaveLength(0);
    // 다시 열 수 있다
    fireEvent.click(trigger);
    expect(dialog.hasAttribute('open')).toBe(true);
  });

  it('확인하면 확인창에 보여 준 개수와 함께 요청하고 전부 체크된다', async () => {
    const { requests } = await open({ [SESSION_URL]: authed(), ...base(), [BULK]: okResponse({ topic: 'transaction', learned: true, count: 5 }) });
    fireEvent.click(screen.getByRole('button', { name: '모두 학습함으로 표시' }));
    fireEvent.click(screen.getByRole('button', { name: '표시하기' }));
    await waitFor(() => expect(checkbox('질문 5').checked).toBe(true));
    expect(putCalls(requests)[0].body).toEqual({ topic: 'transaction', learned: true, expectedCount: 5 });
    expect(putCalls(requests)[0].headers['X-Interview-Csrf']).toBe('1');
    expect(screen.getAllByRole('checkbox').filter((c) => c.closest('li') && (c as HTMLInputElement).checked)).toHaveLength(5);
    expect(screen.getByRole('progressbar', { name: '트랜잭션 학습 진도' }).getAttribute('aria-valuenow')).toBe('5');
    expect(screen.getByText('5개 질문을 학습함으로 표시했습니다.').closest('[role="status"]')).toBeTruthy();
  });

  it('모두 해제도 같은 방식이다', async () => {
    const { requests } = await open({
      [SESSION_URL]: authed(), ...base({ 'tx-01': true, 'tx-02': true }),
      [BULK]: okResponse({ topic: 'transaction', learned: false, count: 5 }),
    });
    fireEvent.click(screen.getByRole('button', { name: '모두 해제' }));
    expect(screen.getByText('5개 질문을 학습 표시에서 해제합니다.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '해제하기' }));
    await waitFor(() => expect(checkbox('질문 1').checked).toBe(false));
    expect(putCalls(requests)[0].body).toEqual({ topic: 'transaction', learned: false, expectedCount: 5 });
  });

  it('개수가 달라져 409 가 오면 안내하고 다시 받은 개수로 확인창을 다시 연다', async () => {
    let topicCalls = 0;
    const six = [...questions(), summary('tx-06', { title: '질문 6' })];
    await open({
      [SESSION_URL]: authed(),
      [TOPIC]: respond(() => okResponse(topicView(topicCalls++ === 0 ? questions() : six))),
      '/interview/api/v1/concepts': [],
      [BULK]: respond(() => errorResponse(409, 'PROGRESS-409-01', '질문 수가 바뀌었습니다. 다시 확인해 주세요.')),
    });
    fireEvent.click(screen.getByRole('button', { name: '모두 학습함으로 표시' }));
    fireEvent.click(screen.getByRole('button', { name: '표시하기' }));
    expect(await screen.findByText('6개 질문을 학습 완료로 표시합니다.')).toBeTruthy();
    expect(screen.getByText('질문 수가 바뀌었습니다. 다시 확인해 주세요.')).toBeTruthy();
    expect(document.querySelector('dialog[aria-labelledby="confirm-title"]')?.hasAttribute('open')).toBe(true);
    expect(topicCalls).toBe(2);
  });

  it('일괄이 401 이면 세션을 비로그인으로 맞춘다', async () => {
    await open({ [SESSION_URL]: authed(), ...base(), [BULK]: respond(() => errorResponse(401, 'AUTH-401-01', 'x')) });
    fireEvent.click(screen.getByRole('button', { name: '모두 학습함으로 표시' }));
    fireEvent.click(screen.getByRole('button', { name: '표시하기' }));
    expect(await screen.findByRole('link', { name: '로그인하고 학습 체크하기' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '모두 학습함으로 표시' })).toBeNull();
  });
});

describe('주제 화면: 비로그인·세션 오류', () => {
  it('비로그인에는 죽은 체크박스 대신 로그인 링크(돌아올 경로 포함)가 있다', async () => {
    await open({ [SESSION_URL]: anonymous(), ...base() }, '/t/transaction?tier=BASIC');
    expect(screen.queryAllByRole('checkbox').filter((c) => c.closest('li'))).toHaveLength(0);
    expect(screen.queryByRole('progressbar')).toBeNull();
    const link = screen.getByRole('link', { name: '로그인하고 학습 체크하기' });
    expect(link.getAttribute('href')).toBe('/interview/api/v1/bff/login?return=%2Ft%2Ftransaction%3Ftier%3DBASIC');
    expect(screen.queryByLabelText('내 체크 상태')).toBeNull();
  });

  it('세션을 알 수 없으면(오류) 읽기 전용으로 보이고 로그인 안내를 추측해 내지 않는다', async () => {
    await open({ [SESSION_URL]: respond(() => errorResponse(503, 'AUTH-503-02', 'x')), ...base() });
    expect(screen.queryAllByRole('checkbox').filter((c) => c.closest('li'))).toHaveLength(0);
    expect(screen.getByText('로그인 상태를 확인하지 못했습니다.')).toBeTruthy();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeTruthy();
  });

  it('세션 확인이 끝날 때까지 주제 데이터를 요청하지 않는다(비로그인 응답을 받고 곧 다시 받는 깜빡임 방지)', async () => {
    let release: (r: Response) => void = () => undefined;
    const { calls } = mockApi({
      [SESSION_URL]: respond(() => new Promise<Response>((resolve) => (release = resolve))),
      ...base(),
    });
    renderApp('/t/transaction');
    await new Promise((r) => setTimeout(r, 20));
    expect(calls.some((c) => c.includes('/topics/'))).toBe(false);
    release(okResponse(authed()));
    await screen.findByRole('heading', { level: 1, name: '트랜잭션' });
    expect(calls.filter((c) => c.includes('/topics/'))).toHaveLength(1);
  });

  it('로그아웃하면 학습 표시가 사라지고 사전은 그대로 보인다', async () => {
    await open({ [SESSION_URL]: authed(), ...base({ 'tx-01': true }), 'POST /interview/api/v1/bff/logout': okResponse(null) });
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    await waitFor(() => expect(screen.queryAllByRole('checkbox').filter((c) => c.closest('li'))).toHaveLength(0));
    expect(await screen.findByRole('heading', { level: 1, name: '트랜잭션' })).toBeTruthy();
    expect(screen.getByRole('link', { name: '로그인' })).toBeTruthy();
  });
});

describe('주제 화면: 접근성 구조', () => {
  it('로그인 상태(체크박스·막대·필터)와 확인창이 열린 상태에서 axe 위반이 없다', async () => {
    await open({ [SESSION_URL]: authed(), ...base({ 'tx-02': true }) });
    expect(await a11yViolations()).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: '모두 학습함으로 표시' }));
    expect(await a11yViolations()).toEqual([]);
  });

  it('비로그인 상태에서도 위반이 없다', async () => {
    await open({ [SESSION_URL]: anonymous(), ...base() });
    expect(await a11yViolations()).toEqual([]);
  });
});
