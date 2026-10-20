import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerServiceWorker } from './register';

afterEach(() => vi.unstubAllGlobals());

describe('registerServiceWorker', () => {
  it('개발·시험 환경(PROD 아님)에서는 아무것도 하지 않는다', async () => {
    const register = vi.fn();
    vi.stubGlobal('navigator', { serviceWorker: { register } });
    await registerServiceWorker();
    expect(register).not.toHaveBeenCalled();
  });
});
