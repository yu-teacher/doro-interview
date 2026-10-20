import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

// 워크스페이스 공통 엔지니어링 룰(AGENTS.md)을 린트로 강제한다.
export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['src/**/*.{ts,tsx}', 'sw/**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { globals: { ...globals.browser, ...globals.serviceworker } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // 타입 에러 회피 금지: any / @ts-ignore / eslint-disable 로 무마하지 않는다
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      // 예외 은폐 금지: 빈 catch 블록 금지
      'no-empty': ['error', { allowEmptyCatch: false }],
      // 표준 로거 사용: console.log/debug/info 금지 (오류/경고 보고용 console.error/warn 만 허용)
      'no-console': ['error', { allow: ['error', 'warn'] }],
      // 새로고침 편법 금지
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.property.name='location'][callee.property.name='reload']",
          message: '상태 불일치를 location.reload() 로 때우지 말고 상태를 동기화한다.',
        },
        {
          // 본문 마크다운은 원시 HTML 을 해석하지 않는 렌더러로만 그린다(docs/M1-PLAN.md D6). HTML 문자열을 DOM 에 직접 넣지 않는다.
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'dangerouslySetInnerHTML 은 쓰지 않는다. 마크다운은 Markdown 컴포넌트로 그린다.',
        },
      ],
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}'],
    rules: { 'no-console': 'off' },
  }
);
