// jsdom 은 window.scrollTo 를 구현하지 않아 호출할 때마다 오류를 낸다. 시험에서는 아무 일도 하지 않게 한다.
if (typeof window !== 'undefined') {
  window.scrollTo = () => undefined;
}
