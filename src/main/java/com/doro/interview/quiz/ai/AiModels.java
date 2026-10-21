package com.doro.interview.quiz.ai;

import com.anthropic.errors.AnthropicServiceException;
import com.google.genai.Client;
import com.google.genai.errors.ApiException;
import com.google.genai.types.HttpOptions;
import com.google.genai.types.HttpRetryOptions;
import org.springframework.ai.anthropic.AnthropicChatModel;
import org.springframework.ai.anthropic.AnthropicChatOptions;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.core.retry.RetryPolicy;
import org.springframework.core.retry.RetryTemplate;

/**
 * 설정({@link AiProperties})으로 Spring AI 채팅 모델을 **직접** 만든다(스타터의 자동 구성은 키가 없으면 기동이 실패하므로 쓰지 않는다).
 * 두 공급자 모두 재시도를 끈다: 시간 제한(기본 20초)과 한도를 우리가 정한 대로 지키고, 실패는 곧바로 "지금은 받을 수 없음"으로 돌려준다.
 */
final class AiModels {

    private AiModels() {
    }

    static ChatModel create(AiProperties props) {
        return switch (props.getProvider()) {
            case ANTHROPIC -> anthropic(props);
            case GEMINI -> gemini(props);
        };
    }

    private static ChatModel gemini(AiProperties props) {
        HttpOptions.Builder http = HttpOptions.builder().timeout((int) props.getTimeout().toMillis()).retryOptions(HttpRetryOptions.builder().attempts(1));
        if (!props.getBaseUrl().isBlank()) {
            http.baseUrl(props.getBaseUrl().replaceAll("/+$", ""));
        }
        Client client = Client.builder().apiKey(props.getApiKey()).httpOptions(http.build()).build();
        GoogleGenAiChatOptions options = GoogleGenAiChatOptions.builder().model(props.getModel()).maxOutputTokens(props.getMaxOutputTokens()).build();
        return GoogleGenAiChatModel.builder().genAiClient(client).options(options).retryTemplate(new RetryTemplate(RetryPolicy.withMaxRetries(0))).build();
    }

    private static ChatModel anthropic(AiProperties props) {
        AnthropicChatOptions options = AnthropicChatOptions.builder()
                .apiKey(props.getApiKey())
                .baseUrl(props.getBaseUrl().replaceAll("/+$", ""))
                .model(props.getModel())
                .maxTokens(props.getMaxOutputTokens())
                .timeout(props.getTimeout())
                .maxRetries(0)
                .build();
        return AnthropicChatModel.builder().options(options).build();
    }

    /** 공급자 SDK 예외에서 HTTP 상태 코드를 꺼낸다(없으면 null). 예외 메시지는 응답 본문이 섞일 수 있어 옮기지 않는다. */
    static Integer statusOf(Throwable e) {
        for (Throwable t = e; t != null; t = t.getCause()) {
            if (t instanceof AnthropicServiceException a) {
                return a.statusCode();
            }
            if (t instanceof ApiException g) {
                return g.code();
            }
        }
        return null;
    }
}
