import { expect, test } from '@playwright/test';

/**
 * 운영 설정(prod 프로파일, 비공개 주제 노출 꺼짐)으로 뜬 서비스: **검수 전이라 공개된 것이 없다.**
 * 이때 사용자에게 오류가 아니라 안내가 보이고, 숨은 것은 없는 것과 똑같이 404 인지 실제 브라우저로 확인한다.
 * 배포 리허설(scripts/rehearse-deploy.sh)의 1단계에서 E2E_PHASE=empty 로 돌린다.
 */
test.skip(process.env.E2E_PHASE !== 'empty', 'E2E_PHASE=empty 에서만 돌린다');

test('홈은 오류가 아니라 "검수 중" 안내를 보여 준다', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/interview/');
  await expect(page.getByRole('heading', { level: 1, name: '검수 중인 주제입니다' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('API 는 빈 목록을 주고 비공개 주제·질문·개념은 없는 것과 똑같은 404 다', async ({ request }) => {
  const categories = await request.get('/interview/api/v1/categories');
  expect(categories.status()).toBe(200);
  expect(((await categories.json()) as { data: unknown[] }).data).toEqual([]);

  const strip = (body: string) => body.replace(/"timestamp":"[^"]*"/, '');
  const missing = await request.get('/interview/api/v1/questions/no-such-question');
  const expected = strip(await missing.text());
  expect(missing.status()).toBe(404);
  for (const path of ['topics/transaction', 'questions/tx-01', 'concepts/proxy', 'topics/no-such-topic']) {
    const res = await request.get(`/interview/api/v1/${path}`);
    expect(res.status(), path).toBe(404);
    expect(strip(await res.text()), path).toBe(expected);
  }
  const search = await request.get('/interview/api/v1/search?q=' + encodeURIComponent('트랜잭션'));
  expect(((await search.json()) as { data: { total: number } }).data.total).toBe(0);
});

test('직접 연 주제·질문 주소는 찾을 수 없음 화면이다(내용이 새지 않는다)', async ({ page }) => {
  await page.goto('/interview/t/transaction');
  await expect(page.getByRole('heading', { level: 1, name: '찾을 수 없는 주제입니다.' })).toBeVisible();
  await page.goto('/interview/q/tx-01');
  await expect(page.getByRole('heading', { level: 1, name: '찾을 수 없는 질문입니다.' })).toBeVisible();
});
