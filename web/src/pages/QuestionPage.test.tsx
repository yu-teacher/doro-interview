// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import type { QuestionDetail } from '../api/types';
import { a11yViolations } from '../testing/axe';
import { detail } from '../testing/fixtures';
import { mockApi } from '../testing/mockFetch';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** 마크다운 렌더러는 지연 로딩이라, 서식(배지·코드 블록)이 입혀질 때까지 기다린다. */
async function rendered(selector: string) {
  await waitFor(() => expect(document.querySelector(selector)).not.toBeNull());
}

async function open(q: QuestionDetail = detail()) {
  mockApi({ [`/interview/api/v1/questions/${q.slug}`]: q });
  render(
    <MemoryRouter initialEntries={[`/q/${q.slug}`]}>
      <AppRoutes />
    </MemoryRouter>,
  );
  // 제목의 `백틱` 은 코드 서식으로 그려져 글자로는 남지 않는다
  return screen.findByRole('heading', { level: 1, name: q.title.replaceAll('`', '') });
}

describe('질문 화면', () => {
  it('제목·경로·난이도·얼마나 자주 나오는지·공식 문서 밖 설명 표시를 보여 준다', async () => {
    await open();
    const nav = screen.getByRole('navigation', { name: '경로' });
    expect(within(nav).getByRole('link', { name: '처음' }).getAttribute('href')).toBe('/');
    expect(within(nav).getByRole('link', { name: '트랜잭션' }).getAttribute('href')).toBe('/t/transaction');
    const main = screen.getByRole('main');
    expect(main.querySelector('[data-tier="BASIC"]')?.textContent).toBe('기본');
    expect(main.querySelector('[data-importance="3"]')?.textContent).toBe('꼭 나와요');
    expect(within(main).getByText('공식 문서 밖 설명')).toBeTruthy();
  });

  it('키워드는 목록으로, 개념은 개념 화면으로 가는 링크로 보인다', async () => {
    await open();
    const keywords = screen.getByRole('list', { name: '핵심 키워드' });
    expect(within(keywords).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['AOP 프록시', 'ThreadLocal']);
    const concepts = screen.getByRole('list', { name: '개념' });
    const links = within(concepts).getAllByRole('link');
    expect(links.map((a) => a.textContent?.replace('›', ''))).toEqual(['프록시', '트랜잭션 경계']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/c/proxy', '/c/tx-boundary']);
  });

  it('"꼭 나와요" 배지를 누르면 같은 주제의 꼭 나오는 질문만 모아 본다(자주 나와요는 2~3)', async () => {
    await open();
    const link = screen.getByRole('link', { name: /꼭 나와요: 이 주제에서/ });
    expect(link.getAttribute('href')).toBe('/t/transaction?imp=3');
    cleanup();
    await open(detail({ importance: 2 }));
    expect(screen.getByRole('link', { name: /자주 나와요: 이 주제에서/ }).getAttribute('href')).toBe('/t/transaction?imp=ge2');
    cleanup();
    await open(detail({ importance: 1 }));
    expect(screen.queryByRole('link', { name: /이 주제에서 같은 정도/ })).toBeNull();
  });

  it('모범 답변이 먼저 보인다', async () => {
    await open();
    const section = screen.getByRole('region', { name: '모범 답변' });
    expect(section.textContent).toContain('프록시가 메서드 호출 앞뒤로 트랜잭션을 엽니다.');
  });

  it('렌더러가 오기 전에도 모범 답변 글이 먼저 읽힌다(지연 로딩 대체 표시)', async () => {
    await open();
    expect(screen.getByRole('region', { name: '모범 답변' }).textContent).toContain('프록시가 메서드 호출 앞뒤로 트랜잭션을 엽니다.');
  });

  it('근거·코드는 접혀 있다가 열면 배지와 코드 블록이 보인다', async () => {
    await open();
    const details = screen.getByText('근거 · 코드 · 실험 설명 보기').closest('details') as HTMLDetailsElement;
    expect(details.open).toBe(false);
    await rendered('details [data-badge]');
    expect(Array.from(details.querySelectorAll('[data-badge]')).map((b) => b.getAttribute('data-badge'))).toEqual(['official', 'extra']);
    expect(details.querySelector('pre code')?.textContent).toContain('class A {}');
    fireEvent.click(screen.getByText('근거 · 코드 · 실험 설명 보기'));
  });

  it('상세가 없으면 펼침 영역을 만들지 않는다', async () => {
    await open(detail({ detailMd: '', hasExtra: false }));
    expect(screen.queryByText('근거 · 코드 · 실험 설명 보기')).toBeNull();
    expect(screen.queryByText('공식 문서 밖 설명')).toBeNull();
  });

  it('초안이면 검수 전 안내를, 검수 뒤에 바뀌었으면 재확인 안내를 보여 준다', async () => {
    await open(detail({ status: 'DRAFT', reviewedAt: null }));
    expect(screen.getByRole('note').textContent).toContain('검수 전 초안입니다');
    expect(screen.getByText('검수 전 · 기준 버전: Spring Framework 7 / Boot 4')).toBeTruthy();
    cleanup();
    await open(detail({ needsReview: true }));
    expect(screen.getByRole('note').textContent).toContain('다시 확인하는 중');
  });

  it('검수 완료는 날짜와 기준 버전을 보여 준다', async () => {
    await open();
    expect(screen.getByText('검수 완료 (2026-10-20) · 기준 버전: Spring Framework 7 / Boot 4')).toBeTruthy();
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('질문 근거 문서와 주제 출처를 외부 링크로 보여 준다', async () => {
    await open();
    const own = screen.getByRole('region', { name: '이 질문의 근거 문서' });
    const a = within(own).getByRole('link', { name: 'https://docs.spring.io/a' });
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
    const topic = screen.getByText(/이 주제 전체의 출처 \(1\)/).closest('details') as HTMLDetailsElement;
    expect(topic.open).toBe(false);
    expect(topic.textContent).toContain('앞부분만 읽음');
  });

  it('책 근거(refs)는 쪽수까지 일반 텍스트로 보여 주고 링크로 만들지 않는다', async () => {
    await open(detail({ refs: ['Design Patterns, 1장, p.293 <b>x</b>', 'Clean Architecture, 5장, p.45'] }));
    const region = screen.getByRole('region', { name: '이 질문의 책 근거' });
    const items = within(region).getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toEqual(['Design Patterns, 1장, p.293 <b>x</b>', 'Clean Architecture, 5장, p.45']);
    expect(region.querySelector('b')).toBeNull();
    expect(within(region).queryByRole('link')).toBeNull();
  });

  it('책 근거가 없으면 그 구역을 그리지 않는다', async () => {
    await open(detail({ refs: [] }));
    expect(screen.queryByRole('region', { name: '이 질문의 책 근거' })).toBeNull();
  });

  it('먼저 볼 질문 · 이어 볼 질문 · 관련 질문을 이 순서로 링크한다', async () => {
    await open();
    const main = screen.getByRole('main');
    const headings = within(main).getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings.indexOf('먼저 볼 질문')).toBeLessThan(headings.indexOf('이어 볼 질문'));
    expect(headings.indexOf('이어 볼 질문')).toBeLessThan(headings.indexOf('관련 질문'));
    expect(within(screen.getByRole('region', { name: '먼저 볼 질문' })).getByRole('link', { name: /AOP 란\?/ }).getAttribute('href')).toBe('/q/aop-01');
    expect(within(screen.getByRole('region', { name: '이어 볼 질문' })).getByRole('link', { name: /같은 클래스 안 호출은\?/ }).getAttribute('href')).toBe('/q/tx-15');
    expect(within(screen.getByRole('region', { name: '관련 질문' })).getByRole('link', { name: /영속성 컨텍스트/ }).getAttribute('href')).toBe('/q/jpa-03');
  });

  it('연결이 없으면 해당 구역을 그리지 않는다', async () => {
    await open(detail({ prerequisites: [], followups: [], related: [], concepts: [], keywords: [], sources: [], refs: [], topicSources: [] }));
    for (const name of ['먼저 볼 질문', '이어 볼 질문', '관련 질문', '이 질문의 근거 문서', '이 질문의 책 근거']) {
      expect(screen.queryByRole('region', { name })).toBeNull();
    }
    expect(screen.queryByRole('list', { name: '개념' })).toBeNull();
    expect(screen.queryByRole('list', { name: '핵심 키워드' })).toBeNull();
  });

  it('아래 동작 바에 이전·다음 질문이 있고, 첫 질문에는 이전이 없다', async () => {
    await open();
    const bar = within(screen.getByRole('region', { name: '이 질문의 동작' }));
    expect(bar.getByRole('link', { name: '이전 질문' }).getAttribute('href')).toBe('/q/tx-03');
    expect(bar.getByRole('link', { name: '다음 질문 →' }).getAttribute('href')).toBe('/q/tx-05');
    cleanup();
    await open(detail({ prevSlug: null }));
    const bar2 = within(screen.getByRole('region', { name: '이 질문의 동작' }));
    expect(bar2.queryByRole('link', { name: '이전 질문' })).toBeNull();
    expect(bar2.getByRole('link', { name: '다음 질문 →' })).toBeTruthy();
  });

  it('마지막 질문에는 다음 대신 주제로 돌아가는 링크가 있다', async () => {
    await open(detail({ prevSlug: null, nextSlug: null }));
    const bar = within(screen.getByRole('region', { name: '이 질문의 동작' }));
    expect(bar.queryByRole('link', { name: /다음 질문/ })).toBeNull();
    expect(bar.getByRole('link', { name: '주제로' }).getAttribute('href')).toBe('/t/transaction');
  });

  it('핵심 키워드와 관련 개념은 모범 답변 아래에 있고, 눌리는 것(개념)과 정보(키워드)의 모양이 다르다', async () => {
    await open();
    const headings = within(screen.getByRole('main')).getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings.indexOf('모범 답변')).toBeLessThan(headings.indexOf('핵심 키워드'));
    expect(headings.indexOf('핵심 키워드')).toBeLessThan(headings.indexOf('관련 개념'));
    const keyword = within(screen.getByRole('list', { name: '핵심 키워드' })).getAllByRole('listitem')[0].firstElementChild as HTMLElement;
    expect(keyword.tagName).toBe('SPAN'); // 키워드는 링크가 아니다
    expect(within(screen.getByRole('list', { name: '개념' })).getAllByRole('link')).toHaveLength(2);
  });

  it('제목의 `백틱` 은 코드 서식이고 글자로는 남지 않는다', async () => {
    await open(detail({ title: '`@Transactional` 은 어떻게 동작하나요?' }));
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.querySelector('code')?.textContent).toBe('@Transactional');
    expect(h1.textContent).toBe('@Transactional 은 어떻게 동작하나요?');
  });

  it('원시 HTML 이 들어 있는 답변도 글자로만 보인다', async () => {
    await open(detail({ spokenAnswer: '<script>alert(1)</script> Optional<T> 는 글자다', detailMd: '' }));
    const section = screen.getByRole('region', { name: '모범 답변' });
    // 줄 전체가 HTML 블록이면 렌더러는 <p> 없이 글자(이스케이프)로 낸다: 지연 로딩된 렌더러로 바뀐 뒤를 확인한다
    await waitFor(() => expect(section.querySelector('p')).toBeNull());
    expect(section.textContent).toContain('<script>alert(1)</script>');
    expect(section.querySelector('script')).toBeNull();
    expect(section.textContent).toContain('Optional<T>');
  });

  it('문서 제목이 질문 제목이다', async () => {
    await open();
    await waitFor(() => expect(document.title).toBe('@Transactional 은 어떻게 동작하나요? · 도로 면접'));
  });

  it('접근성 구조 위반이 없다(상세를 펼친 상태 포함)', async () => {
    await open();
    await rendered('details [data-badge]');
    expect(await a11yViolations()).toEqual([]);
    (document.querySelector('details') as HTMLDetailsElement).open = true;
    expect(await a11yViolations()).toEqual([]);
  });
});
