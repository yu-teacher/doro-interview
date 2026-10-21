// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Markdown } from './Markdown';

afterEach(cleanup);

function view(source: string) {
  return render(<Markdown source={source} />).container;
}

const badges = (c: HTMLElement) => Array.from(c.querySelectorAll('[data-badge]')).map((e) => `${e.getAttribute('data-badge')}:${e.textContent}`);

describe('Markdown: 배지', () => {
  it('토큰이 종류별 배지가 된다', () => {
    const c = view('(공식 문서) 근거 (보충) 설명 (실험 확인) 실행 (공식) 끝');
    expect(badges(c)).toEqual(['official:공식 문서', 'extra:보충', 'lab:실험 확인', 'official:공식']);
    expect(c.textContent).toContain('근거');
    expect(c.textContent).not.toContain('(공식 문서)');
  });

  it('글머리와 문단 시작의 접두도 배지가 된다', () => {
    const c = view('- 공식 문서: 근거 하나\n- (보충) 설명 둘\n\n공식: 문단 시작');
    expect(badges(c)).toEqual(['official:공식 문서', 'extra:보충', 'official:공식']);
    expect(c.querySelectorAll('li')).toHaveLength(2);
  });

  it('굵게·기울임 안의 표기도 바꾼다', () => {
    expect(badges(view('**(보충) 굵은 설명**'))).toEqual(['extra:보충']);
  });

  it('정확한 표기가 아닌 괄호는 글자로 남는다', () => {
    const c = view('(공식 문서의 패턴을 람다로 단순화)');
    expect(badges(c)).toEqual([]);
    expect(c.textContent).toContain('(공식 문서의 패턴을 람다로 단순화)');
  });

  it('인라인 코드와 코드 블록 안의 표기는 배지가 아니다', () => {
    const c = view('`(보충)` 설명\n\n```java\n// (공식 문서) 주석\n```');
    expect(badges(c)).toEqual([]);
    expect(c.querySelector('code')?.textContent).toBe('(보충)');
    expect(c.querySelector('pre code')?.textContent).toContain('(공식 문서) 주석');
  });
});

describe('Markdown: 원시 HTML 은 해석하지 않는다', () => {
  it('제네릭 표기는 글자 그대로 보인다', () => {
    const c = view('Optional<T>와 파라미터의 @Nullable, List<String> 도 있다.');
    expect(c.textContent).toContain('Optional<T>와');
    expect(c.textContent).toContain('List<String>');
  });

  it('script·img·iframe 은 요소가 되지 않고 이벤트 속성도 없다', () => {
    const c = view('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n<iframe src="https://evil.example"></iframe>\n\n<div onclick="x()">클릭</div>');
    expect(c.querySelector('script, img, iframe, object, embed, style, link')).toBeNull();
    for (const el of Array.from(c.querySelectorAll('*'))) {
      expect(Array.from(el.attributes).some((a) => a.name.startsWith('on'))).toBe(false);
    }
  });

  it('javascript: 링크는 만들지 않는다', () => {
    const c = view('[클릭](javascript:alert(1))');
    const a = c.querySelector('a');
    expect(a === null || !(a.getAttribute('href') ?? '').toLowerCase().startsWith('javascript:')).toBe(true);
  });
});

describe('Markdown: 코드 블록', () => {
  it('java 는 하이라이트되고 코드 텍스트는 그대로다', () => {
    const code = 'public class A {\n    // 주석\n    String s = "문자열";\n}';
    const c = view('```java\n' + code + '\n```');
    const el = c.querySelector('pre code') as HTMLElement;
    expect(el.className).toContain('language-java');
    expect(el.querySelector('.hljs-keyword')).not.toBeNull();
    expect(el.querySelector('.hljs-string')).not.toBeNull();
    expect(el.querySelector('.hljs-comment')).not.toBeNull();
    expect(el.textContent?.trimEnd()).toBe(code);
  });

  it('yaml·bash·groovy 도 하이라이트한다', () => {
    expect(view('```yaml\nkey: "v"\nlist:\n  - 1\n```').querySelector('pre code [class^="hljs-"]')).not.toBeNull();
    cleanup();
    expect(view('```bash\necho "hi" # c\n```').querySelector('pre code [class^="hljs-"]')).not.toBeNull();
    cleanup();
    expect(view('```groovy\ndef x = "a"\n```').querySelector('pre code [class^="hljs-"]')).not.toBeNull();
  });

  it('text·언어 없음·모르는 언어는 하이라이트 없이 그대로 보인다(오류 없음)', () => {
    for (const lang of ['text', '', 'cobol']) {
      const c = view('```' + lang + '\nplain (보충) <T>\n```');
      const el = c.querySelector('pre code') as HTMLElement;
      expect(el.textContent?.trimEnd()).toBe('plain (보충) <T>');
      expect(el.querySelector('[class^="hljs-"]')).toBeNull();
      expect(badges(c)).toEqual([]);
      cleanup();
    }
  });

  it('pre 는 키보드로 스크롤할 수 있고 가로 넘침을 자체 스크롤로 처리한다', () => {
    const pre = view('```java\nint x;\n```').querySelector('pre') as HTMLElement;
    expect(pre.getAttribute('tabindex')).toBe('0');
    expect(pre.getAttribute('aria-label')).toBe('코드');
    expect(pre.className).toContain('overflow-x-auto');
    expect(pre.className).toContain('max-w-full');
  });
});

describe('Markdown: 그 밖', () => {
  it('외부 링크는 새 탭에 rel 을 붙인다', () => {
    const a = view('[문서](https://docs.spring.io/x)').querySelector('a') as HTMLAnchorElement;
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('굵게·인라인 코드·목록을 그린다', () => {
    const c = view('**굵게** 와 `code`\n\n- 하나\n- 둘\n\n1. 첫째\n2. 둘째');
    expect(c.querySelector('strong')?.textContent).toBe('굵게');
    expect(c.querySelector('code')?.textContent).toBe('code');
    expect(c.querySelectorAll('ul li')).toHaveLength(2);
    expect(c.querySelectorAll('ol li')).toHaveLength(2);
  });

  it('빈 문자열도 오류 없이 그린다', () => {
    expect(view('').textContent).toBe('');
  });
});

describe('근거 배지 앞의 줄바꿈', () => {
  const brs = (md: string) => {
    const { container } = render(<Markdown source={md} />);
    return container.querySelectorAll('br').length;
  };

  it('문단 가운데에서 새 주장을 여는 배지는 새 줄(빈 줄 하나)에서 시작한다', () => {
    expect(brs('앞 문장이다. (공식 문서) JLS 는 이렇게 정의한다. (실험 확인) 위 코드를 컴파일하면 오류가 났다.')).toBe(4);
  });

  it('문단의 맨 앞 배지와 뒤에 글이 없는 꼬리표형 배지는 줄을 바꾸지 않는다', () => {
    expect(brs('(공식 문서) 문단 맨 앞의 배지 뒤에 이어지는 글이다.')).toBe(0);
    expect(brs('이 설명은 공식 문서에 있다 (공식 문서)')).toBe(0);
  });

  it('글자는 하나도 사라지지 않는다', () => {
    const { container } = render(<Markdown source="앞이다. (보충) 덧붙이는 설명이다." />);
    expect(container.textContent).toContain('덧붙이는 설명이다.');
    expect(container.textContent).toContain('앞이다.');
  });
});
