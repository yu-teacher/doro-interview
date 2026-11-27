import { describe, expect, it } from 'vitest';
import { notificationTarget } from './notificationTarget';

const SCOPE = 'https://example.test/dev/interview/';

describe('notificationTarget', () => {
  it('앱 범위 안의 주소는 그대로 연다(상대·절대 경로 모두)', () => {
    expect(notificationTarget('/dev/interview/stats', SCOPE)).toBe('https://example.test/dev/interview/stats');
    expect(notificationTarget('stats', SCOPE)).toBe('https://example.test/dev/interview/stats');
  });

  it('비었거나, 다른 앱·다른 출처·잘못된 주소면 앱 첫 화면으로 보낸다', () => {
    for (const raw of ['', '/party/', 'https://evil.test/dev/interview/stats', '//evil.test/dev/interview/', 'http://[bad']) {
      expect(notificationTarget(raw, SCOPE)).toBe(SCOPE);
    }
  });

  it('범위 이름으로 시작하기만 하는 옆 경로는 범위 밖이다', () => {
    expect(notificationTarget('/dev/interview-evil/stats', SCOPE)).toBe(SCOPE);
  });
});
