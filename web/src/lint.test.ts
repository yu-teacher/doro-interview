import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

/** 저장소의 린트 규칙이 실제로 위반을 잡는지 확인한다(규칙을 지워도 초록인 "항상 통과" 상태를 막는다). */
const eslint = new ESLint({ cwd: process.cwd(), overrideConfigFile: 'eslint.config.js' });

async function messages(code: string, file = 'src/probe.tsx'): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: file });
  return result.messages.map((m) => m.message);
}

describe('lint 규칙', () => {
  it('dangerouslySetInnerHTML 을 금지한다', async () => {
    const out = await messages('export const A = () => <div dangerouslySetInnerHTML={{ __html: "x" }} />;');
    expect(out.some((m) => m.includes('dangerouslySetInnerHTML'))).toBe(true);
  });

  it('any 를 금지한다', async () => {
    const out = await messages('export const x: any = 1;', 'src/probe.ts');
    expect(out.some((m) => m.includes('any'))).toBe(true);
  });

  it('빈 catch 블록을 금지한다', async () => {
    const out = await messages('try { f(); } catch (e) {}\nfunction f() {}', 'src/probe.ts');
    expect(out.length).toBeGreaterThan(0);
  });

  it('console.log 를 금지하되 console.error 는 허용한다', async () => {
    expect((await messages('console.log(1);', 'src/probe.ts')).length).toBeGreaterThan(0);
    expect(await messages('console.error(1);', 'src/probe.ts')).toEqual([]);
  });

  it('location.reload 를 금지한다', async () => {
    const out = await messages('window.location.reload();', 'src/probe.ts');
    expect(out.some((m) => m.includes('reload'))).toBe(true);
  });

  it('정상 코드는 통과한다', async () => {
    expect(await messages('export const A = () => <div>안녕</div>;')).toEqual([]);
  });
});
