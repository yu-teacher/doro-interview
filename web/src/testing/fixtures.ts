import type { QuestionDetail, QuestionSummary, TopicView } from '../api/types';

export function summary(slug: string, over: Partial<QuestionSummary> = {}): QuestionSummary {
  return {
    slug, topicSlug: 'transaction', tier: 'BASIC', difficulty: 1, title: `질문 ${slug}`, keywords: [], hasExtra: false,
    importance: null, concepts: [], ...over,
  };
}

export function detail(over: Partial<QuestionDetail> = {}): QuestionDetail {
  return {
    slug: 'tx-04', topicSlug: 'transaction', topicName: '트랜잭션', categorySlug: 'spring', tier: 'BASIC', difficulty: 1,
    title: '@Transactional 은 어떻게 동작하나요?', keywords: ['AOP 프록시', 'ThreadLocal'], hasExtra: true,
    spokenAnswer: '프록시가 메서드 호출 앞뒤로 트랜잭션을 엽니다.', detailMd: '(공식 문서) 근거 줄.\n(보충) 덧붙임.\n\n```java\nclass A {}\n```',
    status: 'REVIEWED', reviewedAt: '2026-10-20T00:00:00Z', needsReview: false, baseVersion: 'Spring Framework 7 / Boot 4',
    sources: ['https://docs.spring.io/a'], topicSources: [{ url: 'https://docs.spring.io/b', note: '앞부분만 읽음' }],
    prevSlug: 'tx-03', nextSlug: 'tx-05', importance: 3,
    concepts: [{ slug: 'proxy', name: '프록시' }, { slug: 'tx-boundary', name: '트랜잭션 경계' }],
    followups: [{ slug: 'tx-15', title: '같은 클래스 안 호출은?', tier: 'TRICKY', topicSlug: 'transaction' }],
    prerequisites: [{ slug: 'aop-01', title: 'AOP 란?', tier: 'BASIC', topicSlug: 'aop-proxy' }],
    related: [{ slug: 'jpa-03', title: '영속성 컨텍스트', tier: 'BASIC', topicSlug: 'jpa' }],
    ...over,
  };
}

export function topicView(questions: QuestionSummary[], over: Partial<TopicView> = {}): TopicView {
  return {
    summary: { slug: 'transaction', name: '트랜잭션', description: '전파·격리·롤백', baseVersion: 'Spring Framework 7 / Boot 4', counts: { basic: 0, deep: 0, tricky: 0 } },
    categorySlug: 'spring', categoryName: '스프링', sources: [{ url: 'https://docs.spring.io/tx', note: null }], questions, ...over,
  };
}
