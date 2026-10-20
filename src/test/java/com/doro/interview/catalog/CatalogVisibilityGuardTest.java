package com.doro.interview.catalog;

import com.doro.interview.InterviewApplication;
import com.doro.interview.support.IsolatedSchema;
import org.junit.jupiter.api.Test;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** 개발용 스위치(비공개 노출)는 운영(prod)에서 켜지면 기동을 거부한다(M1-PLAN D4). */
class CatalogVisibilityGuardTest {

    private static MockEnvironment env(String... profiles) {
        MockEnvironment e = new MockEnvironment();
        e.setActiveProfiles(profiles);
        return e;
    }

    @Test
    void prod에서_스위치를_켜면_거부한다() {
        assertThatThrownBy(() -> new CatalogVisibility(true, env("prod")))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("prod");
        assertThatThrownBy(() -> new CatalogVisibility(true, env("dev", "prod"))).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void prod에서도_스위치가_꺼져_있으면_정상이다() {
        assertThat(new CatalogVisibility(false, env("prod")).exposeUnpublished()).isFalse();
    }

    @Test
    void prod가_아니면_스위치를_켤_수_있다() {
        assertThat(new CatalogVisibility(true, env()).exposeUnpublished()).isTrue();
        assertThat(new CatalogVisibility(true, env("dev")).exposeUnpublished()).isTrue();
    }

    /** 실제 앱을 prod 프로파일 + 스위치 켬으로 띄우면 컨텍스트가 뜨지 않는다. */
    @Test
    void 앱이_prod_프로파일에서_스위치를_켠_채로는_기동하지_않는다() {
        String url = IsolatedSchema.createAndGetUrl();
        assertThatThrownBy(() -> new SpringApplicationBuilder(InterviewApplication.class)
                .web(WebApplicationType.NONE).profiles("prod")
                .properties("spring.datasource.url=" + url, "interview.catalog.expose-unpublished=true",
                        "interview.content.location=file:build/no-such-content/", "management.endpoints.enabled-by-default=false")
                .run())
                .hasStackTraceContaining("expose-unpublished=true 는 운영(prod) 프로파일에서 쓸 수 없다");
    }

    @Test
    void 앱이_prod_프로파일에서_스위치가_꺼져_있으면_기동한다() {
        String url = IsolatedSchema.createAndGetUrl();
        try (ConfigurableApplicationContext ctx = new SpringApplicationBuilder(InterviewApplication.class)
                .web(WebApplicationType.NONE).profiles("prod")
                .properties("spring.datasource.url=" + url, "interview.catalog.expose-unpublished=false",
                        "interview.content.location=file:build/no-such-content/")
                .run()) {
            assertThat(ctx.getBean(CatalogVisibility.class).exposeUnpublished()).isFalse();
        }
    }
}
