import bash from 'highlight.js/lib/languages/bash';
import groovy from 'highlight.js/lib/languages/groovy';
import java from 'highlight.js/lib/languages/java';
import yaml from 'highlight.js/lib/languages/yaml';
import type { ComponentProps } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { Badge } from './Badge';
import type { BadgeKind } from './badges';
import { remarkBadges } from './remarkBadges';

/**
 * 질문 본문 렌더러(docs/M1-PLAN.md D6). **원시 HTML 을 해석하지 않는다**(rehype-raw 를 쓰지 않으므로 `<script>` 나 `<T>` 는 글자로 보인다).
 * 코드 블록은 java·yaml·bash·groovy 만 하이라이트하고 나머지(text 등)는 그대로 둔다.
 */
const LANGUAGES = { java, yaml, bash, groovy };
const REHYPE = [[rehypeHighlight, { languages: LANGUAGES, detect: false, plainText: ['text', 'txt'], ignoreMissing: true }]] as const;

type SpanProps = ComponentProps<'span'> & { 'data-badge'?: BadgeKind };

const components = {
  span({ children, ...props }: SpanProps) {
    const kind = props['data-badge'];
    return kind ? <Badge kind={kind}>{children}</Badge> : <span {...props}>{children}</span>;
  },
  pre({ children }: ComponentProps<'pre'>) {
    // 가로로 넘치는 코드는 이 영역 안에서만 스크롤한다(페이지가 옆으로 밀리지 않게). 키보드로도 스크롤할 수 있게 포커스를 받는다.
    return (
      <pre
        tabIndex={0}
        aria-label="코드"
        className="my-3 max-w-full overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm leading-6"
      >
        {children}
      </pre>
    );
  },
  code({ className, children, ...props }: ComponentProps<'code'>) {
    const block = typeof className === 'string' && /\b(language-|hljs)/.test(className);
    return (
      <code
        {...props}
        className={block ? className : 'rounded bg-[var(--color-surface)] px-1 text-[0.95em] ' + (className ?? '')}
      >
        {children}
      </code>
    );
  },
  a({ href, children }: ComponentProps<'a'>) {
    const external = typeof href === 'string' && /^https?:\/\//.test(href);
    return (
      <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    );
  },
  ul({ children }: ComponentProps<'ul'>) {
    return <ul className="my-2 list-disc space-y-1 pl-6">{children}</ul>;
  },
  ol({ children }: ComponentProps<'ol'>) {
    return <ol className="my-2 list-decimal space-y-1 pl-6">{children}</ol>;
  },
  p({ children }: ComponentProps<'p'>) {
    return <p className="my-2 leading-7">{children}</p>;
  },
};

export function Markdown({ source }: { source: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkBadges]} rehypePlugins={REHYPE as never} components={components}>
      {source}
    </ReactMarkdown>
  );
}
