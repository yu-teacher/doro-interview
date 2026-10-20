package com.doro.interview.catalog.content;

import com.doro.interview.catalog.content.ContentModels.CategoryDoc;
import com.doro.interview.catalog.content.ContentModels.ConceptDoc;
import com.doro.interview.catalog.content.ContentModels.ContentSet;
import com.doro.interview.catalog.content.ContentModels.LinkDoc;
import com.doro.interview.catalog.content.ContentModels.QuestionDoc;
import com.doro.interview.catalog.content.ContentModels.TopicDoc;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * 콘텐츠 정합성 규칙. 로더(시작 시)와 정합성 테스트(CI)가 같은 규칙을 쓴다.
 * 문제를 하나씩 던지지 않고 전부 모아서 돌려준다.
 */
public final class ContentValidator {

    private static final Pattern SLUG = Pattern.compile("[a-z0-9]+(-[a-z0-9]+)*");
    private static final Pattern PREFIX = Pattern.compile("[a-z0-9]+");
    private static final Set<String> TIERS = Set.of("BASIC", "DEEP", "TRICKY");
    private static final Set<String> STATUSES = Set.of("DRAFT", "REVIEWED");
    private static final Set<String> EVIDENCE = Set.of("OFFICIAL", "UNKNOWN");
    private static final Set<String> LINK_KINDS = Set.of("FOLLOWUP", "PREREQ", "RELATED");
    private static final int MAX_CONCEPTS_PER_QUESTION = 3;
    private static final int MAX_LINKS_PER_QUESTION = 5;

    private ContentValidator() {
    }

    public static List<String> validate(ContentSet set) {
        List<String> problems = new ArrayList<>();

        Set<String> categorySlugs = new HashSet<>();
        for (CategoryDoc c : set.categories()) {
            check(SLUG.matcher(c.slug()).matches() && c.slug().length() <= 40, problems, c.path(), "카테고리 slug 형식이 틀렸다: " + c.slug());
            check(categorySlugs.add(c.slug()), problems, c.path(), "카테고리 slug 가 중복이다: " + c.slug());
        }

        Map<String, TopicDoc> topics = new HashMap<>();
        Set<String> prefixes = new HashSet<>();
        for (TopicDoc t : set.topics()) {
            check(SLUG.matcher(t.slug()).matches() && t.slug().length() <= 40, problems, t.path(), "주제 slug 형식이 틀렸다: " + t.slug());
            check(topics.put(t.slug(), t) == null, problems, t.path(), "주제 slug 가 중복이다: " + t.slug());
            check(categorySlugs.contains(t.category()), problems, t.path(), "없는 카테고리를 가리킨다: " + t.category());
            check(PREFIX.matcher(t.slugPrefix()).matches(), problems, t.path(), "slug_prefix 는 영소문자·숫자만 쓴다: " + t.slugPrefix());
            check(prefixes.add(t.slugPrefix()), problems, t.path(), "slug_prefix 가 다른 주제와 겹친다: " + t.slugPrefix());
            check(EVIDENCE.contains(t.defaultEvidence()), problems, t.path(), "default_evidence 값이 틀렸다: " + t.defaultEvidence());
            for (var s : t.sources()) {
                check(s.url().startsWith("https://") || s.url().startsWith("http://"), problems, t.path(), "출처 URL 형식이 틀렸다: " + s.url());
            }
        }

        Set<String> conceptSlugs = new HashSet<>();
        for (ConceptDoc c : set.concepts()) {
            check(SLUG.matcher(c.slug()).matches() && c.slug().length() <= 40, problems, c.path(), "개념 slug 형식이 틀렸다: " + c.slug());
            check(conceptSlugs.add(c.slug()), problems, c.path(), "개념 slug 가 중복이다: " + c.slug());
            check(!c.name().isBlank() && c.name().length() <= 100, problems, c.path(), "개념 이름이 비었거나 100자를 넘는다: " + c.slug());
        }
        Set<String> questionSlugs = new HashSet<>();
        for (QuestionDoc q : set.questions()) {
            questionSlugs.add(q.slug());
        }

        Set<String> slugs = new HashSet<>();
        Map<String, List<QuestionDoc>> byTopic = new HashMap<>();
        for (QuestionDoc q : set.questions()) {
            String at = q.path();
            check(SLUG.matcher(q.slug()).matches() && q.slug().length() <= 60, problems, at, "질문 slug 형식이 틀렸다: " + q.slug());
            check(slugs.add(q.slug()), problems, at, "질문 slug 가 중복이다: " + q.slug());
            TopicDoc topic = topics.get(q.topic());
            if (topic == null) {
                problems.add(at + ": 없는 주제를 가리킨다: " + q.topic());
            } else {
                check(q.slug().startsWith(topic.slugPrefix() + "-"), problems, at,
                        "질문 slug 는 '" + topic.slugPrefix() + "-' 로 시작해야 한다: " + q.slug());
                byTopic.computeIfAbsent(q.topic(), k -> new ArrayList<>()).add(q);
            }
            check(TIERS.contains(q.tier()), problems, at, "tier 값이 틀렸다: " + q.tier());
            check(q.difficulty() >= 1 && q.difficulty() <= 3, problems, at, "difficulty 는 1~3 이어야 한다: " + q.difficulty());
            check(!q.title().isBlank(), problems, at, "제목이 비어 있다");
            check(!q.keywords().isEmpty() && q.keywords().stream().noneMatch(String::isBlank), problems, at, "키워드가 비었거나 빈 키워드가 있다");
            check(!q.body().isBlank(), problems, at, "본문이 비어 있다");
            check(fenceCount(q.body()) % 2 == 0, problems, at, "코드 펜스(```)가 짝이 맞지 않는다");
            check(STATUSES.contains(q.status()), problems, at, "status 값이 틀렸다: " + q.status());
            check(!"REVIEWED".equals(q.status()) || q.reviewedAt() != null, problems, at, "REVIEWED 질문에는 reviewed_at 이 있어야 한다");
            checkRelations(q, conceptSlugs, questionSlugs, problems);
            check(q.sources().size() <= 20, problems, at, "sources 는 20개 이하여야 한다");
            for (String url : q.sources()) {
                check(url.startsWith("https://") || url.startsWith("http://"), problems, at, "질문 출처 URL 형식이 틀렸다: " + url);
            }
            check(!com.doro.interview.catalog.AnswerSplitter.split(q.body()).spokenAnswer().isBlank(), problems, at,
                    "본문은 '**모범 답변' 줄 다음에 답변 문단이 있어야 한다");
            check(q.hasExtra() == q.body().contains("(보충)"), problems, at,
                    "has_extra(" + q.hasExtra() + ")가 본문의 (보충) 표기와 어긋난다");
        }

        checkCycles("FOLLOWUP", set.questions(), problems);
        checkCycles("PREREQ", set.questions(), problems);

        // 공개 주제는 모든 질문이 검수를 마쳐야 한다(docs/DESIGN.md §5.1)
        for (TopicDoc t : set.topics()) {
            if (!t.published()) {
                continue;
            }
            List<QuestionDoc> qs = byTopic.getOrDefault(t.slug(), List.of());
            check(!qs.isEmpty(), problems, t.path(), "질문이 없는 주제는 공개할 수 없다");
            for (QuestionDoc q : qs) {
                check("REVIEWED".equals(q.status()), problems, t.path(), "공개 주제에 검수 전(DRAFT) 질문이 있다: " + q.slug());
            }
        }
        return problems;
    }

    /** 개념·필수도·연결(D15~D17). */
    private static void checkRelations(QuestionDoc q, Set<String> conceptSlugs, Set<String> questionSlugs, List<String> problems) {
        String at = q.path();
        check(q.importance() == null || (q.importance() >= 1 && q.importance() <= 3), problems, at,
                "importance 는 1~3 이어야 한다(판단하지 않았으면 쓰지 않는다): " + q.importance());
        check(q.concepts().size() <= MAX_CONCEPTS_PER_QUESTION, problems, at,
                "개념은 질문당 " + MAX_CONCEPTS_PER_QUESTION + "개 이하여야 한다");
        check(new HashSet<>(q.concepts()).size() == q.concepts().size(), problems, at, "같은 개념이 중복이다");
        for (String c : q.concepts()) {
            check(conceptSlugs.contains(c), problems, at, "개념 사전(_concepts.yml)에 없는 개념이다: " + c);
        }
        check(q.links().size() <= MAX_LINKS_PER_QUESTION, problems, at, "연결은 질문당 " + MAX_LINKS_PER_QUESTION + "개 이하여야 한다");
        Set<String> seen = new HashSet<>();
        for (LinkDoc l : q.links()) {
            check(LINK_KINDS.contains(l.kind()), problems, at, "연결 종류가 틀렸다(FOLLOWUP/PREREQ/RELATED): " + l.kind());
            check(!l.to().equals(q.slug()), problems, at, "자기 자신을 가리키는 연결이다: " + l.to());
            check(questionSlugs.contains(l.to()), problems, at, "없는 질문을 가리키는 연결이다: " + l.to());
            check(seen.add(l.to() + "|" + l.kind()), problems, at, "같은 (대상, 종류) 연결이 중복이다: " + l.to() + " " + l.kind());
        }
    }

    /** FOLLOWUP 과 PREREQ 는 방향이 있는 흐름이라 순환하면 안 된다(RELATED 는 방향이 없으므로 검사하지 않는다). */
    private static void checkCycles(String kind, List<QuestionDoc> questions, List<String> problems) {
        Map<String, List<String>> graph = new HashMap<>();
        Map<String, String> pathOf = new HashMap<>();
        for (QuestionDoc q : questions) {
            pathOf.put(q.slug(), q.path());
            for (LinkDoc l : q.links()) {
                if (kind.equals(l.kind())) {
                    graph.computeIfAbsent(q.slug(), k -> new ArrayList<>()).add(l.to());
                }
            }
        }
        Set<String> done = new HashSet<>();
        for (String start : new java.util.TreeSet<>(graph.keySet())) {
            visit(start, kind, graph, pathOf, new java.util.ArrayDeque<>(), new HashSet<>(), done, problems);
        }
    }

    private static void visit(String node, String kind, Map<String, List<String>> graph, Map<String, String> pathOf,
                              java.util.Deque<String> stack, Set<String> onStack, Set<String> done, List<String> problems) {
        if (done.contains(node)) {
            return;
        }
        stack.addLast(node);
        onStack.add(node);
        for (String next : graph.getOrDefault(node, List.of())) {
            if (onStack.contains(next)) {
                List<String> cycle = new ArrayList<>();
                boolean in = false;
                for (String s : stack) {
                    if (s.equals(next)) {
                        in = true;
                    }
                    if (in) {
                        cycle.add(s);
                    }
                }
                cycle.add(next);
                problems.add(pathOf.getOrDefault(node, node) + ": " + kind + " 연결에 순환이 있다: " + String.join(" -> ", cycle));
            } else {
                visit(next, kind, graph, pathOf, stack, onStack, done, problems);
            }
        }
        stack.removeLast();
        onStack.remove(node);
        done.add(node);
    }

    private static void check(boolean ok, List<String> problems, String path, String message) {
        if (!ok) {
            problems.add(path + ": " + message);
        }
    }

    private static int fenceCount(String body) {
        int n = 0;
        for (String line : body.split("\n", -1)) {
            if (line.stripLeading().startsWith("```")) {
                n++;
            }
        }
        return n;
    }
}
