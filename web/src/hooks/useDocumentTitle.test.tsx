// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useDocumentTitle } from './useDocumentTitle';

afterEach(cleanup);

describe('useDocumentTitle', () => {
  it('화면 이름과 서비스 이름을 함께 쓴다', () => {
    renderHook(() => useDocumentTitle('트랜잭션'));
    expect(document.title).toBe('트랜잭션 · 도로 면접');
  });

  it('제목이 없으면 서비스 이름만 쓴다', () => {
    renderHook(() => useDocumentTitle(null));
    expect(document.title).toBe('도로 면접');
  });

  it('제목이 바뀌면 갱신한다', () => {
    const { rerender } = renderHook(({ t }) => useDocumentTitle(t), { initialProps: { t: 'A' as string | null } });
    expect(document.title).toBe('A · 도로 면접');
    rerender({ t: 'B' });
    expect(document.title).toBe('B · 도로 면접');
  });
});
