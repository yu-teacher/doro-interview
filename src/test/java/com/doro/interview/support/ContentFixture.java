package com.doro.interview.support;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

/** 테스트용 content/ 디렉터리를 만든다. root 아래에 content/ 가 생긴다. */
public final class ContentFixture {

    private final Path content;

    public ContentFixture(Path root) {
        this.content = root.resolve("content");
        try {
            Files.createDirectories(content);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    public String location() {
        return "file:" + content + "/";
    }

    public ContentFixture category(String slug) {
        write(content.resolve(slug).resolve("_category.yml"), "slug: \"" + slug + "\"\nname: \"카테고리 " + slug + "\"\nsort: 10\n");
        return this;
    }

    public ContentFixture topic(String category, String slug, String prefix, boolean published) {
        write(content.resolve(category).resolve(slug).resolve("_topic.yml"),
                "slug: \"" + slug + "\"\ncategory: \"" + category + "\"\nname: \"주제 " + slug + "\"\nsort: 10\n"
                        + "slug_prefix: \"" + prefix + "\"\ndescription: \"설명\"\nbase_version: \"v1\"\n"
                        + "default_evidence: UNKNOWN\npublished: " + published + "\n"
                        + "sources:\n  - url: \"https://example.com/doc\"\n    note: \"메모 \\\"따옴표\\\" 와 \\\\ 역슬래시\"\n");
        return this;
    }

    /** 질문 파일. reviewedAt 이 null 이 아니면 REVIEWED 로 쓴다. */
    public ContentFixture question(String category, String topic, String slug, String title, String body, String reviewedAt) {
        return questionFull(category, topic, slug, "BASIC", title, body, reviewedAt, List.of());
    }

    public ContentFixture question(String category, String topic, String slug, String title, String body) {
        return questionFull(category, topic, slug, "BASIC", title, body, null, List.of());
    }

    public ContentFixture questionFull(String category, String topic, String slug, String tier, String title, String body,
                                       String reviewedAt, List<String> sources) {
        String status = reviewedAt == null ? "DRAFT" : "REVIEWED";
        String reviewed = reviewedAt == null ? "" : "reviewed_at: " + reviewedAt + "\n";
        String src = sources.isEmpty() ? "" : "sources: [" + String.join(", ", sources.stream().map(s -> "\"" + s + "\"").toList()) + "]\n";
        int difficulty = switch (tier) {
            case "BASIC" -> 1;
            case "DEEP" -> 2;
            default -> 3;
        };
        write(content.resolve(category).resolve(topic).resolve(slug + ".md"),
                "---\nslug: \"" + slug + "\"\ntopic: \"" + topic + "\"\ntier: " + tier + "\ndifficulty: " + difficulty + "\ntitle: \"" + title + "\"\n"
                        + "keywords: [\"하나\", \"둘\"]\nhas_extra: " + body.contains("(보충)") + "\nstatus: " + status + "\n" + reviewed + src
                        + "---\n" + body);
        return this;
    }

    public ContentFixture write(Path file, String text) {
        try {
            Files.createDirectories(file.getParent());
            Files.writeString(file, text, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return this;
    }

    public ContentFixture delete(String category, String topic, String slug) {
        try {
            Files.delete(content.resolve(category).resolve(topic).resolve(slug + ".md"));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return this;
    }

    public Path questionFile(String category, String topic, String slug) {
        return content.resolve(category).resolve(topic).resolve(slug + ".md");
    }
}
