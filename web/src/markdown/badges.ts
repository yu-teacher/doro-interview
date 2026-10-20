/**
 * 근거 배지 규칙(docs/M1-PLAN.md D5). 본문의 표기를 배지로 바꾼다.
 *
 * - 토큰: 정확히 `(공식 문서)` `(공식)` `(보충)` `(실험 확인)` — 문장 어디에 있든 배지가 된다.
 * - 접두: 문단·글머리의 맨 앞 `공식 문서:` / `공식:` / `공식 문서(설명):` — 배지가 되고 괄호 설명은 그대로 남는다.
 * - 그 밖(`(공식 문서의 패턴을 …)` 같은 것)은 글자 그대로 둔다.
 * 코드 블록과 인라인 코드 안은 건드리지 않는다(플러그인이 건너뛴다).
 */
export type BadgeKind = 'official' | 'extra' | 'lab';

export interface TextPart {
  type: 'text';
  value: string;
}

export interface BadgePart {
  type: 'badge';
  kind: BadgeKind;
  label: string;
}

export type Part = TextPart | BadgePart;

const TOKEN = /\((공식 문서|공식|보충|실험 확인)\)/g;
const PREFIX = /^(공식 문서|공식)(\([^)]*\))?:\s*/;

export function kindOf(label: string): BadgeKind {
  if (label === '보충') {
    return 'extra';
  }
  if (label === '실험 확인') {
    return 'lab';
  }
  return 'official';
}

/** 한 텍스트를 글자와 배지 조각으로 나눈다. `atBlockStart` 가 true 면 접두 형태도 본다. 조각을 이으면 (배지 글자를 포함해) 원문의 글이 모두 남는다. */
export function splitText(value: string, atBlockStart: boolean): Part[] {
  const parts: Part[] = [];
  let rest = value;
  if (atBlockStart) {
    const m = PREFIX.exec(rest);
    if (m) {
      parts.push({ type: 'badge', kind: 'official', label: m[1] });
      rest = (m[2] ? m[2] + ' ' : '') + rest.slice(m[0].length);
    }
  }
  let last = 0;
  for (const m of rest.matchAll(TOKEN)) {
    const index = m.index ?? 0;
    if (index > last) {
      parts.push({ type: 'text', value: rest.slice(last, index) });
    }
    parts.push({ type: 'badge', kind: kindOf(m[1]), label: m[1] });
    last = index + m[0].length;
  }
  if (last < rest.length) {
    parts.push({ type: 'text', value: rest.slice(last) });
  }
  return parts;
}

/** 원문에서 배지가 될 표기의 개수(코드 블록·인라인 코드 밖). 테스트가 렌더 결과와 독립적으로 세는 데 쓴다. */
export function countBadgeMarks(markdown: string): number {
  const withoutFences = markdown.replace(/^[ \t]*```[\s\S]*?^[ \t]*```[ \t]*$/gm, '');
  const withoutInlineCode = withoutFences.replace(/`[^`\n]*`/g, '');
  let count = 0;
  for (const line of withoutInlineCode.split('\n')) {
    const text = line.replace(/^\s*(?:[-*]|\d+\.)\s+/, '');
    if (PREFIX.test(text)) {
      count += 1;
    }
    count += (text.replace(PREFIX, '').match(TOKEN) ?? []).length;
  }
  return count;
}
