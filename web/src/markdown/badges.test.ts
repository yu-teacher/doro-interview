import { describe, expect, it } from 'vitest';
import { countBadgeMarks, kindOf, splitText, type Part } from './badges';

const labels = (parts: Part[]) => parts.map((p) => (p.type === 'badge' ? `[${p.kind}:${p.label}]` : p.value));

describe('splitText: 토큰', () => {
  it('정확한 4가지 표기를 배지로 바꾼다', () => {
    expect(labels(splitText('(공식 문서) 근거', false))).toEqual(['[official:공식 문서]', ' 근거']);
    expect(labels(splitText('(공식) 근거', false))).toEqual(['[official:공식]', ' 근거']);
    expect(labels(splitText('(보충) 덧붙임', false))).toEqual(['[extra:보충]', ' 덧붙임']);
    expect(labels(splitText('(실험 확인) 실행', false))).toEqual(['[lab:실험 확인]', ' 실행']);
  });

  it('문장 중간에 있어도 배지가 된다', () => {
    expect(labels(splitText('실험 코드 인용은 확인한 사실이다. 접미사 이름은 (보충)이며 확인하지 않았다.', false))).toEqual([
      '실험 코드 인용은 확인한 사실이다. 접미사 이름은 ',
      '[extra:보충]',
      '이며 확인하지 않았다.',
    ]);
  });

  it('한 문단에 여럿이어도 모두 바꾼다', () => {
    expect(labels(splitText('(공식 문서) 가 (보충) 나 (실험 확인) 다', false))).toEqual([
      '[official:공식 문서]', ' 가 ', '[extra:보충]', ' 나 ', '[lab:실험 확인]', ' 다',
    ]);
  });

  it('정확한 표기가 아니면 글자 그대로 둔다', () => {
    for (const s of ['(공식 문서의 패턴을 람다로 단순화)', '(보충 설명)', '(공식문서)', '( 보충 )', '공식 문서에서 확인', '(실험)']) {
      expect(labels(splitText(s, false))).toEqual([s]);
    }
  });
});

describe('splitText: 접두', () => {
  it('블록 맨 앞의 `공식 문서:` 와 `공식:` 은 배지가 된다', () => {
    expect(labels(splitText('공식 문서: 각 릴리스는 …', true))).toEqual(['[official:공식 문서]', '각 릴리스는 …']);
    expect(labels(splitText('공식: 문서 확인', true))).toEqual(['[official:공식]', '문서 확인']);
  });

  it('괄호 설명은 배지 뒤에 그대로 남는다', () => {
    expect(labels(splitText('공식 문서(테스트 페이지): 위로 올라가며 찾는다', true))).toEqual([
      '[official:공식 문서]', '(테스트 페이지) 위로 올라가며 찾는다',
    ]);
  });

  it('블록 맨 앞이 아니면 접두 규칙을 적용하지 않는다', () => {
    expect(labels(splitText('공식 문서: 중간에 나온 것', false))).toEqual(['공식 문서: 중간에 나온 것']);
    expect(labels(splitText('설명 공식 문서: 뒤', true))).toEqual(['설명 공식 문서: 뒤']);
  });

  it('접두 뒤에 토큰이 또 있으면 둘 다 바꾼다', () => {
    expect(labels(splitText('공식 문서: 근거이고 (보충)도 있다', true))).toEqual([
      '[official:공식 문서]', '근거이고 ', '[extra:보충]', '도 있다',
    ]);
  });
});

describe('splitText: 손실 없음', () => {
  it('조각을 이으면 괄호·콜론만 빠지고 글은 모두 남는다', () => {
    const src = '(공식 문서) 가나다 (보충) 라마바 (실험 확인) 사아자';
    const joined = splitText(src, false).map((p) => (p.type === 'badge' ? p.label : p.value)).join('');
    expect(joined).toBe('공식 문서 가나다 보충 라마바 실험 확인 사아자');
  });
});

describe('kindOf', () => {
  it('종류를 정한다', () => {
    expect(kindOf('공식 문서')).toBe('official');
    expect(kindOf('공식')).toBe('official');
    expect(kindOf('보충')).toBe('extra');
    expect(kindOf('실험 확인')).toBe('lab');
  });
});

describe('countBadgeMarks', () => {
  it('토큰과 접두를 센다', () => {
    expect(countBadgeMarks('(공식 문서) 가\n(보충) 나 (실험 확인) 다\n- 공식 문서: 라\n- (보충) 마')).toBe(5);
  });

  it('코드 블록과 인라인 코드 안은 세지 않는다', () => {
    expect(countBadgeMarks('```java\n// (보충) 코드 안\n```\n`(공식 문서)` 인라인\n(보충) 밖')).toBe(1);
  });
});
