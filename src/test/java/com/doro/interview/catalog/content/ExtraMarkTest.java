package com.doro.interview.catalog.content;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** has_extra 정의: 코드 블록·인라인 코드 밖에 (보충) 이 있다. */
class ExtraMarkTest {

    @Test
    void 산문의_표기는_센다() {
        assertThat(ExtraMark.present("**모범 답변**\n답.\n\n(보충) 덧붙임.\n")).isTrue();
        assertThat(ExtraMark.present("**모범 답변**\n답. 이름은 (보충)이며 확인하지 않았다.\n")).isTrue();
        assertThat(ExtraMark.present("- (보충) 글머리\n")).isTrue();
    }

    @Test
    void 코드_블록_안의_표기는_세지_않는다() {
        assertThat(ExtraMark.present("답.\n\n```yaml\n# application.yml (보충): x\n```\n")).isFalse();
        assertThat(ExtraMark.present("답.\n\n   ```java\n// (보충)\n   ```\n")).isFalse();
    }

    @Test
    void 인라인_코드_안의_표기는_세지_않는다() {
        assertThat(ExtraMark.present("답. `(보충)` 은 코드다.\n")).isFalse();
    }

    @Test
    void 코드_밖에_또_있으면_센다() {
        assertThat(ExtraMark.present("답.\n\n```yaml\n# (보충)\n```\n\n(보충) 코드 밖.\n")).isTrue();
    }

    @Test
    void 표기가_없으면_아니다() {
        assertThat(ExtraMark.present("**모범 답변**\n답.\n\n(공식 문서) 근거.\n")).isFalse();
        assertThat(ExtraMark.present("(보충 설명) 이건 표기가 아니다.\n")).isFalse();
        assertThat(ExtraMark.present("")).isFalse();
    }

    @Test
    void CRLF도_같다() {
        assertThat(ExtraMark.present("답.\r\n\r\n```\r\n(보충)\r\n```\r\n")).isFalse();
        assertThat(ExtraMark.present("답.\r\n\r\n(보충) 밖.\r\n")).isTrue();
    }
}
