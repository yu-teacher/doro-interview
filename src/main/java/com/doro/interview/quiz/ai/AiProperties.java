package com.doro.interview.quiz.ai;

import java.time.Duration;

/**
 * AI 피드백 설정(docs/M6-PLAN.md). 기본은 꺼짐이고, 켜도 키가 없으면 쓰지 않는다. 키는 환경변수로만 받고 어디에도 기록하지 않는다.
 */
public class AiProperties {

    /** 공급자: 기본 Gemini(Google AI Studio 키), ANTHROPIC 도 지원한다. */
    public enum Provider { GEMINI, ANTHROPIC }

    private boolean enabled = false;
    private Provider provider = Provider.GEMINI;
    private String apiKey = "";
    /** 비워 두면 공급자의 기본 주소(시험에서는 가짜 서버 주소를 넣는다). */
    private String baseUrl = "";
    /** 공급자가 정한 모델 이름 그대로(예: gemini-2.5-flash, claude-haiku-5-5). 비워 두면 공급자의 기본 모델. */
    private String model = "";
    private int perUserPerDay = 10;
    private int globalPerDay = 100;
    private Duration timeout = Duration.ofSeconds(20);
    private int maxOutputTokens = 500;

    public Provider getProvider() { return provider; }
    public void setProvider(Provider provider) { this.provider = provider; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey == null ? "" : apiKey; }
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl == null ? "" : baseUrl; }
    public String getModel() { return model.isBlank() ? (provider == Provider.GEMINI ? "gemini-2.5-flash" : "claude-haiku-5-5") : model; }
    public void setModel(String model) { this.model = model == null ? "" : model; }
    public int getPerUserPerDay() { return perUserPerDay; }
    public void setPerUserPerDay(int perUserPerDay) { this.perUserPerDay = perUserPerDay; }
    public int getGlobalPerDay() { return globalPerDay; }
    public void setGlobalPerDay(int globalPerDay) { this.globalPerDay = globalPerDay; }
    public Duration getTimeout() { return timeout; }
    public void setTimeout(Duration timeout) { this.timeout = timeout; }
    public int getMaxOutputTokens() { return maxOutputTokens; }
    public void setMaxOutputTokens(int maxOutputTokens) { this.maxOutputTokens = maxOutputTokens; }

    /** 켜져 있고 키가 있을 때만 쓸 수 있다. */
    public boolean usable() {
        return enabled && !apiKey.isBlank();
    }
}
