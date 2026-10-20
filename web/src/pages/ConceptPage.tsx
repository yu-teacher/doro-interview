import { useParams } from 'react-router-dom';
import { fetchConcept } from '../api/catalog';
import type { ConceptDetail } from '../api/types';
import { AsyncView } from '../components/AsyncView';
import { QuestionCard } from '../components/QuestionCard';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useSessionKey } from '../session/SessionProvider';

function ConceptContent({ detail }: { detail: ConceptDetail }) {
  useDocumentTitle(detail.concept.name);
  return (
    <div>
      <h1 className="text-2xl font-bold">{detail.concept.name}</h1>
      {detail.concept.description && <p className="mt-1 text-[var(--color-muted)]">{detail.concept.description}</p>}
      <p className="mt-3 text-sm text-[var(--color-muted)]">질문 {detail.questions.length}개</p>
      <ul className="mt-2 space-y-2">
        {detail.questions.map((q) => (
          <QuestionCard key={q.slug} question={q} />
        ))}
      </ul>
    </div>
  );
}

export function ConceptPage() {
  const { concept = '' } = useParams();
  const session = useSessionKey();
  const { state, reload } = useApi(`concept:${concept}:${session.key}`, (signal) => fetchConcept(concept, signal), session.ready);
  return (
    <AsyncView state={state} reload={reload} notFoundMessage="찾을 수 없는 개념입니다.">
      {(detail) => <ConceptContent detail={detail} />}
    </AsyncView>
  );
}
