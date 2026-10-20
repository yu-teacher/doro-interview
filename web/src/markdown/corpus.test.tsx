// @vitest-environment jsdom
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Markdown } from './Markdown';

/**
 * 실제 content/ 의 모든 질문 본문을 렌더링해서 확인한다(docs/M1-PLAN.md S6). 특정 질문을 못 박지 않고 불변식만 본다:
 * 예외 없음, 코드 블록 보존, 배지 개수, 보충 표기와 has_extra 의 일치, 원시 HTML 미해석, 본문 글자 손실 없음.
 */
const CONTENT = join(process.cwd(), '..', 'content');

interface Doc {
  slug: string;
  hasExtra: boolean;
  body: string;
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function load(): Doc[] {
  return walk(CONTENT)
    .filter((p) => p.endsWith('.md'))
    .map((p) => {
      const text = readFileSync(p, 'utf-8').replace(/\r\n/g, '\n');
      const end = text.indexOf('\n---\n', 3);
      const head = text.slice(4, end);
      return {
        slug: /^slug: "([^"]+)"/m.exec(head)?.[1] ?? p,
        hasExtra: /^has_extra: true$/m.test(head),
        body: text.slice(end + 5),
      };
    });
}

function dom(source: string): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = renderToStaticMarkup(<Markdown source={source} />);
  return root;
}

/** 코드 펜스 밖의 줄과, 펜스 안의 코드 목록을 따로 모은다(렌더러와 독립적으로 구현한 파서). */
function scan(body: string): { prose: string[]; fences: { lang: string; code: string }[] } {
  const prose: string[] = [];
  const fences: { lang: string; code: string }[] = [];
  let current: { lang: string; lines: string[] } | null = null;
  for (const line of body.split('\n')) {
    const fence = /^\s*```(\w*)\s*$/.exec(line);
    if (fence && current === null) {
      current = { lang: fence[1], lines: [] };
    } else if (fence && current !== null) {
      fences.push({ lang: current.lang, code: current.lines.join('\n') });
      current = null;
    } else if (current) {
      current.lines.push(line);
    } else {
      prose.push(line);
    }
  }
  return { prose, fences };
}

/** 독립 구현: 코드 밖 줄에서 배지가 될 표기를 센다. */
function expectedBadges(prose: string[]): number {
  let n = 0;
  for (const raw of prose) {
    const line = raw.replace(/`[^`]*`/g, '');
    const text = line.replace(/^\s*(?:[-*]|\d+\.)\s+/, '');
    const prefix = /^(?:공식 문서|공식)(?:\([^)]*\))?:/.test(text);
    if (prefix) {
      n += 1;
    }
    const rest = prefix ? text.replace(/^(?:공식 문서|공식)(?:\([^)]*\))?:\s*/, '') : text;
    n += rest.split(/\((?:공식 문서|공식|보충|실험 확인)\)/).length - 1;
  }
  return n;
}

const squash = (s: string) => s.replace(/\s+/g, '');
const docs = load();

describe('실제 질문 본문 렌더링', () => {
  it('질문 파일을 읽었다', () => {
    expect(docs.length).toBeGreaterThanOrEqual(159);
  });

  it('모든 본문이 예외 없이 렌더링된다', () => {
    for (const d of docs) {
      expect(() => dom(d.body), d.slug).not.toThrow();
    }
  });

  it('코드 블록 수와 코드 텍스트가 그대로다', () => {
    for (const d of docs) {
      const { fences } = scan(d.body);
      const rendered = Array.from(dom(d.body).querySelectorAll('pre code'));
      expect(rendered.length, `${d.slug} 코드 블록 수`).toBe(fences.length);
      fences.forEach((f, i) => {
        expect(rendered[i].textContent?.trimEnd(), `${d.slug} 코드 #${i}`).toBe(f.code.trimEnd());
      });
    }
  });

  it('코드 언어가 지정되면 language 클래스가 붙고 java 는 하이라이트된다', () => {
    let javaHighlighted = 0;
    for (const d of docs) {
      const { fences } = scan(d.body);
      const rendered = Array.from(dom(d.body).querySelectorAll('pre code'));
      fences.forEach((f, i) => {
        if (f.lang) {
          expect(rendered[i].className, `${d.slug} #${i}`).toContain(`language-${f.lang}`);
        }
        if (f.lang === 'java' && rendered[i].querySelector('[class^="hljs-"]')) {
          javaHighlighted += 1;
        }
      });
    }
    expect(javaHighlighted).toBeGreaterThan(0);
  });

  it('배지 개수가 독립적으로 센 표기 수와 같다', () => {
    for (const d of docs) {
      const expected = expectedBadges(scan(d.body).prose);
      expect(dom(d.body).querySelectorAll('[data-badge]').length, `${d.slug} 배지`).toBe(expected);
    }
  });

  it('has_extra 인 질문에는 보충 배지가 있고 아닌 질문에는 없다', () => {
    for (const d of docs) {
      const extra = dom(d.body).querySelectorAll('[data-badge="extra"]').length;
      expect(extra > 0, `${d.slug} has_extra=${d.hasExtra}`).toBe(d.hasExtra);
    }
  });

  it('원시 HTML 요소가 생기지 않고 이벤트 속성이 없다', () => {
    for (const d of docs) {
      const c = dom(d.body);
      expect(c.querySelector('script, img, iframe, object, embed, style, link, form, input'), d.slug).toBeNull();
      for (const el of Array.from(c.querySelectorAll('*'))) {
        expect(Array.from(el.attributes).some((a) => a.name.startsWith('on')), d.slug).toBe(false);
      }
    }
  });

  it('꺾쇠 표기(제네릭 등)가 글자로 보인다', () => {
    let seen = 0;
    for (const d of docs) {
      const prose = scan(d.body).prose.join('\n').replace(/`[^`]*`/g, '');
      const text = squash(dom(d.body).textContent ?? '');
      for (const m of prose.matchAll(/<[A-Za-z][A-Za-z0-9]*>/g)) {
        seen += 1;
        expect(text, `${d.slug} ${m[0]}`).toContain(m[0]);
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('본문의 글(단어)이 하나도 사라지지 않는다', () => {
    for (const d of docs) {
      // 토큰은 괄호가 배지로 바뀌며 사라지는 게 정상이라, 단어에 붙어 있어도 비교할 수 있게 먼저 떼어 놓는다
      const prose = scan(d.body).prose.join('\n').replace(/\((공식 문서|공식|보충|실험 확인)\)/g, ' $1 ');
      // 인라인 코드는 안의 글자를 그대로(강조 기호 `*` 를 지우지 않고), 그 밖에서만 강조 기호를 지운다
      const plain = prose
        .split(/(`[^`]*`)/)
        .map((seg) => (seg.length > 1 && seg.startsWith('`') && seg.endsWith('`') ? seg.slice(1, -1) : seg.replace(/\*/g, '')))
        .join('');
      const text = squash(dom(d.body).textContent ?? '');
      const words = plain
        .split(/\s+/)
        .map((w) => w.replace(/^[()[\],.:;"'→\-·]+|[()[\],.:;"'→\-·]+$/g, ''))
        .filter((w) => w.length >= 2);
      for (const w of words) {
        expect(text, `${d.slug} "${w}"`).toContain(squash(w));
      }
    }
  });
});
