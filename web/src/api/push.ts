import { apiGet, apiSend } from './client';

/** 복습 알림 설정(이 기기). available 이 false 면 서버에서 알림 기능이 꺼져 있다. */
export interface PushConfig {
  available: boolean;
  publicKey: string | null;
}

export interface PushSubscriptionJson {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushTestResult {
  devices: number;
  delivered: number;
}

export const fetchPushConfig = (signal?: AbortSignal) => apiGet<PushConfig>('v1/me/push', undefined, signal);
export const saveSubscription = (subscription: PushSubscriptionJson) => apiSend<{ subscribed: boolean }>('PUT', 'v1/me/push/subscription', subscription);
/** 게이트웨이가 GET·PUT 만 통과시키므로 끄기도 PUT 이다. */
export const deleteSubscription = (endpoint: string) => apiSend<{ subscribed: boolean }>('PUT', 'v1/me/push/unsubscribe', { endpoint });
export const sendTestPush = () => apiSend<PushTestResult>('PUT', 'v1/me/push/test', {});
