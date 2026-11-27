import { useEffect, useState } from 'react';
import { ApiError, userMessage } from '../api/client';
import { fetchPushConfig, sendTestPush, type PushConfig } from '../api/push';
import { detectPushSupport, disableThisDevice, enableThisDevice, isReceiving } from '../push/reviewPush';

const BUTTON = 'min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 disabled:opacity-60';

function messageOf(e: unknown, fallback: string): string {
  if (e instanceof ApiError) {
    return userMessage(e);
  }
  return e instanceof Error && e.message ? e.message : fallback;
}

/**
 * 복습 알림(이 기기): 틀린 질문을 1·3·7일째 저녁에 알려 준다. 서버에서 알림 기능이 꺼져 있으면 아무것도 보이지 않는다.
 * iPhone·iPad 는 홈 화면에 추가한 앱에서만 받을 수 있어서 그 안내를 보여 준다.
 */
export function ReviewPushSettings() {
  const [config, setConfig] = useState<PushConfig | null>(null);
  const [receiving, setReceiving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const support = detectPushSupport();

  useEffect(() => {
    const controller = new AbortController();
    fetchPushConfig(controller.signal)
      .then(async (next) => {
        setConfig(next);
        if (next.available && support === 'supported') {
          setReceiving(await isReceiving());
        }
      })
      .catch(() => setConfig({ available: false, publicKey: null }));
    return () => controller.abort();
  }, [support]);

  if (config === null || !config.available) {
    return null;
  }

  async function run(action: () => Promise<void>) {
    if (busy) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  const enable = () =>
    run(async () => {
      try {
        await enableThisDevice(config.publicKey ?? '');
        setReceiving(true);
        setMessage({ ok: true, text: '이 기기에서 복습 알림을 받습니다.' });
      } catch (e) {
        setMessage({ ok: false, text: messageOf(e, '알림을 켜지 못했습니다. 잠시 뒤에 다시 시도해 주세요.') });
      }
    });

  const disable = () =>
    run(async () => {
      try {
        await disableThisDevice();
        setReceiving(false);
        setMessage({ ok: true, text: '이 기기의 복습 알림을 껐습니다.' });
      } catch (e) {
        setMessage({ ok: false, text: messageOf(e, '알림을 끄지 못했습니다. 잠시 뒤에 다시 시도해 주세요.') });
      }
    });

  const test = () =>
    run(async () => {
      try {
        const result = await sendTestPush();
        setMessage(
          result.devices === 0
            ? { ok: false, text: '알림을 받을 기기가 없습니다. 먼저 이 기기에서 받기를 켜 주세요.' }
            : { ok: true, text: `시험 알림을 보냈습니다(기기 ${result.devices}대).` },
        );
      } catch (e) {
        setMessage({ ok: false, text: messageOf(e, '시험 알림을 보내지 못했습니다.') });
      }
    });

  return (
    <section aria-labelledby="push-heading" className="mt-6">
      <h2 id="push-heading" className="mb-1 font-bold">
        복습 알림
      </h2>
      <p className="mb-2 text-sm text-[var(--color-muted)]">학습한 질문을 시험에서 틀리면, 틀린 지 1·3·7일째 저녁 8시에 다시 풀어 보라고 알려 줍니다.</p>
      {support === 'needs-install' ? (
        <p className="text-sm">iPhone·iPad 에서는 공유 버튼의 ‘홈 화면에 추가’로 앱을 설치한 뒤, 설치한 앱에서 알림을 켤 수 있습니다.</p>
      ) : support === 'unsupported' ? (
        <p className="text-sm">이 브라우저는 알림을 지원하지 않습니다.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {receiving ? (
            <>
              <button type="button" onClick={() => void disable()} disabled={busy} className={BUTTON}>
                이 기기에서 끄기
              </button>
              <button type="button" onClick={() => void test()} disabled={busy} className={BUTTON}>
                시험 알림 보내기
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void enable()}
              disabled={busy}
              className="min-h-11 rounded-md bg-[var(--color-accent)] px-4 font-semibold text-[var(--color-accent-contrast)] disabled:opacity-60"
            >
              이 기기에서 받기
            </button>
          )}
        </div>
      )}
      {message && (
        <p role={message.ok ? 'status' : 'alert'} className={`mt-2 ${message.ok ? 'text-[var(--color-text)]' : 'text-[var(--color-extra)]'}`}>
          {message.text}
        </p>
      )}
    </section>
  );
}
