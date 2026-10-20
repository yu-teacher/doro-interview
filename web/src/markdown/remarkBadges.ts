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
      for (const part of splitText(child.value, first)) {
        out.push(part.type === 'text' ? { type: 'text', value: part.value } : badgeNode(part));
      }
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
