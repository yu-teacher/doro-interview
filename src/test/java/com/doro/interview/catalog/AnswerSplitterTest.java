package com.doro.interview.catalog;

import com.doro.interview.catalog.AnswerSplitter.Split;
import com.doro.interview.catalog.content.ContentModels.ContentSet;
import com.doro.interview.catalog.content.ContentModels.QuestionDoc;
import com.doro.interview.catalog.content.ContentParser;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AnswerSplitterTest {

    private static final String HEADER = "**모범 답변 (30~60초)**";

    @Test
    void 헤더_다음_첫_문단이_답변이고_나머지가_상세다() {
        Split s = AnswerSplitter.split(HEADER + "\n말로 하는 답변입니다.\n\n(공식 문서) 근거 줄.\n(보충) 덧붙임.\n");
        assertThat(s.spokenAnswer()).isEqualTo("말로 하는 답변입니다.");
        assertThat(s.detailMd()).isEqualTo("(공식 문서) 근거 줄.\n(보충) 덧붙임.");
    }

    @Test
    void 근거가_없으면_상세는_비어_있다() {
        Split s = AnswerSplitter.split(HEADER + "\n답변만 있다.\n");
        assertThat(s.spokenAnswer()).isEqualTo("답변만 있다.");
        assertThat(s.detailMd()).isEmpty();
    }

    @Test
    void 상세의_코드_블록은_빈_줄이_있어도_그대로_보존된다() {
        String detail = "```java\nclass A {\n\n    void f() {}\n}\n```\n\n- (보충) 설명";
        Split s = AnswerSplitter.split(HEADER + "\n답변.\n\n" + detail + "\n");
        assertThat(s.spokenAnswer()).isEqualTo("답변.");
        assertThat(s.detailMd()).isEqualTo(detail);
    }

    @Test
    void 답변_문단이_여러_줄이어도_한_문단으로_묶는다() {
        Split s = AnswerSplitter.split(HEADER + "\n첫 줄\n둘째 줄\n\n상세\n");
        assertThat(s.spokenAnswer()).isEqualTo("첫 줄\n둘째 줄");
        assertThat(s.detailMd()).isEqualTo("상세");
    }

    @Test
    void 헤더가_없으면_첫_문단을_답변으로_본다() {
        Split s = AnswerSplitter.split("헤더 없는 답변.\n\n상세.\n");
        assertThat(s.spokenAnswer()).isEqualTo("헤더 없는 답변.");
        assertThat(s.detailMd()).isEqualTo("상세.");
    }

    @Test
    void 답변이_코드로_시작하면_답변은_비고_전부_상세다() {
        Split s = AnswerSplitter.split(HEADER + "\n```java\nclass A {}\n```\n");
        assertThat(s.spokenAnswer()).isEmpty();
        assertThat(s.detailMd()).startsWith("```java");
    }

    @Test
    void CRLF와_앞뒤_빈_줄이_있어도_같은_결과다() {
        Split s = AnswerSplitter.split("\r\n" + HEADER + "\r\n\r\n답변.\r\n\r\n상세.\r\n\r\n");
        assertThat(s.spokenAnswer()).isEqualTo("답변.");
        assertThat(s.detailMd()).isEqualTo("상세.");
    }

    @Test
    void 빈_본문은_둘_다_비어_있다() {
        Split s = AnswerSplitter.split("  \n");
        assertThat(s.spokenAnswer()).isEmpty();
        assertThat(s.detailMd()).isEmpty();
    }

    /** 코퍼스 전체: 모든 질문이 분리되고, 헤더 + 답변 + 상세를 이으면 원문과 같다(분리가 내용을 잃지 않는다). */
    @Test
    void 실제_콘텐츠_전부가_손실_없이_분리된다() {
        ContentSet set = new ContentParser().parse("classpath:content/");
        assertThat(set.questions()).isNotEmpty();
        for (QuestionDoc q : set.questions()) {
            Split s = AnswerSplitter.split(q.body());
            assertThat(s.spokenAnswer()).as(q.slug() + " 답변").isNotBlank().doesNotContain("\n\n");
            String rebuilt = HEADER + "\n" + s.spokenAnswer() + (s.detailMd().isEmpty() ? "" : "\n\n" + s.detailMd());
            assertThat(rebuilt).as(q.slug() + " 재구성").isEqualTo(q.body().strip());
        }
    }
}
