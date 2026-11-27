package com.doro.interview.reminder;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
class ReminderConfig {

    @Bean
    @ConfigurationProperties(prefix = "interview.reminder")
    ReminderProperties reminderProperties() {
        return new ReminderProperties();
    }
}
