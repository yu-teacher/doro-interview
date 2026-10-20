import type { Page } from '@playwright/test';

/** 모바일 레이아웃 시험용 가짜 데이터: 일부러 긴 제목·긴 키워드·끊어지지 않는 긴 이름·긴 코드 줄을 넣어 넘침을 유발한다. */
const LONG_TITLE = '`@Transactional` 이 붙은 메서드를 같은 클래스 안에서 호출하면 왜 트랜잭션이 적용되지 않는지 프록시 관점에서 설명해 주세요';
const LONG_TOKEN = 'org.springframework.transaction.interceptor.TransactionAttributeSourcePointcut';
const LONG_CODE_LINE = '    private final Map<String, Function<TransactionDefinition, PlatformTransactionManager>> managers = new ConcurrentHashMap<>(); // 아주 긴 줄';

const tiers = ['BASIC', 'DEEP', 'TRICKY'] as const;
const concepts = [
  { slug: 'proxy', name: '프록시' },
  { slug: 'tx-boundary', name: '트랜잭션 경계와 전파 규칙' },
  { slug: 'persistence-context', name: '영속성 컨텍스트' },
];

function summary(i: number) {
  return {
    slug: `tx-${String(i).padStart(2, '0')}`, topicSlug: 'transaction', tier: tiers[i % 3], difficulty: (i % 3) + 1,
    title: i % 2 === 0 ? LONG_TITLE : `질문 ${i}: 트랜잭션 전파`,
    keywords: ['AOP 프록시', 'ThreadLocal', LONG_TOKEN], hasExtra: i % 2 === 0,
    importance: i % 4 === 0 ? null : (i % 3) + 1, concepts: concepts.slice(0, (i % 3) + 1).map((c) => c.slug),
  };
}

const questions = Array.from({ length: 14 }, (_, i) => summary(i + 1));
/** 로그인한 사용자의 응답: 질문마다 체크 여부(`learned`)가 붙는다. */
const questionsLearned = questions.map((q, i) => ({ ...q, learned: i % 3 === 0 }));
const topicSummary = { slug: 'transaction', name: '트랜잭션과 전파·격리·롤백 규칙, readOnly 와 예외 처리 전체 정리', description: '전파·격리·롤백·읽기 전용', baseVersion: 'Spring Framework 7 / Boot 4', counts: { basic: 5, deep: 5, tricky: 4 } };

const detail = {
  slug: 'tx-04', topicSlug: 'transaction', topicName: topicSummary.name, categorySlug: 'spring', tier: 'BASIC', difficulty: 1,
  title: LONG_TITLE,
  keywords: ['AOP 프록시', 'ThreadLocal', 'TransactionInterceptor', '새 스레드 미전파', LONG_TOKEN, '선언적 트랜잭션', '프록시 우회', '자기 호출', 'REQUIRES_NEW', 'readOnly'],
  hasExtra: true,
  spokenAnswer: `트랜잭션은 AOP 프록시가 메서드 호출 앞뒤로 열고 닫습니다. 핵심 클래스는 ${LONG_TOKEN} 이고, 문서는 https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html 에 있습니다.`,
  detailMd: `(공식 문서) \`@Transactional\` 은 thread-bound 트랜잭션을 쓴다.\n(보충) 스레드 바인딩의 실체는 ThreadLocal 이다.\n\n- 공식 문서: 새로 시작한 스레드로 전파되지 않는다.\n- (실험 확인) 테스트로 확인했다.\n\n\`\`\`java\n@Transactional\npublic void place(Order order) {\n${LONG_CODE_LINE}\n    orderRepository.save(order);\n}\n\`\`\``,
  status: 'REVIEWED', reviewedAt: '2026-10-20T00:00:00Z', needsReview: false, baseVersion: 'Spring Framework 7 / Boot 4',
  sources: ['https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html'],
  topicSources: [{ url: 'https://docs.spring.io/spring-framework/reference/data-access/transaction.html', note: '앞부분만 읽음' }],
  prevSlug: 'tx-03', nextSlug: 'tx-05', importance: 3, concepts,
  followups: [{ slug: 'tx-15', title: LONG_TITLE, tier: 'TRICKY', topicSlug: 'transaction' }],
  prerequisites: [{ slug: 'aop-01', title: 'AOP 가 무엇이고 왜 쓰나요?', tier: 'BASIC', topicSlug: 'aop-proxy' }],
  related: [{ slug: 'jpa-03', title: '영속성 컨텍스트란?', tier: 'BASIC', topicSlug: 'jpa' }],
};

const categories = [
  { slug: 'spring', name: '스프링', topics: [topicSummary, { slug: 'jpa', name: 'JPA', description: '영속성 컨텍스트, 더티 체킹, 지연 로딩, N+1', baseVersion: 'Spring Framework 7 / Boot 4', counts: { basic: 9, deep: 16, tricky: 6 } }] },
  { slug: 'java', name: '자바', topics: [{ slug: 'collections', name: '컬렉션', description: '', baseVersion: null, counts: { basic: 2, deep: 0, tricky: 0 } }] },
];

const conceptViews = concepts.map((c, i) => ({ ...c, description: i === 1 ? '전파 속성과 트랜잭션이 시작되고 끝나는 지점을 한 이야기로 묶어서 설명하는 개념' : '', questionCount: 3 + i }));

const search = {
  words: ['프록시'], total: 12,
  hits: questions.slice(0, 8).map((q, i) => ({ question: q, topicName: topicSummary.name, score: 5 - (i % 3), matchedIn: i % 2 === 0 ? ['title', 'keywords'] : ['body'] })),
};

const ok = (data: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
const fail = (status: number, code: string, message: string) => ({ status, contentType: 'application/json', body: JSON.stringify({ success: false, code, message, status }) });

export type SessionMode = 'anonymous' | 'authenticated' | 'error';

const LONG_NOTE = `${LONG_TOKEN} 는 TransactionAttributeSource 를 보고 어드바이스를 적용할지 판단한다.\n${'헷갈린 점을 적어 둔 긴 메모입니다. '.repeat(12)}`;
const LONG_NOTE_SHORT = `${LONG_TOKEN} 라고 답했다.`;
const progressSummary = {
  total: 19, learned: 7,
  topics: [{ topicSlug: 'transaction', total: 14, learned: 5 }, { topicSlug: 'jpa', total: 5, learned: 2 }],
};

export const QUIZ_ACTIVE_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
export const QUIZ_DONE_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const ACTIVE_ID = QUIZ_ACTIVE_ID;
const DONE_ID = QUIZ_DONE_ID;
const quizItem = (seq: number, over: Record<string, unknown> = {}) => ({
  seq, questionSlug: `tx-${String(seq).padStart(2, '0')}`, title: seq % 2 === 0 ? LONG_TITLE : `질문 ${seq}: 트랜잭션 전파`, tier: tiers[seq % 3],
  topicSlug: 'transaction', topicName: topicSummary.name, result: null, seconds: null, answerText: null, answeredAt: null, ...over,
});
const quizSession = (id: string, items: unknown[], finishedAt: string | null) => ({
  sessionId: id, plannedCount: items.length, includeUnlearned: false, mode: 'WEIGHTED', startedAt: '2026-10-20T00:00:00Z', finishedAt, items,
});
const activeSession = quizSession(ACTIVE_ID, [quizItem(1, { result: 'CORRECT', seconds: 40 }), quizItem(2), quizItem(3)], null);
const doneSession = quizSession(
  DONE_ID,
  [quizItem(1, { result: 'CORRECT', seconds: 40 }), quizItem(2, { result: 'WRONG', seconds: 95, answerText: LONG_NOTE_SHORT }), quizItem(3, { result: 'SKIPPED', seconds: 3 })],
  '2026-10-20T00:10:00Z',
);
const stats = {
  askedLast30Days: 24, correctLast30Days: 11, wrongLast30Days: 9, skippedLast30Days: 4, sessionsLast30Days: 3,
  mostMissed: [1, 2, 3].map((i) => ({ questionSlug: `tx-0${i}`, title: i % 2 === 0 ? LONG_TITLE : `질문 ${i}`, tier: tiers[i % 3], topicSlug: 'transaction', topicName: topicSummary.name, missCount: 4 - i, askCount: 5 })),
};
const reviewCandidates = [2, 4].map((i) => ({ slug: `tx-0${i}`, title: LONG_TITLE, tier: tiers[i % 3], topicSlug: 'transaction', topicName: topicSummary.name }));

/**
 * `/interview/api/**` 요청을 가로채 가짜 응답을 준다. 등록하지 않은 주소는 404.
 * `session` 은 로그인 상태(기본 비로그인): 로그인이면 체크 상태·진도·노트가 같이 나오고, error 면 세션 조회가 실패한다.
 */
export async function installApi(page: Page, session: SessionMode = 'anonymous'): Promise<void> {
  const authenticated = session === 'authenticated';
  await page.route(/\/interview\/api\//, async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace('/interview/api', '');
    const q = url.searchParams.get('q');
    const method = route.request().method();
    switch (true) {
      case path === '/v1/bff/session':
        return session === 'error'
          ? route.fulfill(fail(503, 'AUTH-503-02', '로그인 서비스에 연결할 수 없습니다.'))
          : route.fulfill(ok(authenticated ? { authenticated: true, user: { userId: '11111111-1111-1111-1111-111111111111' } } : { authenticated: false }));
      case path === '/v1/bff/logout' && method === 'POST':
        return route.fulfill(ok(null));
      case path === '/v1/progress/summary':
        return authenticated ? route.fulfill(ok(progressSummary)) : route.fulfill(fail(401, 'AUTH-401-01', '로그인이 필요합니다.'));
      case path.startsWith('/v1/progress') && method === 'PUT':
        return route.fulfill(ok({ ok: true }));
      case path.startsWith('/v1/notes/') && method === 'GET':
        return route.fulfill(ok({ slug: path.split('/').pop(), body: LONG_NOTE, updatedAt: '2026-10-20T00:00:00Z' }));
      case path.startsWith('/v1/notes/') && method === 'PUT':
        return route.fulfill(ok({ slug: path.split('/').pop(), body: LONG_NOTE, updatedAt: '2026-10-20T01:00:00Z' }));
      case path === '/v1/me/prefs':
        return route.fulfill(authenticated ? ok({ includeUnlearnedDefault: false }) : fail(401, 'AUTH-401-01', '로그인이 필요합니다.'));
      case path === '/v1/me/stats':
        return route.fulfill(authenticated ? ok(stats) : fail(401, 'AUTH-401-01', '로그인이 필요합니다.'));
      case path === '/v1/review-candidates':
        return route.fulfill(authenticated ? ok(reviewCandidates) : fail(401, 'AUTH-401-01', '로그인이 필요합니다.'));
      case path === `/v1/quiz/${ACTIVE_ID}`:
        return route.fulfill(ok(activeSession));
      case path === `/v1/quiz/${DONE_ID}`:
        return route.fulfill(ok(doneSession));
      case path.startsWith('/v1/quiz/') && method === 'PUT':
        return route.fulfill(ok({ ok: true }));
      case path === '/v1/categories':
        return route.fulfill(ok(categories));
      case path === '/v1/topics/transaction':
        return route.fulfill(ok({ summary: topicSummary, categorySlug: 'spring', categoryName: '스프링', sources: [{ url: 'https://docs.spring.io/spring-framework/reference/data-access/transaction.html', note: null }], questions: authenticated ? questionsLearned : questions }));
      case path === '/v1/topics/boom':
        return route.fulfill({ status: 502, contentType: 'text/html', body: '<html>502 Bad Gateway</html>' });
      case path === '/v1/questions/tx-04':
        return route.fulfill(ok(authenticated ? { ...detail, learned: false } : detail));
      case path === '/v1/concepts':
        return route.fulfill(ok(conceptViews));
      case path === '/v1/concepts/proxy':
        return route.fulfill(ok({ concept: conceptViews[0], questions: questions.slice(0, 6) }));
      case path === '/v1/search' && q === '없음':
        return route.fulfill(ok({ words: ['없음'], total: 0, hits: [] }));
      case path === '/v1/search':
        return route.fulfill(ok(search));
      default:
        return route.fulfill(fail(404, 'COMMON-404-01', '요청한 리소스를 찾을 수 없습니다.'));
    }
  });
}
