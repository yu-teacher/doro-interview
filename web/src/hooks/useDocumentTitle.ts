import { useEffect } from 'react';
import { SERVICE_NAME } from '../config';

/** 탭 제목과 기록(뒤로 가기 목록)에 화면 이름이 보이게 한다. 제목이 없으면 서비스 이름만 쓴다. */
export function useDocumentTitle(title: string | null | undefined): void {
  useEffect(() => {
    document.title = title ? `${title} · ${SERVICE_NAME}` : SERVICE_NAME;
  }, [title]);
}
