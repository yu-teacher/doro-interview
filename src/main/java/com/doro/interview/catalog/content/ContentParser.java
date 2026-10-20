package com.doro.interview.catalog.content;

import com.doro.interview.catalog.content.ContentModels.CategoryDoc;
import com.doro.interview.catalog.content.ContentModels.ContentSet;
import com.doro.interview.catalog.content.ContentModels.QuestionDoc;
import com.doro.interview.catalog.content.ContentModels.SourceDoc;
import com.doro.interview.catalog.content.ContentModels.TopicDoc;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.SafeConstructor;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * content/ 아래의 파일을 읽어 모델로 바꾼다. 형식 오류는 파일 경로와 함께 모아서 보고한다(검증은 ContentValidator).
 *
 * <pre>
 * content/&lt;category&gt;/_category.yml
 * content/&lt;category&gt;/&lt;topic&gt;/_topic.yml
 * content/&lt;category&gt;/&lt;topic&gt;/&lt;slug&gt;.md      (YAML frontmatter + 마크다운 본문)
 * </pre>
 */
public class ContentParser {

    private final ResourcePatternResolver resolver;

    public ContentParser() {
        this(new PathMatchingResourcePatternResolver());
    }

    public ContentParser(ResourcePatternResolver resolver) {
        this.resolver = resolver;
    }

    public ContentSet parse(String location) {
        String base = location.endsWith("/") ? location : location + "/";
        List<String> problems = new ArrayList<>();
        List<CategoryDoc> categories = new ArrayList<>();
        List<TopicDoc> topics = new ArrayList<>();
        List<QuestionDoc> questions = new ArrayList<>();

        Resource[] resources;
        try {
            resources = resolver.getResources(base + "**/*");
        } catch (IOException e) {
            throw new ContentException("콘텐츠 위치를 읽지 못했다: " + location + " (" + e.getMessage() + ")");
        }
        Arrays.sort(resources, Comparator.comparing(ContentParser::pathOf));
        for (Resource resource : resources) {
            String name = resource.getFilename();
            if (name == null || !resource.isReadable() || name.isEmpty()) {
                continue;
            }
            String path = pathOf(resource);
            try {
                if (name.equals("_category.yml")) {
                    categories.add(category(resource, path));
                } else if (name.equals("_topic.yml")) {
                    topics.add(topic(resource, path));
                } else if (name.endsWith(".md")) {
                    questions.add(question(resource, path));
                }
            } catch (ContentException e) {
                problems.addAll(e.problems());
            } catch (RuntimeException | IOException e) {
                problems.add(path + ": 읽지 못했다 (" + e.getClass().getSimpleName() + ": " + e.getMessage() + ")");
            }
        }
        if (!problems.isEmpty()) {
            throw new ContentException(problems);
        }
        return new ContentSet(categories, topics, questions);
    }

    // ------------------------------------------------------------------ 파일 종류별

    private CategoryDoc category(Resource resource, String path) throws IOException {
        Map<String, Object> map = yamlMap(read(resource), path);
        String slug = str(map, "slug", path);
        requireDir(path, 1, slug, "slug");
        return new CategoryDoc(slug, str(map, "name", path), intOr(map, "sort", 0, path), path);
    }

    private TopicDoc topic(Resource resource, String path) throws IOException {
        Map<String, Object> map = yamlMap(read(resource), path);
        String slug = str(map, "slug", path);
        String category = str(map, "category", path);
        requireDir(path, 1, slug, "slug");
        requireDir(path, 2, category, "category");
        List<SourceDoc> sources = new ArrayList<>();
        Object raw = map.get("sources");
        if (raw instanceof List<?> list) {
            for (Object item : list) {
                if (!(item instanceof Map<?, ?> m) || !(m.get("url") instanceof String url)) {
                    throw new ContentException(path + ": sources 항목은 url 이 있는 객체여야 한다");
                }
                sources.add(new SourceDoc(url, m.get("note") instanceof String note ? note : null));
            }
        } else if (raw != null) {
            throw new ContentException(path + ": sources 는 목록이어야 한다");
        }
        return new TopicDoc(slug, category, str(map, "name", path), intOr(map, "sort", 0, path),
                str(map, "slug_prefix", path), strOr(map, "description", "", path), strOrNull(map, "base_version", path),
                strOr(map, "default_evidence", "UNKNOWN", path), bool(map, "published", false, path),
                List.copyOf(sources), path);
    }

    private QuestionDoc question(Resource resource, String path) throws IOException {
        String text = read(resource).replace("\r\n", "\n");
        if (!text.startsWith("---\n")) {
            throw new ContentException(path + ": 첫 줄이 '---' 인 frontmatter 가 없다");
        }
        int end = text.indexOf("\n---\n", 3);
        if (end < 0) {
            throw new ContentException(path + ": frontmatter 를 닫는 '---' 줄이 없다");
        }
        Map<String, Object> map = yamlMap(text.substring(4, end), path);
        String body = text.substring(end + 5);
        String topic = str(map, "topic", path);
        requireDir(path, 1, topic, "topic");
        List<String> keywords = new ArrayList<>();
        if (!(map.get("keywords") instanceof List<?> list)) {
            throw new ContentException(path + ": keywords 는 문자열 목록이어야 한다");
        }
        for (Object k : list) {
            if (!(k instanceof String s)) {
                throw new ContentException(path + ": keywords 에 문자열이 아닌 값이 있다");
            }
            keywords.add(s);
        }
        return new QuestionDoc(str(map, "slug", path), topic, str(map, "tier", path), intOr(map, "difficulty", -1, path),
                str(map, "title", path), List.copyOf(keywords), bool(map, "has_extra", false, path),
                strOr(map, "status", "DRAFT", path), instantOrNull(map.get("reviewed_at"), path), body, path);
    }

    // ------------------------------------------------------------------ 도우미

    /** 경로 끝에서 offset 번째 디렉터리 이름이 값과 같은지 본다(1 = 파일 바로 위). 제목이 바뀌어도 위치와 내용이 어긋나지 않게 한다. */
    private static void requireDir(String path, int offset, String expected, String field) {
        String[] parts = path.split("/");
        int idx = parts.length - 1 - offset;
        if (idx < 0 || !parts[idx].equals(expected)) {
            throw new ContentException(path + ": " + field + " '" + expected + "' 가 디렉터리 이름과 다르다");
        }
    }

    private static String pathOf(Resource resource) {
        try {
            String url = resource.getURL().toString();
            int idx = url.indexOf("content/");
            return idx >= 0 ? url.substring(idx) : url;
        } catch (IOException e) {
            return String.valueOf(resource.getFilename());
        }
    }

    private static String read(Resource resource) throws IOException {
        return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> yamlMap(String yaml, String path) {
        Object loaded;
        try {
            loaded = new Yaml(new SafeConstructor(new LoaderOptions())).load(yaml);
        } catch (RuntimeException e) {
            throw new ContentException(path + ": YAML 을 읽지 못했다 (" + firstLine(e.getMessage()) + ")");
        }
        if (!(loaded instanceof Map<?, ?> map)) {
            throw new ContentException(path + ": YAML 최상위가 키-값 객체가 아니다");
        }
        return (Map<String, Object>) map;
    }

    private static String firstLine(String message) {
        return message == null ? "" : message.lines().findFirst().orElse("");
    }

    private static String str(Map<String, Object> map, String key, String path) {
        Object v = map.get(key);
        if (!(v instanceof String s) || s.isBlank()) {
            throw new ContentException(path + ": '" + key + "' 가 없거나 문자열이 아니다");
        }
        return s;
    }

    private static String strOr(Map<String, Object> map, String key, String fallback, String path) {
        Object v = map.get(key);
        if (v == null) {
            return fallback;
        }
        if (!(v instanceof String s)) {
            throw new ContentException(path + ": '" + key + "' 는 문자열이어야 한다");
        }
        return s;
    }

    private static String strOrNull(Map<String, Object> map, String key, String path) {
        return strOr(map, key, null, path);
    }

    private static int intOr(Map<String, Object> map, String key, int fallback, String path) {
        Object v = map.get(key);
        if (v == null) {
            return fallback;
        }
        if (!(v instanceof Integer i)) {
            throw new ContentException(path + ": '" + key + "' 는 정수여야 한다");
        }
        return i;
    }

    private static boolean bool(Map<String, Object> map, String key, boolean fallback, String path) {
        Object v = map.get(key);
        if (v == null) {
            return fallback;
        }
        if (!(v instanceof Boolean b)) {
            throw new ContentException(path + ": '" + key + "' 는 true/false 여야 한다");
        }
        return b;
    }

    private static Instant instantOrNull(Object v, String path) {
        if (v == null) {
            return null;
        }
        if (v instanceof Date d) {
            return d.toInstant();
        }
        if (v instanceof String s) {
            try {
                return s.length() == 10 ? LocalDate.parse(s).atStartOfDay().toInstant(ZoneOffset.UTC) : Instant.parse(s);
            } catch (RuntimeException e) {
                throw new ContentException(path + ": reviewed_at 형식이 틀렸다(날짜 YYYY-MM-DD 또는 ISO 시각): " + s);
            }
        }
        throw new ContentException(path + ": reviewed_at 형식이 틀렸다");
    }
}
