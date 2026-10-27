// 서비스 워커는 DOM 타입(vite/client)을 쓰지 않고 별도로 컴파일한다. 번들러가 값으로 바꿔 넣는 변수만 선언한다.
interface ImportMeta {
  /** Vite `base`(끝 슬래시 포함). 빌드 때 VITE_BASE_PATH 로 정해진다. */
  readonly env: { readonly BASE_URL: string };
}
