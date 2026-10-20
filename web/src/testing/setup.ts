// jsdom 은 window.scrollTo 를 구현하지 않아 호출할 때마다 오류를 낸다. 시험에서는 아무 일도 하지 않게 한다.
if (typeof window !== 'undefined') {
  window.scrollTo = () => undefined;
}

// jsdom 은 <dialog> 의 showModal/close 를 구현하지 않는다. 열림 상태(open 속성)와 close 이벤트만 흉내 낸다.
if (typeof HTMLDialogElement !== 'undefined') {
  const proto = HTMLDialogElement.prototype as unknown as { showModal?: () => void; close?: () => void };
  if (!proto.showModal) {
    proto.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
  }
  if (!proto.close) {
    proto.close = function close(this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  }
}
