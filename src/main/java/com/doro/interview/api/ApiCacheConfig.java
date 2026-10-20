package com.doro.interview.api;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.filter.ShallowEtagHeaderFilter;

import java.io.IOException;

/**
 * API 응답 캐시 정책: 항상 재검증(`no-cache`)하고, 본문 해시로 ETag 를 만들어 변하지 않았으면 304 로 답한다.
 * ETag 를 본문에서 만들기 때문에 응답에 들어가는 모든 것(출처·개념·연결·필수도 …)의 변화가 빠짐없이 반영된다.
 */
@Configuration
public class ApiCacheConfig {

    @Bean
    FilterRegistrationBean<ShallowEtagHeaderFilter> apiEtagFilter() {
        FilterRegistrationBean<ShallowEtagHeaderFilter> bean = new FilterRegistrationBean<>(new ShallowEtagHeaderFilter());
        bean.addUrlPatterns("/api/*");
        bean.setOrder(10);
        return bean;
    }

    @Bean
    FilterRegistrationBean<OncePerRequestFilter> apiCacheControlFilter() {
        FilterRegistrationBean<OncePerRequestFilter> bean = new FilterRegistrationBean<>(new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                    throws ServletException, IOException {
                if ("GET".equals(request.getMethod())) {
                    response.setHeader("Cache-Control", "no-cache");
                }
                chain.doFilter(request, response);
            }
        });
        bean.addUrlPatterns("/api/*");
        bean.setOrder(5);
        return bean;
    }
}
