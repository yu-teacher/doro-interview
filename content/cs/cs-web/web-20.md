---
slug: "web-20"
topic: "cs-web"
tier: TRICKY
difficulty: 2
title: "웹소켓은 HTTP 폴링과 무엇이 다르고, 교차 출처 연결은 누가 막나요?"
keywords: ["Upgrade 핸드셰이크와 101", "Sec-WebSocket-Accept", "하나의 TCP 연결로 양방향", "폴링은 요청마다 헤더 오버헤드", "서버가 Origin 검사"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.rfc-editor.org/rfc/rfc6455.html", "https://www.rfc-editor.org/rfc/rfc9931.html"]
concepts: [http-protocol, web-security]
importance: 2
---
**모범 답변 (30~60초)**
폴링은 클라이언트가 주기적으로 HTTP 요청을 보내 변화를 묻는 방식이라 요청마다 HTTP 헤더가 붙고 서버가 클라이언트별로 여러 TCP 연결을 써야 합니다. 웹소켓은 일반 HTTP GET으로 시작해 Upgrade: websocket 헤더와 Sec-WebSocket-Key를 보내고, 서버가 101 Switching Protocols와 그 키로 계산한 Sec-WebSocket-Accept로 답하면 같은 TCP 연결이 양방향 메시지 통로로 바뀝니다. 이후에는 프레임 단위로 양쪽이 아무 때나 보낼 수 있고, Ping과 Pong으로 연결이 살아 있는지 확인할 수 있습니다. 중요한 점은 브라우저가 Origin 헤더를 실어 보낼 뿐이고 교차 출처를 받아줄지는 서버가 판단해야 한다는 것으로, 원치 않는 출처는 403으로 거절하라고 표준이 권고합니다.

```
키 dGhlIHNhbXBsZSBub25jZQ== 로 계산한 Accept 값 = s3pPLMBiTxaQ9kYGzzhZRbK+xOo=   (RFC 예시와 일치)
raw 소켓: GET /chat + Upgrade -> HTTP/1.1 101 Switching Protocols
  클라이언트->서버 텍스트 프레임("hello", 마스크됨): 헤더 6바이트 + 페이로드 5바이트
  최소한의 HTTP GET 요청(GET /p + Host 헤더만): 42바이트
  Ping('hi') 전송 -> 서버가 Pong('hi') 으로 응답
Chromium 156 WebSocket, 서버는 허용 Origin 외에 403
  페이지 출처 http://127.0.0.1:19101 -> 연결 성공, 에코 수신
  페이지 출처 http://127.0.0.1:19199 -> 서버가 403 으로 거절, 브라우저는 error
```

(공식 문서) RFC 6455 1.1은 폴링을 요청마다 HTTP 헤더가 붙고 서버가 클라이언트별로 여러 TCP 연결을 써야 하는 방식으로 설명하고, 웹소켓은 양방향 통신에 단일 TCP 연결을 쓴다고 한다. 1.2와 4절은 HTTP Upgrade 핸드셰이크를 보이며 서버가 101 Switching Protocols로 답한다고 하고, 1.3은 서버가 Sec-WebSocket-Key 에 GUID를 붙여 SHA-1과 base64로 만든 값을 Sec-WebSocket-Accept 로 돌려줘 핸드셰이크를 받았음을 증명하며 이것이 XMLHttpRequest나 폼으로 속이는 공격을 막는다고 한다. 5.5.2는 Ping을 받은 끝점이 Pong으로 응답해야 한다고 하고 연결 유지 용도로 쓸 수 있다고 한다. 10.2는 특정 사이트에서만 입력을 처리할 서버가 Origin을 검증하고 허용하지 않는 출처에는 403 Forbidden으로 응답해야(SHOULD) 한다고 하며 Origin은 브라우저가 악성 JavaScript로 핸드셰이크를 위조하지 못하게 하려는 장치라고 한다. RFC 9931 6.2는 핸드셰이크를 보낸 뒤 응답을 기다리기 전에 데이터를 보내면 안 된다는 점을 RFC 6455에서 인용한다.
(실험 확인) 위 블록은 Node v24.16.0 으로 만든 연습용 웹소켓 서버(내가 Node 로 프레임 최소 구현을 직접 작성)와 Playwright 1.64.1 번들 Chromium 156.0.8078.4 헤드리스로 얻었다. 서버가 허용 Origin만 통과시키는 규칙은 내 서버의 구현이다. 바이트 비교는 이 메시지 크기에서의 값이다.
