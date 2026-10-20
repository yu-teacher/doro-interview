import axe from 'axe-core';

/**
 * 접근성 구조 검사(axe-core, jsdom). 랜드마크·제목·이름·ARIA 같은 **구조**를 본다.
 * 색 대비는 jsdom 이 색을 계산하지 못해 여기서 끄고, 실제 브라우저 시험(S8)에서 따로 잰다.
 */
export async function a11yViolations(root: Element = document.body): Promise<string[]> {
  document.documentElement.lang = 'ko';
  const result = await axe.run(root, { rules: { 'color-contrast': { enabled: false } } });
  return result.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(' | ')})`);
}
