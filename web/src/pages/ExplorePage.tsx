import { Link } from 'react-router-dom';
import { fetchCategories } from '../api/catalog';
import { fetchProgressSummary } from '../api/progress';
import { AsyncView } from '../components/AsyncView';
import { CategorySections } from '../components/CategorySections';
import { SearchBox } from '../components/SearchBox';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { conceptsPath, skimPath } from '../routes';
import { useSessionKey } from '../session/SessionProvider';

/** 탐색(F0): 질문 은행을 훑는 곳 — 주제 목록, 개념, 훑기. 폰에서는 여기에 검색 입력도 둔다(헤더에는 아이콘뿐). */
export function ExplorePage() {
  useDocumentTitle('탐색');
  const { state, reload } = useApi('categories', (signal) => fetchCategories(signal));
  const session = useSessionKey();
  const summary = useApi(`summary:${session.key}`, (signal) => fetchProgressSummary(signal), session.authenticated);
  const byTopic = new Map(session.authenticated && summary.state.status === 'success' ? summary.state.data.topics.map((t) => [t.topicSlug, t]) : []);
  return (
    <div>
      <h1 className="text-2xl font-bold">탐색</h1>
      <div className="mt-3 md:hidden">
        <SearchBox id="explore-search" landmark="탐색 화면의 질문 검색" />
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4">
        <li>
          <Link to={conceptsPath()} className="inline-flex min-h-11 items-center font-semibold">
            개념으로 찾기
          </Link>
        </li>
        <li>
          <Link to={skimPath()} className="inline-flex min-h-11 items-center font-semibold">
            주제별 훑기
          </Link>
        </li>
      </ul>
      <div className="mt-4 space-y-8">
        <AsyncView state={state} reload={reload}>
          {(categories) => <CategorySections categories={categories} byTopic={byTopic} />}
        </AsyncView>
      </div>
    </div>
  );
}
