package com.doro.interview.support;

import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * 가짜 플랫폼 알림 서비스(doro-notify). 받은 요청을 기록하고, 경로마다 진짜와 같은 모양의 성공 응답을 준다.
 * {@link #failWith(int)} 로 모든 응답을 실패로 바꾸고, {@link #stop()} 으로 닿지 않게 만든다.
 */
public final class FakeNotify {

    public static final String TOKEN = "interview-notify-test-token-" + "n".repeat(32);

    /** 받은 요청 하나. */
    public record Request(String method, String path, String token, String userAgent, String body) {
    }

    private final HttpServer server;
    private final List<Request> requests = new CopyOnWriteArrayList<>();
    private volatile int forcedStatus = 0;

    public FakeNotify() {
        try {
            server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
        server.createContext("/", exchange -> {
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            String path = exchange.getRequestURI().getRawPath();
            String token = exchange.getRequestHeaders().getFirst("X-Doro-Service-Token");
            requests.add(new Request(exchange.getRequestMethod(), path, token, exchange.getRequestHeaders().getFirst("User-Agent"), body));
            int code;
            String reply;
            if (forcedStatus != 0) {
                code = forcedStatus;
                reply = "{\"success\":false,\"code\":\"FAKE\",\"message\":\"가짜 실패\"}";
            } else if (!path.equals("/api/v1/notify/config") && !TOKEN.equals(token)) {
                code = 401;
                reply = "{\"success\":false,\"code\":\"AUTH-401\"}";
            } else {
                code = 200;
                reply = "{\"success\":true,\"data\":" + data(exchange.getRequestMethod(), path) + "}";
            }
            byte[] bytes = reply.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(code, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
    }

    private static String data(String method, String path) {
        if (path.equals("/api/v1/notify/config")) {
            return "{\"enabled\":true,\"publicKey\":\"BFakePublicKey\"}";
        }
        if (path.equals("/internal/v1/notifications")) {
            return "{\"outcome\":\"ACCEPTED\",\"accepted\":1}";
        }
        if (path.endsWith("/test")) {
            return "{\"devices\":2,\"delivered\":1}";
        }
        return "{}";
    }

    public String url() {
        return "http://127.0.0.1:" + server.getAddress().getPort();
    }

    public List<Request> requests() {
        return List.copyOf(requests);
    }

    public List<Request> requests(String method, String pathPrefix) {
        return requests.stream().filter(r -> r.method().equals(method) && r.path().startsWith(pathPrefix)).toList();
    }

    public void reset() {
        requests.clear();
        forcedStatus = 0;
    }

    public void failWith(int status) {
        forcedStatus = status;
    }

    public void stop() {
        server.stop(0);
    }
}
