package com.doro.interview.catalog.content;

import java.time.Instant;
import java.util.List;

/** content/ 파일을 읽은 결과(DB 에 반영하기 전의 값). */
public final class ContentModels {

    private ContentModels() {
    }

    public record CategoryDoc(String slug, String name, int sort, String path) {
    }

    public record SourceDoc(String url, String note) {
    }

    public record TopicDoc(String slug, String category, String name, int sort, String slugPrefix, String description,
                           String baseVersion, String defaultEvidence, boolean published, List<SourceDoc> sources,
                           String path) {
    }

    public record QuestionDoc(String slug, String topic, String tier, int difficulty, String title, List<String> keywords,
                              boolean hasExtra, String status, Instant reviewedAt, String body, String path) {

        /** 정렬 순서: 슬러그 끝의 번호(tx-07 → 7). 번호가 없으면 0. */
        public int sort() {
            int dash = slug.lastIndexOf('-');
            String tail = dash < 0 ? "" : slug.substring(dash + 1);
            return tail.matches("\\d{1,6}") ? Integer.parseInt(tail) : 0;
        }
    }

    public record ContentSet(List<CategoryDoc> categories, List<TopicDoc> topics, List<QuestionDoc> questions) {
    }
}
