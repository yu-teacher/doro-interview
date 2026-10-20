import type { ReactElement } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { UpdateNotice } from './components/UpdateNotice';
import { ConceptPage } from './pages/ConceptPage';
import { ConceptsPage } from './pages/ConceptsPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { QuestionPage } from './pages/QuestionPage';
import { QuizPage } from './pages/QuizPage';
import { QuizStartPage } from './pages/QuizStartPage';
import { SearchPage } from './pages/SearchPage';
import { SkimPage, SkimTopicPage } from './pages/SkimPage';
import { StatsPage } from './pages/StatsPage';
import { TopicPage } from './pages/TopicPage';
import { BASE_PATH } from './config';
import { APP_ROUTE_PATHS, type AppRoutePath } from './routes';
import { SessionProvider } from './session/SessionProvider';

/** 화면. 키는 routes.ts 의 APP_ROUTE_PATHS 와 정확히 같아야 한다(타입이 강제한다): 서비스 워커의 내비게이션 허용 목록이 같은 목록에서 만들어진다. */
const PAGES: Record<AppRoutePath, ReactElement> = {
  '/': <HomePage />,
  '/t/:topic': <TopicPage />,
  '/q/:slug': <QuestionPage />,
  '/concepts': <ConceptsPage />,
  '/c/:concept': <ConceptPage />,
  '/search': <SearchPage />,
  '/quiz': <QuizStartPage />,
  '/quiz/:id': <QuizPage />,
  '/skim': <SkimPage />,
  '/skim/:topic': <SkimTopicPage />,
  '/stats': <StatsPage />,
};

/** 경로 정의. 시험에서는 MemoryRouter 안에 이것만 넣는다. */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {APP_ROUTE_PATHS.map((path) =>
          path === '/' ? <Route key={path} index element={PAGES[path]} /> : <Route key={path} path={path.slice(1)} element={PAGES[path]} />,
        )}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={BASE_PATH}>
      <SessionProvider>
        <AppRoutes />
        <UpdateNotice />
      </SessionProvider>
    </BrowserRouter>
  );
}
