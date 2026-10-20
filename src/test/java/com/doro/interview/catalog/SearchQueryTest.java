package com.doro.interview.catalog;

import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SearchQueryTest {

    private static void assertInvalid(String raw, Integer limit, String messagePart) {
        assertThatThrownBy(() -> SearchQuery.parse(raw, limit))
                .isInstanceOfSatisfying(InterviewException.class, e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.INVALID_SEARCH_QUERY))
                .hasMessageContaining(messagePart);
    }

    @Test
    void 공백으로_단어를_나누고_연속_공백과_앞뒤_공백을_정리한다() {
        SearchQuery q = SearchQuery.parse("  트랜잭션   전파\t속성  ", null);
        assertThat(q.words()).containsExactly("트랜잭션", "전파", "속성");
        assertThat(q.limit()).isEqualTo(30);
    }

    @Test
    void 대소문자만_다른_같은_단어는_한_번만_센다() {
        assertThat(SearchQuery.parse("Proxy proxy PROXY 프록시", null).words()).containsExactly("Proxy", "프록시");
    }

    @Test
    void 제어_문자는_공백으로_취급한다() {
        assertThat(SearchQuery.parse("a\u0000b\nc", null).words()).containsExactly("a", "b", "c");
    }

    @Test
    void 비어_있거나_공백뿐이면_거부한다() {
        assertInvalid(null, null, "입력");
        assertInvalid("", null, "입력");
        assertInvalid("   \t ", null, "입력");
        assertInvalid("\u0000\u0001", null, "입력");
    }

    @Test
    void 단어_개수_상한은_5개다() {
        assertThat(SearchQuery.parse("a b c d e", null).words()).hasSize(5);
        assertInvalid("a b c d e f", null, "5개");
    }

    @Test
    void 단어_길이_상한은_50자다() {
        assertThat(SearchQuery.parse("가".repeat(50), null).words()).hasSize(1);
        assertInvalid("가".repeat(51), null, "50자");
    }

    @Test
    void 전체_길이_상한은_100자다() {
        String ok = "가".repeat(50) + " " + "나".repeat(49); // 100자
        assertThat(SearchQuery.parse(ok, null).words()).hasSize(2);
        assertInvalid("가".repeat(50) + " " + "나".repeat(50), null, "100자");
    }

    @Test
    void limit는_1에서_100까지다() {
        assertThat(SearchQuery.parse("a", 1).limit()).isEqualTo(1);
        assertThat(SearchQuery.parse("a", 100).limit()).isEqualTo(100);
        assertInvalid("a", 0, "limit");
        assertInvalid("a", 101, "limit");
        assertInvalid("a", -5, "limit");
    }

    @Test
    void LIKE_특수문자는_이스케이프된다() {
        assertThat(SearchQuery.escapeLike("100%")).isEqualTo("100\\%");
        assertThat(SearchQuery.escapeLike("a_c")).isEqualTo("a\\_c");
        assertThat(SearchQuery.escapeLike("a\\b")).isEqualTo("a\\\\b");
        assertThat(SearchQuery.escapeLike("plain")).isEqualTo("plain");
    }

    @Test
    void 패턴은_양쪽에_퍼센트를_붙이고_단어_순서를_유지한다() {
        assertThat(SearchQuery.parse("a_c 50%", null).likePatterns()).containsExactly("%a\\_c%", "%50\\%%");
    }

    @Test
    void 따옴표와_세미콜론은_그냥_글자다() {
        SearchQuery q = SearchQuery.parse("'; drop table question; --", null);
        assertThat(q.words()).containsExactly("';", "drop", "table", "question;", "--");
    }
}
