import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { Page } from '@playwright/test';

const require = createRequire(import.meta.url);
const AXE_SOURCE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf-8');

/**
 * 실제 브라우저에서 레이아웃 문제를 잰다. 문제가 없으면 빈 배열. 규칙:
 * - 페이지가 가로로 스크롤되지 않는다(스크롤 가능한 영역 밖에서 뷰포트 오른쪽을 넘는 요소도 문제).
 * - overflow:hidden 으로 글이 잘리지 않는다.
 * - 누를 수 있는 요소(버튼·입력·선택·요약)는 가로·세로 44px 이상, 링크는 높이 44px 이상(너비 24px 이상). 문장 속 인라인 링크는 제외.
 * - 입력 글꼴은 16px 이상(iOS 가 입력할 때 화면을 확대하지 않도록).
 */
export async function auditLayout(page: Page): Promise<string[]> {
  // 기준 너비는 브라우저가 알려 주는 innerWidth 가 아니라 테스트가 지정한 뷰포트 너비다. 모바일 Chromium 은 내용이 넘치면
  // 레이아웃 뷰포트를 넓혀(축소해서 보여 주며) innerWidth 를 같이 키워서, innerWidth 를 기준으로 하면 넘침이 가려진다.
  const viewportWidth = page.viewportSize()?.width;
  if (viewportWidth === undefined) {
    throw new Error('뷰포트 크기를 알 수 없다');
  }
  return page.evaluate((vw) => {
    const problems: string[] = [];
    const describe = (el: Element): string => {
      const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 24);
      const id = el.id ? `#${el.id}` : '';
      const cls = typeof (el as HTMLElement).className === 'string' ? (el as HTMLElement).className.split(' ').slice(0, 2).join('.') : '';
      return `${el.tagName.toLowerCase()}${id}${cls ? '.' + cls : ''}「${text}」`;
    };
    const visible = (el: Element): boolean => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && cs.display !== 'none';
    };
    const inScroller = (el: Element): boolean => {
      for (let p = el.parentElement; p; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === 'auto' || ox === 'scroll') {
          return true;
        }
      }
      return false;
    };

    const doc = document.documentElement;
    if (doc.scrollWidth > vw + 1) {
      problems.push(`가로 스크롤이 생긴다: scrollWidth ${doc.scrollWidth} > 뷰포트 ${vw}`);
    }

    const all = Array.from(document.body.querySelectorAll('*'));
    let outside = 0;
    for (const el of all) {
      if (!visible(el) || inScroller(el)) {
        continue;
      }
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && outside++ < 5) {
        problems.push(`뷰포트 오른쪽을 넘는다(${Math.round(r.right)} > ${vw}): ${describe(el)}`);
      }
      const cs = getComputedStyle(el);
      if ((cs.overflowX === 'hidden' || cs.overflowX === 'clip') && el.scrollWidth > el.clientWidth + 1 && (el.textContent ?? '').trim()) {
        problems.push(`글이 잘린다(scrollWidth ${el.scrollWidth} > ${el.clientWidth}): ${describe(el)}`);
      }
    }

    const targets = Array.from(document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button]'));
    for (const el of targets) {
      if (!visible(el)) {
        continue;
      }
      const cs = getComputedStyle(el);
      const isLink = el.tagName === 'A';
      const isCheckbox = el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio');
      // 체크박스는 감싼 label 이 누르는 영역이다
      const box = (isCheckbox ? (el.closest('label') ?? el) : el).getBoundingClientRect();
      if (isLink && cs.display === 'inline') {
        const parent = el.parentElement;
        const sentence = parent && (parent.tagName === 'P' || parent.tagName === 'LI') && (parent.textContent ?? '').trim() !== (el.textContent ?? '').trim();
        if (sentence) {
          continue;
        }
      }
      const okHeight = box.height >= 43.5;
      const okWidth = isLink ? box.width >= 24 : box.width >= 43.5;
      if (!okHeight || !okWidth) {
        problems.push(`누르는 영역이 작다(${Math.round(box.width)}x${Math.round(box.height)}): ${describe(el)}`);
      }
      if ((el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') && !isCheckbox && parseFloat(cs.fontSize) < 16) {
        problems.push(`입력 글꼴이 16px 미만(${cs.fontSize}): ${describe(el)}`);
      }
    }
    return problems;
  }, viewportWidth);
}

/** 실제 브라우저에서 axe(색 대비 포함 전체 규칙)를 돌려 위반을 문자열로 돌려준다. */
export async function auditAxe(page: Page): Promise<string[]> {
  // addScriptTag 는 인라인 스크립트라 CSP(script-src 'self')에 막힌다. CSP 를 우회(bypassCSP)하면 CSP 시험의 의미가 없어지므로,
  // 개발자 도구 프로토콜의 평가(CSP 대상이 아니다)로 axe 소스를 한 번 실행해 전역 axe 를 만든다.
  if (!(await page.evaluate(() => 'axe' in window))) {
    await page.evaluate(AXE_SOURCE);
  }
  return page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (ctx: Document, opts: object) => Promise<{ violations: { id: string; help: string; nodes: { target: string[] }[] }[] }> } }).axe;
    const result = await axe.run(document, {});
    const violations = result.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')})`);
    return violations.concat(nonTextContrast());

    /**
     * 글자가 아닌 요소의 대비(WCAG 1.4.11, 3:1). axe 는 이것을 재지 않는다: 진도 막대의 채워진 부분이 바탕(트랙)과 3:1 이상 달라야
     * 색을 구분하는 사람이 진도를 읽을 수 있다. 숫자(n/m)도 함께 있지만 막대 자체도 기준을 지킨다.
     */
    function nonTextContrast(): string[] {
      const rgb = (css: string): number[] | null => {
        const m = css.match(/rgba?\(([^)]+)\)/);
        if (!m) {
          return null;
        }
        const parts = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
        return parts.length >= 3 ? parts.slice(0, 3) : null;
      };
      const lum = ([r, g, b]: number[]): number => {
        const f = (c: number) => ((c / 255) <= 0.03928 ? c / 255 / 12.92 : (((c / 255) + 0.055) / 1.055) ** 2.4);
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const problems: string[] = [];
      for (const bar of Array.from(document.querySelectorAll('[role=progressbar]'))) {
        const fill = bar.firstElementChild;
        if (!fill) {
          continue;
        }
        const track = rgb(getComputedStyle(bar).backgroundColor);
        const fg = rgb(getComputedStyle(fill).backgroundColor);
        if (!track || !fg) {
          problems.push(`non-text-contrast: 진도 막대의 색을 읽지 못했다 (${bar.getAttribute('aria-label')})`);
          continue;
        }
        const [a, b] = [lum(track), lum(fg)];
        const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        if (ratio < 3) {
          problems.push(`non-text-contrast: 진도 막대 채움과 바탕의 대비 ${ratio.toFixed(2)}:1 < 3:1 (${bar.getAttribute('aria-label')})`);
        }
      }
      return problems;
    }
  });
}
