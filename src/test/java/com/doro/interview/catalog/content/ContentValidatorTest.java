package com.doro.interview.catalog.content;

import com.doro.interview.catalog.content.ContentModels.CategoryDoc;
import com.doro.interview.catalog.content.ContentModels.ContentSet;
import com.doro.interview.catalog.content.ContentModels.QuestionDoc;
import com.doro.interview.catalog.content.ContentModels.SourceDoc;
import com.doro.interview.catalog.content.ContentModels.TopicDoc;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.function.UnaryOperator;

import static org.assertj.core.api.Assertions.assertThat;

/** 검증기의 각 규칙이 정말 발동하는지(그리고 정상 입력은 통과하는지) 확인한다. */
class ContentValidatorTest {

    private static CategoryDoc category() {
        return new CategoryDoc("c1", "카테고리", 10, "content/c1/_category.yml");
    }

    private static TopicDoc topic(UnaryOperator<TopicDoc> f) {
        return f.apply(new TopicDoc("t1", "c1", "주제", 10, "aa", "", "v1", "UNKNOWN", false,
                List.of(new SourceDoc("https://example.com", null)), "content/c1/t1/_topic.yml"));
    }

    private static QuestionDoc question(UnaryOperator<QuestionDoc> f) {
        return f.apply(new QuestionDoc("aa-01", "t1", "BASIC", 1, "제목", List.of("키워드"), false, "DRAFT", null,
                "**모범 답변**\n본문\n", "content/c1/t1/aa-01.md"));
    }

    private static List<String> validate(TopicDoc t, QuestionDoc... qs) {
        return ContentValidator.validate(new ContentSet(List.of(category()), List.of(t), List.of(qs)));
    }

    private static List<String> validateQ(UnaryOperator<QuestionDoc> f) {
        return validate(topic(t -> t), question(f));
    }

    @Test
    void 정상_입력은_통과한다() {
        assertThat(validate(topic(t -> t), question(q -> q))).isEmpty();
    }

    @Test
    void slug_형식이_틀리면_잡는다() {
        assertThat(validateQ(q -> copy(q, "AA_01", q.topic(), q.tier(), q.difficulty()))).anyMatch(p -> p.contains("slug 형식"));
    }

    @Test
    void 질문_slug가_주제_접두사와_다르면_잡는다() {
        assertThat(validateQ(q -> copy(q, "zz-01", q.topic(), q.tier(), q.difficulty()))).anyMatch(p -> p.contains("'aa-' 로 시작"));
    }

    @Test
    void 중복_slug를_잡는다() {
        QuestionDoc a = question(q -> q);
        assertThat(validate(topic(t -> t), a, a)).anyMatch(p -> p.contains("중복"));
    }

    @Test
    void 없는_주제와_없는_카테고리를_잡는다() {
        assertThat(validateQ(q -> copy(q, q.slug(), "nope", q.tier(), q.difficulty()))).anyMatch(p -> p.contains("없는 주제"));
        assertThat(ContentValidator.validate(new ContentSet(List.of(category()),
                List.of(topic(t -> new TopicDoc(t.slug(), "nope", t.name(), t.sort(), t.slugPrefix(), "", "v", "UNKNOWN", false, t.sources(), t.path()))),
                List.of()))).anyMatch(p -> p.contains("없는 카테고리"));
    }

    @Test
    void tier와_난이도_범위를_잡는다() {
        assertThat(validateQ(q -> copy(q, q.slug(), q.topic(), "HARD", 1))).anyMatch(p -> p.contains("tier"));
        assertThat(validateQ(q -> copy(q, q.slug(), q.topic(), "BASIC", 0))).anyMatch(p -> p.contains("difficulty"));
        assertThat(validateQ(q -> copy(q, q.slug(), q.topic(), "BASIC", 4))).anyMatch(p -> p.contains("difficulty"));
    }

    @Test
    void 빈_키워드_빈_본문_빈_제목을_잡는다() {
        assertThat(validateQ(q -> new QuestionDoc(q.slug(), q.topic(), q.tier(), q.difficulty(), q.title(), List.of(), false, "DRAFT", null, q.body(), q.path())))
                .anyMatch(p -> p.contains("키워드"));
        assertThat(validateQ(q -> new QuestionDoc(q.slug(), q.topic(), q.tier(), q.difficulty(), q.title(), List.of(" "), false, "DRAFT", null, q.body(), q.path())))
                .anyMatch(p -> p.contains("키워드"));
        assertThat(validateQ(q -> new QuestionDoc(q.slug(), q.topic(), q.tier(), q.difficulty(), q.title(), q.keywords(), false, "DRAFT", null, "  \n", q.path())))
                .anyMatch(p -> p.contains("본문이 비어"));
        assertThat(validateQ(q -> new QuestionDoc(q.slug(), q.topic(), q.tier(), q.difficulty(), " ", q.keywords(), false, "DRAFT", null, q.body(), q.path())))
                .anyMatch(p -> p.contains("제목이 비어"));
    }

    @Test
    void 짝이_안_맞는_코드_펜스를_잡는다() {
        assertThat(validateQ(q -> new QuestionDoc(q.slug(), q.topic(), q.tier(), q.difficulty(), q.title(), q.keywords(), false, "DRAFT", null,
                "**모범 답변**\n```java\nclass A {}\n", q.path()))).anyMatch(p -> p.contains("코드 펜스"));
    }

    @Test
    void 알_수_없는_상태와_검수일_없는_REVIEWED를_잡는다() {
        assertThat(validateQ(q -> new QuestionDoc(q.slug(), q.topic(), q.tier(), q.difficulty(), q.title(), q.keywords(), false, "DONE", null, q.body(), q.path())))
                .anyMatch(p -> p.contains("status"));
        assertThat(validateQ(q -> new QuestionDoc(q.slug(), q.topic(), q.tier(), q.difficulty(), q.title(), q.keywords(), false, "REVIEWED", null, q.body(), q.path())))
                .anyMatch(p -> p.contains("reviewed_at"));
    }

    @Test
    void has_extra가_본문과_어긋나면_양쪽_모두_잡는다() {
        assertThat(validateQ(q -> new QuestionDoc(q.slug(), q.topic(), q.tier(), q.difficulty(), q.title(), q.keywords(), true, "DRAFT", null, q.body(), q.path())))
                .anyMatch(p -> p.contains("has_extra"));
        assertThat(validateQ(q -> new QuestionDoc(q.slug(), q.topic(), q.tier(), q.difficulty(), q.title(), q.keywords(), false, "DRAFT", null, "(보충) 있음\n", q.path())))
                .anyMatch(p -> p.contains("has_extra"));
    }

    @Test
    void 주제_규칙을_잡는다() {
        assertThat(validate(topic(t -> new TopicDoc(t.slug(), t.category(), t.name(), t.sort(), "A_a", "", "v", "UNKNOWN", false, t.sources(), t.path()))))
                .anyMatch(p -> p.contains("slug_prefix"));
        assertThat(validate(topic(t -> new TopicDoc(t.slug(), t.category(), t.name(), t.sort(), t.slugPrefix(), "", "v", "MAYBE", false, t.sources(), t.path()))))
                .anyMatch(p -> p.contains("default_evidence"));
        assertThat(validate(topic(t -> new TopicDoc(t.slug(), t.category(), t.name(), t.sort(), t.slugPrefix(), "", "v", "UNKNOWN", false,
                List.of(new SourceDoc("ftp://x", null)), t.path())))).anyMatch(p -> p.contains("출처 URL"));
    }

    @Test
    void 주제_접두사_중복을_잡는다() {
        TopicDoc a = topic(t -> t);
        TopicDoc b = new TopicDoc("t2", "c1", "주제2", 20, "aa", "", "v", "UNKNOWN", false, a.sources(), "content/c1/t2/_topic.yml");
        List<TopicDoc> topics = new ArrayList<>(List.of(a, b));
        assertThat(ContentValidator.validate(new ContentSet(List.of(category()), topics, List.of())))
                .anyMatch(p -> p.contains("겹친다"));
    }

    @Test
    void 공개_주제는_질문이_있어야_하고_전부_검수를_마쳐야_한다() {
        TopicDoc open = topic(t -> new TopicDoc(t.slug(), t.category(), t.name(), t.sort(), t.slugPrefix(), "", "v", "UNKNOWN", true, t.sources(), t.path()));
        assertThat(validate(open)).anyMatch(p -> p.contains("질문이 없는 주제"));
        assertThat(validate(open, question(q -> q))).anyMatch(p -> p.contains("검수 전"));
        QuestionDoc reviewed = question(q -> new QuestionDoc(q.slug(), q.topic(), q.tier(), q.difficulty(), q.title(), q.keywords(), false, "REVIEWED",
                Instant.parse("2026-10-20T00:00:00Z"), q.body(), q.path()));
        assertThat(validate(open, reviewed)).isEmpty();
    }

    @Test
    void 문제를_하나씩이_아니라_모두_모아서_돌려준다() {
        List<String> problems = validateQ(q -> new QuestionDoc("ZZ", "nope", "HARD", 9, "", List.of(), true, "DONE", null, "", q.path()));
        assertThat(problems.size()).isGreaterThanOrEqualTo(6);
    }

    private static QuestionDoc copy(QuestionDoc q, String slug, String topic, String tier, int difficulty) {
        return new QuestionDoc(slug, topic, tier, difficulty, q.title(), q.keywords(), q.hasExtra(), q.status(), q.reviewedAt(), q.body(), q.path());
    }
}
