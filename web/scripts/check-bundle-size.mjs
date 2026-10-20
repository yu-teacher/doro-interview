#!/usr/bin/env node
// 빌드 결과(dist/)의 번들 크기 예산을 검사한다(docs/M1-PLAN.md S6). 모바일에서 첫 화면이 무거워지지 않게 한다.
//   - 첫 화면 JS(index.html 이 불러오는 스크립트들): gzip 150KB 이하
//   - 지연 로딩 조각 하나: gzip 120KB 이하
// 사용: npm run build && node scripts/check-bundle-size.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = join(process.cwd(), 'dist');
const ENTRY_BUDGET = 150 * 1024;
const CHUNK_BUDGET = 120 * 1024;

const gz = (file) => gzipSync(readFileSync(join(DIST, 'assets', file))).length;
const kb = (n) => (n / 1024).toFixed(1) + 'KB';

const html = readFileSync(join(DIST, 'index.html'), 'utf-8');
const entryFiles = [...html.matchAll(/(?:src|href)="[^"]*\/assets\/([^"]+\.js)"/g)].map((m) => m[1]);
if (entryFiles.length === 0) {
  console.error('index.html 에서 진입 스크립트를 찾지 못했다. 먼저 npm run build 를 실행한다.');
  process.exit(2);
}
const jsFiles = readdirSync(join(DIST, 'assets')).filter((f) => f.endsWith('.js'));
const lazyFiles = jsFiles.filter((f) => !entryFiles.includes(f));

let failed = false;
const entrySize = entryFiles.reduce((sum, f) => sum + gz(f), 0);
console.log(`첫 화면 JS: ${kb(entrySize)} (예산 ${kb(ENTRY_BUDGET)})`);
if (entrySize > ENTRY_BUDGET) {
  console.error('  초과: 첫 화면 JS 가 예산을 넘었다.');
  failed = true;
}
for (const f of lazyFiles) {
  const size = gz(f);
  console.log(`지연 조각 ${f}: ${kb(size)} (예산 ${kb(CHUNK_BUDGET)})`);
  if (size > CHUNK_BUDGET) {
    console.error('  초과: 지연 조각이 예산을 넘었다.');
    failed = true;
  }
}
if (lazyFiles.length === 0) {
  console.error('지연 로딩 조각이 없다: 마크다운 렌더러가 첫 화면에 들어갔을 수 있다.');
  failed = true;
}
process.exit(failed ? 1 : 0);
