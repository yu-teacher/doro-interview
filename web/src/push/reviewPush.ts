import { deleteSubscription, saveSubscription, type PushSubscriptionJson } from '../api/push';

/**
 * 이 기기(브라우저)의 복습 알림 구독.
 *  - supported: 켤 수 있다
 *  - needs-install: iPhone/iPad 는 홈 화면에 추가한 앱에서만 알림을 받을 수 있다(사파리 탭에서는 불가)
 *  - unsupported: 이 브라우저는 웹 푸시를 지원하지 않는다
 */
export type PushSupport = 'supported' | 'needs-install' | 'unsupported';

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function isInstalledApp(): boolean {
  return (navigator as NavigatorWithStandalone).standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

export function detectPushSupport(): PushSupport {
  if (isIos() && !isInstalledApp()) {
    return 'needs-install';
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported';
  }
  return 'supported';
}

/** 서버가 알려 준 공개 키(base64url)를 브라우저가 쓰는 바이트로 바꾼다. */
export function urlBase64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
}

function sameKey(subscription: PushSubscription, publicKey: string): boolean {
  const current = subscription.options.applicationServerKey;
  if (current === null || current === undefined) {
    return false;
  }
  const expected = urlBase64ToBytes(publicKey);
  const actual = new Uint8Array(current);
  return actual.length === expected.length && actual.every((byte, index) => byte === expected[index]);
}

export function toSubscriptionJson(subscription: PushSubscription): PushSubscriptionJson {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
    throw new Error('이 기기의 알림 구독 정보를 읽지 못했습니다.');
  }
  return { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } };
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

/** 이 기기가 지금 알림을 받는 상태인지(권한 허용 + 구독 있음). 권한을 새로 묻지 않는다. */
export async function isReceiving(): Promise<boolean> {
  if (detectPushSupport() !== 'supported' || Notification.permission !== 'granted') {
    return false;
  }
  return (await currentSubscription()) !== null;
}

/**
 * 이 기기로 복습 알림을 받도록 켠다: 권한을 묻고, 브라우저에 구독을 만들고, 서버에 등록한다.
 * 버튼을 누른 직후에 불러야 한다(브라우저는 사용자 동작 없이 권한을 묻지 못하게 한다).
 * @throws 권한을 거부했거나 구독·등록에 실패하면 안내 문구가 담긴 오류
 */
export async function enableThisDevice(publicKey: string): Promise<void> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('알림 권한이 허용되지 않았습니다. 브라우저(또는 기기) 설정에서 알림을 허용해 주세요.');
  }
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (subscription !== null && !sameKey(subscription, publicKey)) {
    await subscription.unsubscribe();
    subscription = null;
  }
  const active = subscription ?? (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToBytes(publicKey) }));
  await saveSubscription(toSubscriptionJson(active));
}

/** 이 기기의 알림을 끈다: 서버에서 지우고 브라우저 구독도 해제한다. */
export async function disableThisDevice(): Promise<void> {
  const subscription = await currentSubscription();
  if (subscription === null) {
    return;
  }
  await deleteSubscription(subscription.endpoint);
  await subscription.unsubscribe();
}

/**
 * 로그아웃 전에 이 기기를 내 계정에서 떼어 낸다(서버에서만 지운다). 안 떼면 같은 기기로 다른 사람이 로그인해도 이전 계정의 알림이 온다.
 * 실패해도 로그아웃은 계속한다(호출하는 쪽이 오류를 삼킨다).
 */
export async function detachThisDevice(): Promise<void> {
  if (!(await isReceiving())) {
    return;
  }
  const subscription = await currentSubscription();
  if (subscription !== null) {
    await deleteSubscription(subscription.endpoint);
  }
}
