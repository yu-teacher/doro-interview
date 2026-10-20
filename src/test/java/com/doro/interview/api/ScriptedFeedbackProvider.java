package com.doro.interview.api;

import com.doro.interview.quiz.ai.FeedbackProvider;
import com.doro.interview.quiz.ai.FeedbackUnavailableException;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;

/** 시험용 공급자: 호출 수와 받은 요청을 기록하고, 실패·지연을 흉내 낸다. */
public class ScriptedFeedbackProvider implements FeedbackProvider {

    public final AtomicInteger calls = new AtomicInteger();
    public final List<Request> requests = new CopyOnWriteArrayList<>();
    public volatile boolean fail = false;
    public volatile long delayMs = 0;
    public volatile boolean available = true;

    public void reset() {
        calls.set(0);
        requests.clear();
        fail = false;
        delayMs = 0;
        available = true;
    }

    @Override
    public boolean available() {
        return available;
    }

    @Override
    public String model() {
        return "scripted-model";
    }

    @Override
    public String feedback(Request request) throws FeedbackUnavailableException {
        calls.incrementAndGet();
        requests.add(request);
        if (delayMs > 0) {
            try {
                Thread.sleep(delayMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        if (fail) {
            throw new FeedbackUnavailableException("scripted failure with secret-detail");
        }
        return "피드백: " + request.answer();
    }
}
