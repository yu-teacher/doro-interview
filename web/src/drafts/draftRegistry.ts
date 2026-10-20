/**
 * 저장하지 않은 입력(노트 초안)이 있는지 알리는 작은 등록부. 서비스 워커 업데이트가 "지금 새로 고쳐도 되는가" 를 판단할 때
 * 쓴다(docs/M2-PLAN.md §6): 작성 중인 노트가 있으면 새로 고침을 미룬다.
 */
const dirty = new Set<string>();
const listeners = new Set<() => void>();

export function setDraftDirty(id: string, isDirty: boolean): void {
  const had = dirty.has(id);
  if (isDirty) {
    dirty.add(id);
  } else {
    dirty.delete(id);
  }
  if (had !== isDirty) {
    listeners.forEach((l) => l());
  }
}

export function hasDirtyDrafts(): boolean {
  return dirty.size > 0;
}

export function subscribeDrafts(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
