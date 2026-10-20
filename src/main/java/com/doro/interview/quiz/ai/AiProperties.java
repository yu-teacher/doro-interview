package com.doro.interview.quiz.ai;

import java.time.Duration;

/**
 * AI 피드백 설정(docs/M6-PLAN.md). 기본은 꺼짐이고, 켜도 키가 없으면 쓰지 않는다. 키는 환경변수로만 받고 어디에도 기록하지 않는다.
 */
public class AiProperties {

    private boolean enabled = false;
    private String apiKey = "";
    private String baseUrl = "https://api.anthropic.com";
    private String model = "claude-haiku-5-5";
    private int perUserPerDay = 20;
    private int globalPerDay = 200;
    private Duration timeout = Duration.ofSeconds(20);
    private int maxOutputTokens = 500;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey == null ? "" : apiKey; }
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
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
