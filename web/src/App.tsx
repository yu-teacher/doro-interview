import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ConceptPage } from './pages/ConceptPage';
import { ConceptsPage } from './pages/ConceptsPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { QuestionPage } from './pages/QuestionPage';
import { SearchPage } from './pages/SearchPage';
import { TopicPage } from './pages/TopicPage';
import { BASE_PATH } from './config';

/** 경로 정의. 시험에서는 MemoryRouter 안에 이것만 넣는다. */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="t/:topic" element={<TopicPage />} />
        <Route path="q/:slug" element={<QuestionPage />} />
        <Route path="concepts" element={<ConceptsPage />} />
        <Route path="c/:concept" element={<ConceptPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={BASE_PATH}>
      <AppRoutes />
    </BrowserRouter>
  );
}
