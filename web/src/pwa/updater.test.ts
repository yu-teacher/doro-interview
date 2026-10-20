import { afterEach, describe, expect, it, vi } from 'vitest';
import { setDraftDirty } from '../drafts/draftRegistry';
import { isSafeMoment, startUpdater, UPDATE_CHECK_INTERVAL_MS, type UpdaterDeps } from './updater';

afterEach(() => setDraftDirty('note:test', false));

describe('isSafeMoment', () => {
  const base = { returnedFromHidden: true, hasDirtyDraft: false, modalOpen: false };
  it('숨었다 돌아왔고 초안·확인창이 없을 때만 안전하다', () => {
    expect(isSafeMoment(base)).toBe(true);
    expect(isSafeMoment({ ...base, returnedFromHidden: false })).toBe(false);
    expect(isSafeMoment({ ...base, hasDirtyDraft: true })).toBe(false);
    expect(isSafeMoment({ ...base, modalOpen: true })).toBe(false);
  });
});

function harness(over: Partial<UpdaterDeps> = {}) {
  let hidden = false;
  let modal = false;
  let dirty = false;
  const listeners = new Set<() => void>();
  const intervals: { cb: () => void; ms: number; cleared: boolean }[] = [];
  const deps = {
    checkForUpdate: vi.fn(() => Promise.resolve()),
    applyUpdate: vi.fn(),
    isHidden: () => hidden,
    modalOpen: () => modal,
    hasDirtyDraft: () => dirty,
    addVisibilityListener: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    setInterval: (cb: () => void, ms: number) => {
      const entry = { cb, ms, cleared: false };
      intervals.push(entry);
      return () => {
        entry.cleared = true;
      };
    },
    ...over,
  } satisfies UpdaterDeps;
  const fire = () => listeners.forEach((l) => l());
  return {
    deps,
    intervals,
    listenerCount: () => listeners.size,
    hide: () => { hidden = true; fire(); },
    show: () => { hidden = false; fire(); },
    setModal: (v: boolean) => { modal = v; },
    setDirty: (v: boolean) => { dirty = v; },
  };
}

describe('startUpdater', () => {
  it('15분마다 새 버전을 확인한다', () => {
    const h = harness();
    startUpdater(h.deps);
    expect(h.intervals).toHaveLength(1);
    expect(h.intervals[0].ms).toBe(UPDATE_CHECK_INTERVAL_MS);
    h.intervals[0].cb();
    expect(h.deps.checkForUpdate).toHaveBeenCalledTimes(1);
  });

  it('탭으로 돌아올 때마다 확인한다(대기 중인 버전이 없어도)', () => {
    const h = harness();
    startUpdater(h.deps);
    h.hide();
    expect(h.deps.checkForUpdate).not.toHaveBeenCalled(); // 숨을 때는 확인하지 않는다
    h.show();
    expect(h.deps.checkForUpdate).toHaveBeenCalledTimes(1);
    expect(h.deps.applyUpdate).not.toHaveBeenCalled();
  });

  it('대기 중인 새 버전은 숨었다 돌아온 안전한 순간에 적용한다', () => {
    const h = harness();
    const u = startUpdater(h.deps);
    u.markWaiting();
    expect(h.deps.applyUpdate).not.toHaveBeenCalled(); // 알게 된 즉시 적용하지 않는다(보던 화면이 갑자기 바뀌지 않는다)
    h.hide();
    h.show();
    expect(h.deps.applyUpdate).toHaveBeenCalledTimes(1);
  });

  it('작성 중인 노트(초안)가 있으면 미루고, 저장한 뒤 다음에 돌아올 때 적용한다', () => {
    const h = harness();
    const u = startUpdater(h.deps);
    u.markWaiting();
    h.setDirty(true);
    h.hide(); h.show();
    expect(h.deps.applyUpdate).not.toHaveBeenCalled();
    h.setDirty(false);
    h.hide(); h.show();
    expect(h.deps.applyUpdate).toHaveBeenCalledTimes(1);
  });

  it('기본 초안 판정은 초안 등록부를 따른다', () => {
    const h = harness({ hasDirtyDraft: undefined });
    const u = startUpdater(h.deps);
    u.markWaiting();
    setDraftDirty('note:test', true);
    h.hide(); h.show();
    expect(h.deps.applyUpdate).not.toHaveBeenCalled();
    setDraftDirty('note:test', false);
    h.hide(); h.show();
    expect(h.deps.applyUpdate).toHaveBeenCalledTimes(1);
  });

  it('확인창이 열려 있으면 미룬다', () => {
    const h = harness();
    const u = startUpdater(h.deps);
    u.markWaiting();
    h.setModal(true);
    h.hide(); h.show();
    expect(h.deps.applyUpdate).not.toHaveBeenCalled();
  });

  it('숨은 적 없이 다시 보이는 이벤트만으로는 적용하지 않는다', () => {
    const h = harness();
    const u = startUpdater(h.deps);
    u.markWaiting();
    h.show();
    expect(h.deps.applyUpdate).not.toHaveBeenCalled();
  });

  it('확인이 실패해도 앱을 막지 않고 오류를 남긴다', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const h = harness({ checkForUpdate: vi.fn(() => Promise.reject(new Error('offline'))) });
    startUpdater(h.deps);
    h.hide(); h.show();
    await Promise.resolve(); await Promise.resolve();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('stop 하면 리스너와 주기를 거둔다', () => {
    const h = harness();
    const u = startUpdater(h.deps);
    u.stop();
    expect(h.listenerCount()).toBe(0);
    expect(h.intervals[0].cleared).toBe(true);
  });
});
