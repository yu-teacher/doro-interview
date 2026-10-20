package com.doro.interview.quiz.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.ObjectMapper;

/** AI 피드백 설정과 공급자. 켜져 있고 키가 있을 때만 실제 공급자를 만든다(docs/M6-PLAN.md §2). */
@Configuration
class AiConfig {

    @Bean
    @ConfigurationProperties(prefix = "interview.ai")
    AiProperties aiProperties() {
        return new AiProperties();
    }

    @Bean
    FeedbackProvider feedbackProvider(AiProperties props, ObjectMapper json) {
        return props.usable() ? new AnthropicFeedbackProvider(props, json) : new DisabledFeedbackProvider();
    }
}
