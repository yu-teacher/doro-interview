// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MineQuestion } from '../api/types';
import { hasDirtyDrafts } from '../drafts/draftRegistry';
import { a11yViolations } from '../testing/axe';
import { anonymous, authed, SESSION_URL } from '../testing/fixtures';
import { errorResponse, mockApi, okResponse, respond } from '../testing/mockFetch';
import { renderApp } from '../testing/renderApp';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const MINE = '/interview/api/v1/mine';
const ID1 = '11111111-1111-4111-8111-111111111111';
const ID2 = '22222222-2222-4222-8222-222222222222';

function mine(id: string, over: Partial<MineQuestion> = {}): MineQuestion {
  return {
    id, slug: `my-${id}`, title: '강사님이 짚은 질문', answerText: '내가 적은 답', keywords: ['프록시', 'AOP'], tier: 'DEEP', sourceLabel: '강사 추천',
    createdAt: '2026-10-20T00:00:00Z', updatedAt: '2026-10-20T00:00:00Z', learned: false, reviewCandidate: false, ...over,
  };
}

const open = (routes: Record<string, unknown> = {}, session: unknown = authed(), path = '/mine') => {
  const api = mockApi({ [SESSION_URL]: session, [MINE]: [mine(ID1)], ...routes });
  renderApp(path);
  return api;
};

const putsTo = (requests: { method: string; path: string }[], suffix: RegExp) => requests.filter((r) => r.method === 'PUT' && suffix.test(r.path));

describe('내 질문 목록', () => {
  it('비로그인이면 로그인 안내만 보이고 개인 API 를 부르지 않는다', async () => {
    const { calls } = open({}, anonymous());
    expect(await screen.findByText(/로그인한 뒤에 쓸 수 있습니다/)).toBeTruthy();
    expect(calls.some((c) => c.includes('/mine'))).toBe(false);
  });

  it('질문마다 제목·난이도·출처 표시·체크를 보이고 개수를 센다', async () => {
    open({ [MINE]: [mine(ID1, { learned: true }), mine(ID2, { title: '답 없는 질문', answerText: '', sourceLabel: null, tier: 'BASIC' })] });
    expect(await screen.findByText('2개 중 1개 학습함', { exact: false })).toBeTruthy();
    const first = screen.getByRole('link', { name: '강사님이 짚은 질문' });
    expect(first.getAttribute('href')).toBe(`/mine/${ID1}`);
    expect(screen.getByText('강사 추천')).toBeTruthy();
    expect(screen.getByText('답 없음')).toBeTruthy();
    expect((screen.getByRole('checkbox', { name: /강사님이 짚은 질문/ }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole('checkbox', { name: /답 없는 질문/ }) as HTMLInputElement).checked).toBe(false);
  });

  it('다시 공부 후보 배지는 체크했고 후보일 때만 붙는다', async () => {
    open({ [MINE]: [mine(ID1, { learned: true, reviewCandidate: true }), mine(ID2, { title: '체크 안 한 후보', learned: false, reviewCandidate: true })] });
    await screen.findByRole('link', { name: '체크 안 한 후보' });
    expect(screen.getAllByText('다시 공부 후보')).toHaveLength(1);
  });

  it('비어 있으면 안내한다', async () => {
    open({ [MINE]: [] });
    expect(await screen.findByText(/아직 추가한 질문이 없습니다/)).toBeTruthy();
  });

  it('체크하면 my- slug 로 진도 PUT 이 나간다(CSRF 헤더 포함)', async () => {
    const { requests } = open({ [`PUT /interview/api/v1/progress/my-${ID1}`]: okResponse({ slug: `my-${ID1}`, learned: true }) });
    fireEvent.click(await screen.findByRole('checkbox', { name: /강사님이 짚은 질문/ }));
    await waitFor(() => expect(putsTo(requests, /\/progress\/my-/)).toHaveLength(1));
    const sent = putsTo(requests, /\/progress\/my-/)[0] as unknown as { body: unknown; headers: Record<string, string> };
    expect(sent.body).toEqual({ learned: true });
    expect(sent.headers['X-Interview-Csrf']).toBe('1');
  });
});

describe('내 질문 추가', () => {
  async function openForm() {
    fireEvent.click(await screen.findByRole('button', { name: '질문 추가' }));
    return screen.getByRole('region', { name: '질문 추가' });
  }

  it('입력을 정리해 PUT 하고 목록을 다시 받는다', async () => {
    let list = [mine(ID1)];
    const { requests } = open({
      [MINE]: respond(() => okResponse(list)),
      'PUT /interview/api/v1/mine/new': okResponse({}),
    });
    const form = await openForm();
    fireEvent.change(within(form).getByLabelText('질문'), { target: { value: '  새 질문  ' } });
    fireEvent.change(within(form).getByLabelText(/내 답/), { target: { value: '답' } });
    fireEvent.change(within(form).getByLabelText(/키워드/), { target: { value: ' a, b ，a,, c ' } });
    fireEvent.change(within(form).getByLabelText('난이도'), { target: { value: 'TRICKY' } });
    fireEvent.change(within(form).getByLabelText(/출처 표시/), { target: { value: ' 강사 추천 ' } });
    list = [mine(ID1), mine(ID2, { title: '새 질문' })];
    // 새 UUID 를 쓰는 PUT 은 정확한 경로를 모르므로 모든 PUT /mine/<id> 를 받아 준다
    vi.stubGlobal('fetch', ((orig) => async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input), 'http://localhost');
      if ((init?.method ?? 'GET') === 'PUT' && /\/api\/v1\/mine\/[0-9a-f-]{36}$/.test(url.pathname)) {
        requests.push({ method: 'PUT', path: url.pathname, body: JSON.parse(String(init?.body)), headers: init?.headers as Record<string, string> });
        return okResponse(mine(ID2, { title: '새 질문' }));
      }
      return orig(input, init);
    })(globalThis.fetch));
    fireEvent.click(within(form).getByRole('button', { name: '추가' }));
    await waitFor(() => expect(putsTo(requests, /\/mine\/[0-9a-f-]{36}$/)).toHaveLength(1));
    const sent = putsTo(requests, /\/mine\/[0-9a-f-]{36}$/)[0] as unknown as { body: unknown };
    expect(sent.body).toEqual({ title: '새 질문', answerText: '답', keywords: ['a', 'b', 'c'], tier: 'TRICKY', sourceLabel: '강사 추천' });
    expect(await screen.findByText('새 질문')).toBeTruthy();
  });

  it('질문이 비어 있으면 PUT 하지 않고 알린다', async () => {
    const { requests } = open();
    const form = await openForm();
    fireEvent.click(within(form).getByRole('button', { name: '추가' }));
    expect((await screen.findByRole('alert')).textContent).toContain('질문을 입력');
    expect(putsTo(requests, /\/mine/)).toHaveLength(0);
  });

  it('입력 한도를 넘기면 PUT 하지 않는다(답 4000자·키워드 10개·제목 200자)', async () => {
    const { requests } = open();
    const form = await openForm();
    fireEvent.change(within(form).getByLabelText('질문'), { target: { value: '가'.repeat(201) } });
    fireEvent.click(within(form).getByRole('button', { name: '추가' }));
    expect((await screen.findByRole('alert')).textContent).toContain('200자');
    fireEvent.change(within(form).getByLabelText('질문'), { target: { value: '제목' } });
    fireEvent.change(within(form).getByLabelText(/키워드/), { target: { value: 'a,b,c,d,e,f,g,h,i,j,k' } });
    fireEvent.click(within(form).getByRole('button', { name: '추가' }));
    expect((await screen.findByRole('alert')).textContent).toContain('10개');
    fireEvent.change(within(form).getByLabelText(/키워드/), { target: { value: '' } });
    fireEvent.change(within(form).getByLabelText(/내 답/), { target: { value: '😀'.repeat(4001) } });
    expect(within(form).getByText(/4,001\/4,000자 — 너무 깁니다/)).toBeTruthy();
    expect((within(form).getByRole('button', { name: '추가' }) as HTMLButtonElement).disabled).toBe(true);
    expect(putsTo(requests, /\/mine/)).toHaveLength(0);
  });

  it('이모지는 코드포인트로 센다(4000개까지 허용)', async () => {
    open();
    const form = await openForm();
    fireEvent.change(within(form).getByLabelText(/내 답/), { target: { value: '😀'.repeat(4000) } });
    expect(within(form).getByText(/4,000\/4,000자$/)).toBeTruthy();
    expect((within(form).getByRole('button', { name: '추가' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('서버가 거절하면(상한 409) 문구를 보이고 입력은 남긴다', async () => {
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input), 'http://localhost');
      if ((init?.method ?? 'GET') === 'PUT') {
        return errorResponse(409, 'MINE-409-01', '내 질문은 300개까지 만들 수 있습니다.');
      }
      if (url.pathname.endsWith('/bff/session')) {
        return okResponse(authed());
      }
      return okResponse([mine(ID1)]);
    });
    renderApp('/mine');
    fireEvent.click(await screen.findByRole('button', { name: '질문 추가' }));
    const form = screen.getByRole('region', { name: '질문 추가' });
    fireEvent.change(within(form).getByLabelText('질문'), { target: { value: '넘칠 질문' } });
    fireEvent.click(within(form).getByRole('button', { name: '추가' }));
    expect((await screen.findByRole('alert')).textContent).toContain('300개');
    expect((within(form).getByLabelText('질문') as HTMLInputElement).value).toBe('넘칠 질문');
  });

  it('저장하지 않은 입력이 있으면 등록부에 알린다(업데이트 새로고침을 미룬다)', async () => {
    open();
    const form = await openForm();
    expect(hasDirtyDrafts()).toBe(false);
    fireEvent.change(within(form).getByLabelText('질문'), { target: { value: '쓰는 중' } });
    expect(hasDirtyDrafts()).toBe(true);
    cleanup();
    expect(hasDirtyDrafts()).toBe(false);
  });

  it('상한 300개에 닿으면 추가 버튼이 막히고 안내한다', async () => {
    const many = Array.from({ length: 300 }, (_, i) => mine(`00000000-0000-4000-8000-${String(i).padStart(12, '0')}`, { title: `질문 ${i}` }));
    open({ [MINE]: many });
    expect(await screen.findByText(/300개까지 만들 수 있습니다/)).toBeTruthy();
    expect((screen.getByRole('button', { name: '질문 추가' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: '여러 개 한 번에 추가' }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('내 질문 일괄 추가', () => {
  async function openBulk() {
    fireEvent.click(await screen.findByRole('button', { name: '여러 개 한 번에 추가' }));
    return screen.getByRole('region', { name: '여러 개 한 번에 추가' });
  }

  it('줄마다 하나씩 한 번의 PUT 으로 보내고 빈 줄은 건너뛴다', async () => {
    const { requests } = open({ [MINE]: [mine(ID1)], 'PUT /interview/api/v1/mine': okResponse([]) });
    const form = await openBulk();
    fireEvent.change(within(form).getByLabelText('질문 목록'), { target: { value: '첫째\n\n  둘째  \n셋째\n' } });
    fireEvent.change(within(form).getByLabelText(/난이도/), { target: { value: 'DEEP' } });
    fireEvent.change(within(form).getByLabelText(/출처 표시/), { target: { value: '강사 추천' } });
    expect(within(form).getByText(/^3개/)).toBeTruthy();
    fireEvent.click(within(form).getByRole('button', { name: '한 번에 추가' }));
    await waitFor(() => expect(putsTo(requests, /\/mine$/)).toHaveLength(1));
    const items = ((putsTo(requests, /\/mine$/)[0] as unknown as { body: { items: { id: string; title: string; tier: string; sourceLabel: string }[] } }).body.items);
    expect(items.map((i) => i.title)).toEqual(['첫째', '둘째', '셋째']);
    expect(new Set(items.map((i) => i.id)).size).toBe(3);
    expect(items.every((i) => i.tier === 'DEEP' && i.sourceLabel === '강사 추천')).toBe(true);
  });

  it('50개를 넘기면 보내지 않는다', async () => {
    const { requests } = open();
    const form = await openBulk();
    fireEvent.change(within(form).getByLabelText('질문 목록'), { target: { value: Array.from({ length: 51 }, (_, i) => `q${i}`).join('\n') } });
    fireEvent.click(within(form).getByRole('button', { name: '한 번에 추가' }));
    expect((await within(form).findByRole('status')).textContent).toContain('50개까지');
    expect(putsTo(requests, /\/mine$/)).toHaveLength(0);
  });

  it('비어 있거나 너무 긴 줄이 있으면 보내지 않는다', async () => {
    const { requests } = open();
    const form = await openBulk();
    fireEvent.click(within(form).getByRole('button', { name: '한 번에 추가' }));
    expect((await within(form).findByRole('status')).textContent).toContain('한 줄에 하나씩');
    fireEvent.change(within(form).getByLabelText('질문 목록'), { target: { value: `ok\n${'가'.repeat(201)}` } });
    fireEvent.click(within(form).getByRole('button', { name: '한 번에 추가' }));
    await waitFor(() => expect(within(form).getByRole('status').textContent).toContain('200자'));
    expect(putsTo(requests, /\/mine$/)).toHaveLength(0);
  });

  it('남은 자리보다 많으면 보내지 않는다', async () => {
    const many = Array.from({ length: 298 }, (_, i) => mine(`00000000-0000-4000-8000-${String(i).padStart(12, '0')}`, { title: `질문 ${i}` }));
    const { requests } = open({ [MINE]: many });
    const form = await openBulk();
    fireEvent.change(within(form).getByLabelText('질문 목록'), { target: { value: 'a\nb\nc' } });
    fireEvent.click(within(form).getByRole('button', { name: '한 번에 추가' }));
    expect((await within(form).findByRole('status')).textContent).toContain('2개만 더');
    expect(putsTo(requests, /\/mine$/)).toHaveLength(0);
  });
});

describe('내 질문 상세', () => {
  const detailUrl = `${MINE}/${ID1}`;

  it('제목·내 답·키워드를 일반 텍스트로 보여 준다(HTML 로 해석하지 않는다)', async () => {
    open({ [detailUrl]: mine(ID1, { answerText: '첫 줄 <b>굵게</b>\n둘째 줄', keywords: ['<i>x</i>'] }) }, authed(), `/mine/${ID1}`);
    expect(await screen.findByRole('heading', { level: 1, name: '강사님이 짚은 질문' })).toBeTruthy();
    const answer = screen.getByTestId('mine-answer');
    expect(answer.textContent).toBe('첫 줄 <b>굵게</b>\n둘째 줄');
    expect(answer.querySelector('b')).toBeNull();
    expect(screen.getByText('<i>x</i>')).toBeTruthy();
    expect(document.querySelector('main i')).toBeNull();
  });

  it('수정하면 통째로 PUT 하고 새 값을 보인다', async () => {
    let current = mine(ID1);
    const { requests } = open({
      [detailUrl]: respond(() => okResponse(current)),
      [`PUT ${detailUrl}`]: respond((_, r) => {
        const b = r.body as { title: string; answerText: string; keywords: string[]; tier: MineQuestion['tier']; sourceLabel: string | null };
        current = { ...current, ...b };
        return okResponse(current);
      }),
    }, authed(), `/mine/${ID1}`);
    fireEvent.click(await screen.findByRole('button', { name: '수정' }));
    const form = screen.getByRole('region', { name: '질문 수정' });
    expect((within(form).getByLabelText('질문') as HTMLInputElement).value).toBe('강사님이 짚은 질문');
    fireEvent.change(within(form).getByLabelText('질문'), { target: { value: '고친 제목' } });
    fireEvent.click(within(form).getByRole('button', { name: '저장' }));
    await waitFor(() => expect(putsTo(requests, /\/mine\/1111/)).toHaveLength(1));
    expect((putsTo(requests, /\/mine\/1111/)[0] as unknown as { body: unknown }).body).toEqual({
      title: '고친 제목', answerText: '내가 적은 답', keywords: ['프록시', 'AOP'], tier: 'DEEP', sourceLabel: '강사 추천',
    });
    expect(await screen.findByRole('heading', { level: 1, name: '고친 제목' })).toBeTruthy();
  });

  it('삭제는 확인창을 거치고(취소가 기본 포커스) PUT /deleted 뒤 목록으로 돌아간다', async () => {
    const { requests } = open({ [detailUrl]: mine(ID1), [`PUT ${detailUrl}/deleted`]: okResponse({ id: ID1, deleted: true }) }, authed(), `/mine/${ID1}`);
    fireEvent.click(await screen.findByRole('button', { name: '삭제' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain('되돌릴 수 없습니다');
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: '취소' }));
    fireEvent.click(within(dialog).getByRole('button', { name: '취소' }));
    expect(putsTo(requests, /deleted$/)).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '지우기' }));
    await waitFor(() => expect(putsTo(requests, /deleted$/)).toHaveLength(1));
    expect((putsTo(requests, /deleted$/)[0] as unknown as { body: unknown }).body).toEqual({ deleted: true });
    expect(await screen.findByRole('heading', { level: 1, name: '내 질문' })).toBeTruthy();
  });

  it('이미 지워졌으면(404) 오류 없이 목록으로 돌아간다', async () => {
    open({ [detailUrl]: mine(ID1), [`PUT ${detailUrl}/deleted`]: respond(() => errorResponse(404, 'COMMON-404-01', 'x')) }, authed(), `/mine/${ID1}`);
    fireEvent.click(await screen.findByRole('button', { name: '삭제' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '지우기' }));
    expect(await screen.findByRole('heading', { level: 1, name: '내 질문' })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('지우기가 실패하면(503) 상세에 남고 알린다', async () => {
    open({ [detailUrl]: mine(ID1), [`PUT ${detailUrl}/deleted`]: respond(() => errorResponse(503, 'AUTH-503-02', 'x')) }, authed(), `/mine/${ID1}`);
    fireEvent.click(await screen.findByRole('button', { name: '삭제' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '지우기' }));
    expect((await screen.findByRole('alert')).textContent).toContain('잠시');
    expect(screen.getByRole('heading', { level: 1, name: '강사님이 짚은 질문' })).toBeTruthy();
  });

  it('없는 질문이나 남의 질문(404)은 안내한다', async () => {
    open({}, authed(), '/mine/99999999-9999-4999-8999-999999999999');
    expect(await screen.findByText(/찾을 수 없는 질문입니다/)).toBeTruthy();
  });

  it('비로그인이면 로그인 안내를 보이고 질문을 요청하지 않는다', async () => {
    const { calls } = open({}, anonymous(), `/mine/${ID1}`);
    expect(await screen.findByText(/로그인한 뒤에 쓸 수 있습니다/)).toBeTruthy();
    expect(calls.some((c) => c.includes('/mine'))).toBe(false);
  });
});

describe('내 질문 접근성', () => {
  it('목록·폼·상세에 axe 위반이 없다', async () => {
    open({ [`${MINE}/${ID1}`]: mine(ID1) });
    fireEvent.click(await screen.findByRole('button', { name: '질문 추가' }));
    expect(await a11yViolations()).toEqual([]);
    cleanup();
    open({ [`${MINE}/${ID1}`]: mine(ID1) }, authed(), `/mine/${ID1}`);
    await screen.findByRole('heading', { level: 1, name: '강사님이 짚은 질문' });
    expect(await a11yViolations()).toEqual([]);
  });
});
