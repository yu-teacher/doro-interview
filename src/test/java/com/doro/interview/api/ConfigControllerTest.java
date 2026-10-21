package com.doro.interview.api;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** 측정 ID 형식 검증: 잘못된 값은 없는 것으로 본다(스크립트 주소에 섞이지 않게). */
class ConfigControllerTest {

    private static String id(String configured) {
        return new ConfigController(configured).config().data().analyticsId();
    }

    @Test
    void 형식이_맞는_것만_쓴다() {
        assertThat(id("G-ABCD1234")).isEqualTo("G-ABCD1234");
        assertThat(id("  G-ABCD1234  ")).isEqualTo("G-ABCD1234");
        for (String bad : new String[]{"", "   ", null, "UA-12345-1", "g-abcd1234", "G-", "G-AB", "G-ABCD1234&x=1", "G-ABCD1234\"><script>", "G-ABCD 1234", "https://evil.example/x.js", "G-" + "A".repeat(21)}) {
            assertThat(id(bad)).as(String.valueOf(bad)).isNull();
        }
    }
}
