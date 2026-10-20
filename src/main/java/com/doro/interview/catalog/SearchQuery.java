package com.doro.interview.catalog;

import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * 검증·정규화를 마친 검색 요청(docs/M1-PLAN.md S3). 공백으로 나눈 단어 ≤ 5개, 단어당 ≤ 50자, 전체 ≤ 100자.
 * 같은 단어(대소문자 무시)는 한 번만 센다. {@code words} 는 입력 순서를 유지한다.
 */
public record SearchQuery(List<String> words, int limit) {

    public static final int DEFAULT_LIMIT = 30;
    public static final int MAX_LIMIT = 100;
    public static final int MAX_WORDS = 5;
    public static final int MAX_WORD_LENGTH = 50;
    public static final int MAX_TOTAL_LENGTH = 100;

    public static SearchQuery parse(String raw, Integer limit) {
        if (raw == null || raw.isBlank()) {
            throw invalid("검색어를 입력해 주세요.");
        }
        // 제어 문자는 공백으로 바꾸고 연속 공백을 하나로 줄인다
        String normalized = raw.replaceAll("\\p{Cntrl}", " ").trim().replaceAll("\\s+", " ");
        if (normalized.isEmpty()) {
            throw invalid("검색어를 입력해 주세요.");
        }
        if (normalized.length() > MAX_TOTAL_LENGTH) {
            throw invalid("검색어는 " + MAX_TOTAL_LENGTH + "자 이하여야 합니다.");
        }
        Map<String, String> unique = new LinkedHashMap<>();
        for (String word : normalized.split(" ")) {
            if (word.length() > MAX_WORD_LENGTH) {
                throw invalid("검색 단어는 " + MAX_WORD_LENGTH + "자 이하여야 합니다.");
            }
            unique.putIfAbsent(word.toLowerCase(Locale.ROOT), word);
        }
        if (unique.size() > MAX_WORDS) {
            throw invalid("검색 단어는 " + MAX_WORDS + "개 이하여야 합니다.");
        }
        int effectiveLimit = limit == null ? DEFAULT_LIMIT : limit;
        if (effectiveLimit < 1 || effectiveLimit > MAX_LIMIT) {
            throw invalid("limit 는 1 이상 " + MAX_LIMIT + " 이하여야 합니다.");
        }
        return new SearchQuery(List.copyOf(new ArrayList<>(unique.values())), effectiveLimit);
    }

    /** 부분 일치용 LIKE 패턴 목록(`%단어%`, 와일드카드 이스케이프 적용). */
    public List<String> likePatterns() {
        return words.stream().map(w -> "%" + escapeLike(w) + "%").toList();
    }

    /** LIKE 의 특수 문자(`\`, `%`, `_`)가 입력에서 와일드카드로 동작하지 않게 한다. Postgres LIKE 의 기본 이스케이프 문자는 `\` 이다. */
    static String escapeLike(String word) {
        return word.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private static InterviewException invalid(String message) {
        return new InterviewException(ErrorCode.INVALID_SEARCH_QUERY, message);
    }
}
