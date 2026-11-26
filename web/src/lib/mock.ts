import type { MockTurn } from '../api/types';

/** 턴의 자리(docs/M7-PLAN.md): 본 질문, 꼬리질문 n단계, 기초 확인. */
export function originLabel(turn: Pick<MockTurn, 'origin' | 'depth'>): string {
  switch (turn.origin) {
    case 'MAIN':
      return '본 질문';
    case 'LINK':
      return `꼬리질문 ${turn.depth}단계`;
    case 'PREREQ':
      return '기초 확인';
    default:
      return '확인 질문';
  }
}

/** 턴을 본 질문마다 줄기(본 질문 → 꼬리질문·기초 확인)로 묶는다. 턴은 seq 순서라고 가정한다. */
export function chains(turns: MockTurn[]): MockTurn[][] {
  const out: MockTurn[][] = [];
  for (const t of turns) {
    if (t.origin === 'MAIN' || out.length === 0) {
      out.push([t]);
    } else {
      out[out.length - 1].push(t);
    }
  }
  return out;
}
