// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasDirtyDrafts } from '../drafts/draftRegistry';
import { a11yViolations } from '../testing/axe';
import { anonymous, authed, detail, SESSION_URL } from '../testing/fixtures';
import { errorResponse, mockApi, okResponse, respond } from '../testing/mockFetch';
import { renderApp } from '../testing/renderApp';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const Q = '/interview/api/v1/questions/tx-04';
const NOTE = '/interview/api/v1/notes/tx-04';
const noteRoutes = (body: string | null = null) => ({
  [NOTE]: { slug: 'tx-04', body, updatedAt: body ? '2026-10-20T00:00:00Z' : null },
  'PUT /interview/api/v1/notes/tx-04': respond((_url, req) => {
    const text = (req.body as { body: string }).body;
    return okResponse({ slug: 'tx-04', body: text.trim() === '' ? null : text, updatedAt: '2026-10-20T01:00:00Z' });
  }),
});

async function open(routes: Record<string, unknown>) {
  const api = mockApi({ '/interview/api/v1/concepts': [], ...routes });
  renderApp('/q/tx-04');
  await screen.findByRole('heading', { level: 1, name: '@Transactional 은 어떻게 동작하나요?' });
  return api;
}

const noteBox = () => screen.getByRole('textbox', { name: '이 질문에 대한 내 노트' }) as HTMLTextAreaElement;

describe('질문 화면: 학습 체크', () => {
  it('로그인하면 "완전히 학습함" 체크박스가 서버 상태로 나타난다', async () => {
    await open({ [SESSION_URL]: authed(), [Q]: detail({ learned: true }), ...noteRoutes() });
    const box = screen.getByRole('checkbox', { name: /^완전히 학습함/ }) as HTMLInputElement;
    expect(box.checked).toBe(true);
    expect(screen.getByRole('checkbox', { name: '완전히 학습함: @Transactional 은 어떻게 동작하나요?' })).toBeTruthy();
  });

  it('누르면 바로 바뀌고 PUT 이 나가며, 실패하면 되돌린다', async () => {
    const { requests } = await open({
      [SESSION_URL]: authed(), [Q]: detail({ learned: false }), ...noteRoutes(),
      'PUT /interview/api/v1/progress/tx-04': respond(() => errorResponse(500, 'SYS-500-01', '서버 내부 오류가 발생했습니다.')),
    });
    const box = screen.getByRole('checkbox', { name: /^완전히 학습함/ }) as HTMLInputElement;
    fireEvent.click(box);
    expect(box.checked).toBe(true);
    expect(await screen.findByText('서버 내부 오류가 발생했습니다.')).toBeTruthy();
    expect(box.checked).toBe(false);
    const put = requests.find((r) => r.method === 'PUT' && r.path.includes('/progress/'));
    expect(put?.body).toEqual({ learned: true });
    expect(put?.headers['X-Interview-Csrf']).toBe('1');
  });

  it('비로그인에는 체크박스 대신 로그인 링크가 있고 노트도 없다', async () => {
    const { calls } = await open({ [SESSION_URL]: anonymous(), [Q]: detail() });
    expect(screen.queryByRole('checkbox', { name: /학습함/ })).toBeNull();
    expect(screen.getByRole('link', { name: '로그인하고 학습 체크하기' }).getAttribute('href')).toBe('/interview/api/v1/bff/login?return=%2Fq%2Ftx-04');
    expect(screen.queryByRole('heading', { name: /내 노트/ })).toBeNull();
    expect(calls.some((c) => c.includes('/notes/'))).toBe(false);
  });

  it('로그인 상태에서 위반이 없다(체크박스·노트)', async () => {
    await open({ [SESSION_URL]: authed(), [Q]: detail({ learned: false }), ...noteRoutes('메모') });
    await screen.findByRole('textbox', { name: '이 질문에 대한 내 노트' });
    expect(await a11yViolations()).toEqual([]);
  });
});

describe('질문 화면: 내 노트', () => {
  it('기존 노트를 불러와 보여 준다', async () => {
    await open({ [SESSION_URL]: authed(), [Q]: detail(), ...noteRoutes('내가 쓴 메모') });
    await screen.findByDisplayValue('내가 쓴 메모');
    expect(screen.getByText('7/2,000자')).toBeTruthy();
  });

  it('고치면 저장 버튼이 켜지고 저장하면 알려 준다', async () => {
    const { requests } = await open({ [SESSION_URL]: authed(), [Q]: detail(), ...noteRoutes('처음') });
    await screen.findByDisplayValue('처음');
    const save = screen.getByRole('button', { name: '저장' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.change(noteBox(), { target: { value: '처음 + 추가' } });
    expect(save.disabled).toBe(false);
    expect(screen.getByText('저장하지 않은 변경이 있습니다.').closest('[role="status"]')).toBeTruthy();
    fireEvent.click(save);
    expect((await screen.findByText('저장했습니다.')).closest('[role="status"]')).toBeTruthy();
    expect(requests.find((r) => r.method === 'PUT' && r.path.endsWith('/notes/tx-04'))?.body).toEqual({ body: '처음 + 추가' });
    expect(save.disabled).toBe(true);
  });

  it('저장하지 않은 글이 있는 동안 초안 등록부가 켜지고, 저장하면 꺼진다', async () => {
    await open({ [SESSION_URL]: authed(), [Q]: detail(), ...noteRoutes('') });
    await screen.findByRole('textbox', { name: '이 질문에 대한 내 노트' });
    expect(hasDirtyDrafts()).toBe(false);
    fireEvent.change(noteBox(), { target: { value: '쓰는 중' } });
    expect(hasDirtyDrafts()).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await screen.findByText('저장했습니다.');
    expect(hasDirtyDrafts()).toBe(false);
  });

  it('쓰다가 화면을 떠나도(언마운트) 등록부가 비워진다', async () => {
    await open({ [SESSION_URL]: authed(), [Q]: detail(), ...noteRoutes('') });
    await screen.findByRole('textbox', { name: '이 질문에 대한 내 노트' });
    fireEvent.change(noteBox(), { target: { value: '쓰는 중' } });
    expect(hasDirtyDrafts()).toBe(true);
    cleanup();
    expect(hasDirtyDrafts()).toBe(false);
  });

  it('저장하지 않은 글이 있으면 탭을 닫을 때 경고한다', async () => {
    await open({ [SESSION_URL]: authed(), [Q]: detail(), ...noteRoutes('') });
    await screen.findByRole('textbox', { name: '이 질문에 대한 내 노트' });
    const clean = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).toBe(false);
    fireEvent.change(noteBox(), { target: { value: '쓰는 중' } });
    const dirty = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(dirty);
    expect(dirty.defaultPrevented).toBe(true);
  });

  it('2,000자를 넘으면 저장할 수 없고 이유를 알린다 — 이모지는 한 글자로 센다', async () => {
    const { requests } = await open({ [SESSION_URL]: authed(), [Q]: detail(), ...noteRoutes('') });
    await screen.findByRole('textbox', { name: '이 질문에 대한 내 노트' });
    const save = screen.getByRole('button', { name: '저장' }) as HTMLButtonElement;

    fireEvent.change(noteBox(), { target: { value: '😀'.repeat(2000) } });
    expect(screen.getByText('2,000/2,000자')).toBeTruthy();
    expect(save.disabled).toBe(false);

    fireEvent.change(noteBox(), { target: { value: '😀'.repeat(2001) } });
    expect(screen.getByText('2,001/2,000자 — 너무 깁니다')).toBeTruthy();
    expect(save.disabled).toBe(true);
    fireEvent.submit(save.closest('form') as HTMLFormElement); // 버튼을 우회해도 보내지 않는다
    expect(requests.filter((r) => r.method === 'PUT')).toHaveLength(0);
  });

  it('공백만 저장하면 서버가 노트를 지우고 화면도 빈 상태가 된다', async () => {
    await open({ [SESSION_URL]: authed(), [Q]: detail(), ...noteRoutes('지울 메모') });
    await screen.findByDisplayValue('지울 메모');
    fireEvent.change(noteBox(), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await screen.findByText('저장했습니다.');
    expect(noteBox().value).toBe('');
  });

  it('HTML 은 글자 그대로 입력 상자에 있고 DOM 요소가 되지 않는다', async () => {
    await open({ [SESSION_URL]: authed(), [Q]: detail(), ...noteRoutes('<img src=x onerror=alert(1)><script>alert(2)</script>') });
    await screen.findByDisplayValue('<img src=x onerror=alert(1)><script>alert(2)</script>');
    expect(document.querySelector('main img, main script')).toBeNull();
  });

  it('저장 실패는 안내하고 글을 지우지 않는다', async () => {
    await open({
      [SESSION_URL]: authed(), [Q]: detail(), ...noteRoutes(''),
      'PUT /interview/api/v1/notes/tx-04': respond(() => errorResponse(400, 'COMMON-400-01', '노트에 쓸 수 없는 문자가 있습니다.')),
    });
    await screen.findByRole('textbox', { name: '이 질문에 대한 내 노트' });
    fireEvent.change(noteBox(), { target: { value: '내용' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByText('노트에 쓸 수 없는 문자가 있습니다.')).toBeTruthy();
    expect(noteBox().value).toBe('내용');
  });

  it('저장 중 401 이면 비로그인으로 바뀐다', async () => {
    await open({
      [SESSION_URL]: authed(), [Q]: detail(), ...noteRoutes(''),
      'PUT /interview/api/v1/notes/tx-04': respond(() => errorResponse(401, 'AUTH-401-01', 'x')),
    });
    await screen.findByRole('textbox', { name: '이 질문에 대한 내 노트' });
    fireEvent.change(noteBox(), { target: { value: '내용' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => expect(screen.queryByRole('textbox', { name: '이 질문에 대한 내 노트' })).toBeNull());
    expect(screen.getByRole('link', { name: '로그인하고 학습 체크하기' })).toBeTruthy();
  });

  it('노트를 불러오지 못해도 질문은 읽을 수 있고 다시 시도할 수 있다', async () => {
    let n = 0;
    await open({
      [SESSION_URL]: authed(), [Q]: detail(),
      [NOTE]: respond(() => (n++ === 0 ? errorResponse(503, 'UPSTREAM', '서버가 응답하지 않습니다.') : okResponse({ slug: 'tx-04', body: '복구', updatedAt: null }))),
    });
    expect(await screen.findByText('서버가 응답하지 않습니다.')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByDisplayValue('복구')).toBeTruthy();
  });
});
