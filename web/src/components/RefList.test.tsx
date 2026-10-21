// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { RefList } from './RefList';

describe('RefList', () => {
  it('제목의 `백틱` 은 글자 그대로가 아니라 코드 서식으로 그린다', () => {
    render(
      <MemoryRouter>
        <RefList title="이어 볼 질문" items={[{ slug: 'tx-06', title: '새 스레드(`@Async`)에서 DB 작업을 하면?', tier: 'TRICKY' }] as never} />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link');
    expect(link.querySelector('code')?.textContent).toBe('@Async');
    expect(link.textContent).not.toContain('`');
  });
});
