package com.doro.interview.catalog.content;

import com.doro.interview.catalog.content.ContentModels.CategoryDoc;
import com.doro.interview.catalog.content.ContentModels.ConceptDoc;
import com.doro.interview.catalog.content.ContentModels.ContentSet;
import com.doro.interview.catalog.content.ContentModels.LinkDoc;
import com.doro.interview.catalog.content.ContentModels.QuestionDoc;
import com.doro.interview.catalog.content.ContentModels.SourceDoc;
import com.doro.interview.catalog.content.ContentModels.TopicDoc;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** 개념·연결·필수도(D15~D17) 검증 규칙이 각각 발동하는지(그리고 정상 입력은 통과하는지). */
class ContentRelationsValidatorTest {

    private static final List<ConceptDoc> CONCEPTS = List.of(
            new ConceptDoc("proxy", "프록시", "", 10, "content/_concepts.yml"),
            new ConceptDoc("tx", "트랜잭션 경계", "", 20, "content/_concepts.yml"),
            new ConceptDoc("jpa", "영속성 컨텍스트", "", 30, "content/_concepts.yml"),
            new ConceptDoc("ioc", "제어의 역전", "", 40, "content/_concepts.yml"));

    private static QuestionDoc q(String slug, List<String> concepts, Integer importance, List<LinkDoc> links) {
        return new QuestionDoc(slug, "t1", "BASIC", 1, "제목 " + slug, List.of("키워드"), false, "DRAFT", null,
                "**모범 답변**\n본문\n", List.of(), concepts, importance, links, "content/c1/t1/" + slug + ".md");
    }

    private static List<String> validate(List<ConceptDoc> concepts, QuestionDoc... qs) {
        TopicDoc topic = new TopicDoc("t1", "c1", "주제", 10, "aa", "", "v1", "UNKNOWN", false,
                List.of(new SourceDoc("https://example.com", null)), "content/c1/t1/_topic.yml");
        return ContentValidator.validate(new ContentSet(List.of(new CategoryDoc("c1", "c", 10, "content/c1/_category.yml")),
                List.of(topic), List.of(qs), concepts));
    }

    private static LinkDoc link(String to, String kind) {
        return new LinkDoc(to, kind);
    }

    @Test
    void 개념_연결_필수도가_모두_올바르면_통과한다() {
        assertThat(validate(CONCEPTS,
                q("aa-01", List.of("proxy", "tx"), 3, List.of(link("aa-02", "FOLLOWUP"), link("aa-03", "PREREQ"), link("aa-02", "RELATED"))),
                q("aa-02", List.of("proxy"), 2, List.of()),
                q("aa-03", List.of(), null, List.of()))).isEmpty();
    }

    @Test
    void 메타데이터가_전혀_없어도_통과한다() {
        assertThat(validate(List.of(), q("aa-01", List.of(), null, List.of()))).isEmpty();
    }

    // -- 개념

    @Test
    void 사전에_없는_개념을_잡는다() {
        assertThat(validate(CONCEPTS, q("aa-01", List.of("nope"), null, List.of()))).anyMatch(p -> p.contains("개념 사전") && p.contains("nope"));
    }

    @Test
    void 개념은_질문당_3개까지다() {
        assertThat(validate(CONCEPTS, q("aa-01", List.of("proxy", "tx", "jpa", "ioc"), null, List.of())))
                .anyMatch(p -> p.contains("3개 이하"));
        assertThat(validate(CONCEPTS, q("aa-01", List.of("proxy", "tx", "jpa"), null, List.of()))).isEmpty();
    }

    @Test
    void 같은_개념의_중복을_잡는다() {
        assertThat(validate(CONCEPTS, q("aa-01", List.of("proxy", "proxy"), null, List.of()))).anyMatch(p -> p.contains("중복"));
    }

    @Test
    void 개념_사전의_형식과_중복을_잡는다() {
        List<ConceptDoc> bad = List.of(new ConceptDoc("Bad_Slug", "이름", "", 10, "content/_concepts.yml"),
                new ConceptDoc("dup", "하나", "", 20, "content/_concepts.yml"), new ConceptDoc("dup", "둘", "", 30, "content/_concepts.yml"),
                new ConceptDoc("blank", " ", "", 40, "content/_concepts.yml"));
        List<String> problems = validate(bad, q("aa-01", List.of(), null, List.of()));
        assertThat(problems).anyMatch(p -> p.contains("개념 slug 형식"));
        assertThat(problems).anyMatch(p -> p.contains("개념 slug 가 중복"));
        assertThat(problems).anyMatch(p -> p.contains("개념 이름이 비었"));
    }

    // -- 필수도

    @Test
    void 필수도_범위를_잡는다() {
        assertThat(validate(CONCEPTS, q("aa-01", List.of(), 0, List.of()))).anyMatch(p -> p.contains("importance"));
        assertThat(validate(CONCEPTS, q("aa-01", List.of(), 4, List.of()))).anyMatch(p -> p.contains("importance"));
        assertThat(validate(CONCEPTS, q("aa-01", List.of(), 1, List.of()))).isEmpty();
        assertThat(validate(CONCEPTS, q("aa-01", List.of(), 3, List.of()))).isEmpty();
    }

    // -- 연결

    @Test
    void 없는_대상과_자기_연결과_알_수_없는_종류를_잡는다() {
        QuestionDoc a = q("aa-01", List.of(), null, List.of(link("nope", "FOLLOWUP"), link("aa-01", "RELATED"), link("aa-02", "WHATEVER")));
        List<String> problems = validate(CONCEPTS, a, q("aa-02", List.of(), null, List.of()));
        assertThat(problems).anyMatch(p -> p.contains("없는 질문을 가리키는"));
        assertThat(problems).anyMatch(p -> p.contains("자기 자신"));
        assertThat(problems).anyMatch(p -> p.contains("연결 종류가 틀렸다"));
    }

    @Test
    void 같은_대상과_종류의_중복을_잡고_종류가_다르면_허용한다() {
        assertThat(validate(CONCEPTS, q("aa-01", List.of(), null, List.of(link("aa-02", "FOLLOWUP"), link("aa-02", "FOLLOWUP"))),
                q("aa-02", List.of(), null, List.of()))).anyMatch(p -> p.contains("중복"));
        assertThat(validate(CONCEPTS, q("aa-01", List.of(), null, List.of(link("aa-02", "FOLLOWUP"), link("aa-02", "RELATED"))),
                q("aa-02", List.of(), null, List.of()))).isEmpty();
    }

    @Test
    void 연결은_질문당_5개까지다() {
        List<LinkDoc> six = new ArrayList<>();
        List<QuestionDoc> all = new ArrayList<>();
        for (int i = 2; i <= 7; i++) {
            six.add(link("aa-0" + i, "RELATED"));
            all.add(q("aa-0" + i, List.of(), null, List.of()));
        }
        all.add(0, q("aa-01", List.of(), null, six));
        assertThat(validate(CONCEPTS, all.toArray(QuestionDoc[]::new))).anyMatch(p -> p.contains("5개 이하"));
        all.set(0, q("aa-01", List.of(), null, six.subList(0, 5)));
        assertThat(validate(CONCEPTS, all.toArray(QuestionDoc[]::new))).isEmpty();
    }

    @Test
    void PREREQ_순환을_잡는다() {
        List<String> problems = validate(CONCEPTS,
                q("aa-01", List.of(), null, List.of(link("aa-02", "PREREQ"))),
                q("aa-02", List.of(), null, List.of(link("aa-03", "PREREQ"))),
                q("aa-03", List.of(), null, List.of(link("aa-01", "PREREQ"))));
        assertThat(problems).anyMatch(p -> p.contains("PREREQ") && p.contains("순환") && p.contains("aa-01 -> aa-02 -> aa-03 -> aa-01"));
    }

    @Test
    void FOLLOWUP_순환을_잡는다() {
        assertThat(validate(CONCEPTS,
                q("aa-01", List.of(), null, List.of(link("aa-02", "FOLLOWUP"))),
                q("aa-02", List.of(), null, List.of(link("aa-01", "FOLLOWUP")))))
                .anyMatch(p -> p.contains("FOLLOWUP") && p.contains("순환"));
    }

    @Test
    void RELATED는_서로_가리켜도_순환이_아니다() {
        assertThat(validate(CONCEPTS,
                q("aa-01", List.of(), null, List.of(link("aa-02", "RELATED"))),
                q("aa-02", List.of(), null, List.of(link("aa-01", "RELATED"))))).isEmpty();
    }

    @Test
    void 종류가_다르면_반대_방향이어도_순환이_아니다() {
        assertThat(validate(CONCEPTS,
                q("aa-01", List.of(), null, List.of(link("aa-02", "FOLLOWUP"))),
                q("aa-02", List.of(), null, List.of(link("aa-01", "PREREQ"))))).isEmpty();
    }

    @Test
    void 갈라졌다_다시_만나는_흐름은_순환이_아니다() {
        assertThat(validate(CONCEPTS,
                q("aa-01", List.of(), null, List.of(link("aa-02", "FOLLOWUP"), link("aa-03", "FOLLOWUP"))),
                q("aa-02", List.of(), null, List.of(link("aa-04", "FOLLOWUP"))),
                q("aa-03", List.of(), null, List.of(link("aa-04", "FOLLOWUP"))),
                q("aa-04", List.of(), null, List.of()))).isEmpty();
    }
}
