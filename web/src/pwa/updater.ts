import { hasDirtyDrafts } from '../drafts/draftRegistry';

/** 새 서비스 워커가 있는지 확인하는 주기. 탭으로 돌아올 때도 확인한다. */
export const UPDATE_CHECK_INTERVAL_MS = 15 * 60 * 1000;

export interface SafeMomentInput {
  /** 화면이 숨었다가 방금 돌아왔는가(사용자가 보던 흐름이 한 번 끊긴 순간) */
  returnedFromHidden: boolean;
  /** 저장하지 않은 입력(노트 초안)이 있는가 */
  hasDirtyDraft: boolean;
  /** 확인창(모달)이 열려 있는가 */
  modalOpen: boolean;
}

/**
 * 대기 중인 새 버전을 지금 적용해도 되는가(적용 = 새로고침). 화면이 숨었다 돌아온 순간이고, 작성 중인 노트·열린 확인창이 없을 때만이다.
 * 사용자가 읽거나 쓰는 도중에 화면이 갑자기 바뀌지 않게 한다.
 */
export function isSafeMoment({ returnedFromHidden, hasDirtyDraft, modalOpen }: SafeMomentInput): boolean {
  return returnedFromHidden && !hasDirtyDraft && !modalOpen;
}

export interface UpdaterDeps {
  /** 서비스 워커 등록의 update() — 새 버전이 있는지 서버에 묻는다 */
  checkForUpdate: () => Promise<void>;
  /** 대기 중인 새 서비스 워커를 적용하고 새로고침한다 */
  applyUpdate: () => void;
  isHidden: () => boolean;
  modalOpen: () => boolean;
  hasDirtyDraft?: () => boolean;
  addVisibilityListener: (listener: () => void) => () => void;
  setInterval: (callback: () => void, ms: number) => () => void;
}

export interface Updater {
  /** 새 서비스 워커가 설치돼 대기 중임을 알린다 */
  markWaiting: () => void;
  isWaiting: () => boolean;
  stop: () => void;
}

/**
 * 업데이트 확인과 적용 시점을 정한다(docs/M2-PLAN.md §6.4): 확인은 자주(탭 복귀·15분 간격), 적용은 안전한 순간에만.
 * 새 버전을 알리는 배너는 두지 않는다(작은 앱: 다음에 탭으로 돌아올 때 조용히 바뀐다).
 */
export function startUpdater(deps: UpdaterDeps): Updater {
  let waiting = false;
  let wasHidden = deps.isHidden();

  const tryApply = (returnedFromHidden: boolean) => {
    if (waiting && isSafeMoment({ returnedFromHidden, hasDirtyDraft: (deps.hasDirtyDraft ?? hasDirtyDrafts)(), modalOpen: deps.modalOpen() })) {
      deps.applyUpdate();
    }
  };

  const check = () => {
    deps.checkForUpdate().catch((e: unknown) => console.error('서비스 워커 업데이트 확인 실패', e));
  };

  const stopVisibility = deps.addVisibilityListener(() => {
    if (deps.isHidden()) {
      wasHidden = true;
      return;
    }
    const returned = wasHidden;
    wasHidden = false;
    check();
    tryApply(returned);
  });
  const stopInterval = deps.setInterval(check, UPDATE_CHECK_INTERVAL_MS);

  return {
    markWaiting: () => {
      waiting = true;
      // 이미 숨었다 돌아온 화면이 아니므로 바로 적용하지 않는다. 다음에 숨었다 돌아올 때 적용한다.
    },
    isWaiting: () => waiting,
    stop: () => {
      stopVisibility();
      stopInterval();
    },
  };
}
