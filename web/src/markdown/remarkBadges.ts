import type { Parent, PhrasingContent, Root, RootContent } from 'mdast';
import { splitText, type Part } from './badges';

const SKIP = new Set(['code', 'inlineCode', 'html']);

function badgeNode(part: Extract<Part, { type: 'badge' }>): PhrasingContent {
  // hName 'span' + data-badge 속성: Markdown 컴포넌트가 span 을 보고 Badge 로 그린다
  return {
    type: 'emphasis',
    children: [{ type: 'text', value: part.label }],
    data: { hName: 'span', hProperties: { 'data-badge': part.kind } },
  } as PhrasingContent;
}

function convert(parent: Parent, blockStart: boolean): void {
  const out: RootContent[] = [];
  parent.children.forEach((child, index) => {
    if (SKIP.has(child.type)) {
      out.push(child);
      return;
    }
    if (child.type === 'text') {
      const first = blockStart && index === 0;
      const parts = splitText(child.value, first);
      parts.forEach((part, i) => {
        if (part.type === 'text') {
          out.push({ type: 'text', value: part.value });
          return;
        }
        // 문단 가운데에서 새 주장을 여는 배지("... 한다. (실험 확인) 위 코드를 ...")는 새 줄에서 시작해, 한 덩어리로 이어진 긴 글을 근거별로 끊어 읽게 한다.
        // 뒤에 이어지는 글이 없는 꼬리표형 배지("... 한다 (공식 문서)")는 그대로 둔다.
        const next = parts[i + 1];
        const opensClaim = next?.type === 'text' && next.value.trim().length >= 5;
        if (parent.type === 'paragraph' && out.length > 0 && opensClaim) {
          out.push({ type: 'break' } as RootContent, { type: 'break' } as RootContent);
        }
        out.push(badgeNode(part));
      });
      return;
    }
    if ('children' in child) {
      convert(child as Parent, child.type === 'paragraph');
    }
    out.push(child);
  });
  (parent as { children: RootContent[] }).children = out;
}

/** `(공식 문서)` 같은 표기를 배지 노드로 바꾸는 remark 플러그인. 코드와 원시 HTML 은 건드리지 않는다. */
export function remarkBadges() {
  return (tree: Root) => convert(tree, false);
}
