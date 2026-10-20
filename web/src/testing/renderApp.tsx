import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../App';
import { SessionProvider } from '../session/SessionProvider';

/** 실제 앱과 같은 구성(세션 공급자 + 경로)으로 그린다. 세션은 mockApi 의 `/interview/api/v1/bff/session` 응답을 따른다. */
export function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <AppRoutes />
      </SessionProvider>
    </MemoryRouter>,
  );
}
