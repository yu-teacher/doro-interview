import { useParams } from 'react-router-dom';
import { fetchQuestion } from '../api/catalog';
import { AsyncView } from '../components/AsyncView';
import { useApi } from '../hooks/useApi';

/** S5: 골격만(본문은 일반 텍스트). 마크다운 렌더러·배지는 S6, 화면은 S7 에서 만든다. */
export function QuestionPage() {
  const { slug = '' } = useParams();
  const { state, reload } = useApi(`question:${slug}`, (signal) => fetchQuestion(slug, signal));
  return (
    <AsyncView state={state} reload={reload} notFoundMessage="찾을 수 없는 질문입니다.">
      {(q) => (
        <article>
          <h1 className="text-2xl font-bold">{q.title}</h1>
          <p className="mt-4 whitespace-pre-wrap">{q.spokenAnswer}</p>
        </article>
      )}
    </AsyncView>
  );
}
