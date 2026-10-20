package com.doro.interview.catalog.content;

import com.doro.interview.catalog.content.ContentModels.ContentSet;
import com.doro.interview.catalog.content.ContentModels.QuestionDoc;
import com.doro.interview.catalog.content.ContentModels.TopicDoc;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 저장소의 실제 content/ 를 검사한다(Spring·DB 없이, CI 에서 항상 실행).
 * 콘텐츠를 늘리거나 줄이면 아래 기대 수를 고치는 커밋이 함께 와야 한다. 일부러 막아 둔 것이다: 질문이 조용히 빠지는 일을 잡는다.
 */
class ContentIntegrityTest {

    private static final int QUESTIONS = 746;
    private static final int TOPICS = 35;
    private static final int TRICKY = 183;
    /** 검수 배치를 커밋할 때마다 올린다(B4: tx-01~25). */
    private static final int REVIEWED = 746;

    private static ContentSet content;

    @BeforeAll
    static void load() {
        content = new ContentParser().parse("classpath:content/");
    }

    @Test
    void 검증기가_문제를_찾지_못한다() {
        assertThat(ContentValidator.validate(content)).isEmpty();
    }

    @Test
    void 질문_주제_꼬리_질문_수가_기대와_같다() {
        assertThat(content.categories()).hasSize(6);
        assertThat(content.topics()).hasSize(TOPICS);
        assertThat(content.questions()).hasSize(QUESTIONS);
        assertThat(content.questions().stream().filter(q -> q.tier().equals("TRICKY")).count()).isEqualTo(TRICKY);
    }

    @Test
    void 주제별_질문_수가_기대와_같다() {
        Map<String, Long> perTopic = content.questions().stream()
                .collect(Collectors.groupingBy(QuestionDoc::topic, Collectors.counting()));
        assertThat(perTopic).containsExactlyInAnyOrderEntriesOf(Map.ofEntries(
                Map.entry("cs-algorithm", 20L), Map.entry("cs-datastructure", 20L), Map.entry("cs-network", 20L),
                Map.entry("cs-os-memory", 20L), Map.entry("cs-os-process", 20L), Map.entry("cs-web", 21L),
                Map.entry("db-basics", 21L), Map.entry("db-cache", 22L), Map.entry("db-design", 22L),
                Map.entry("db-index", 20L), Map.entry("db-lock", 20L), Map.entry("db-transaction", 20L),
                Map.entry("db-tuning", 21L), Map.entry("design-distributed", 24L), Map.entry("design-pattern", 25L),
                Map.entry("design-principles", 16L), Map.entry("dev-build", 21L), Map.entry("dev-cicd", 20L),
                Map.entry("dev-docker", 20L), Map.entry("dev-git", 22L), Map.entry("dev-test", 20L),
                Map.entry("java-collections", 20L), Map.entry("java-concurrency", 21L), Map.entry("java-jvm", 20L),
                Map.entry("java-lang", 21L), Map.entry("java-oop", 20L), Map.entry("java-stream", 21L),
                Map.entry("aop-proxy", 20L), Map.entry("ioc-di", 27L), Map.entry("jpa", 37L),
                Map.entry("spring-boot", 21L), Map.entry("spring-misc", 17L), Map.entry("spring-mvc", 23L),
                Map.entry("spring-security", 18L), Map.entry("transaction", 25L)));
    }

    @Test
    void slug는_주제접두사_두자리번호_형식이고_주제_안에서_번호가_겹치지_않는다() {
        Map<String, String> prefixOf = content.topics().stream().collect(Collectors.toMap(TopicDoc::slug, TopicDoc::slugPrefix));
        Set<String> seen = new HashSet<>();
        for (QuestionDoc q : content.questions()) {
            assertThat(q.slug()).matches(prefixOf.get(q.topic()) + "-\\d{2}");
            assertThat(seen.add(q.slug())).as("중복 slug " + q.slug()).isTrue();
        }
    }

    @Test
    void 제목은_주제_안에서_겹치지_않는다() {
        for (TopicDoc t : content.topics()) {
            List<String> titles = content.questions().stream().filter(q -> q.topic().equals(t.slug())).map(QuestionDoc::title).toList();
            assertThat(titles).as(t.slug()).doesNotHaveDuplicates();
        }
    }

    @Test
    void 본문은_모범_답변으로_시작하고_키워드_줄은_본문에_없다() {
        for (QuestionDoc q : content.questions()) {
            assertThat(q.body()).as(q.slug()).startsWith("**모범 답변");
            assertThat(q.body()).as(q.slug()).doesNotContain("**핵심 키워드**:");
            assertThat(q.keywords()).as(q.slug()).allSatisfy(k -> assertThat(k).isNotBlank());
        }
    }

    @Test
    void 검수된_질문은_기대_수만큼이고_검수일이_있으며_주제는_비공개다() {
        assertThat(content.questions()).allSatisfy(q -> {
            assertThat(q.status()).isIn("DRAFT", "REVIEWED");
            if (q.status().equals("REVIEWED")) assertThat(q.reviewedAt()).as(q.slug()).isNotNull();
            else assertThat(q.reviewedAt()).as(q.slug()).isNull();
        });
        assertThat(content.questions().stream().filter(q -> q.status().equals("REVIEWED")).count()).isEqualTo(REVIEWED);
        // 공개 주제는 모든 질문이 REVIEWED 여야 한다(로더 검증기가 강제). 콘텐츠는 모든 주제가 공개다.
        assertThat(content.topics()).allMatch(TopicDoc::published);
        assertThat(content.questions()).allMatch(q -> q.status().equals("REVIEWED"));
    }

    @Test
    void 주제마다_출처_URL이_있고_기준_버전이_있다() {
        for (TopicDoc t : content.topics()) {
            assertThat(t.sources()).as(t.slug()).isNotEmpty();
            assertThat(t.baseVersion()).as(t.slug()).isNotBlank();
        }
    }

    @Test
    void 문서가_표시_없는_사실을_공식으로_본다고_밝힌_주제만_OFFICIAL이다() {
        Map<String, String> evidence = content.topics().stream().collect(Collectors.toMap(TopicDoc::slug, TopicDoc::defaultEvidence));
        assertThat(evidence).containsEntry("aop-proxy", "OFFICIAL").containsEntry("spring-boot", "OFFICIAL");
        assertThat(evidence.values().stream().filter("OFFICIAL"::equals).count()).isEqualTo(2);
    }
}
