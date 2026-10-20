package com.doro.interview.catalog.content;

import com.doro.interview.support.IsolatedSchema;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 실제 content/ 를 빈 DB(전용 스키마)에 앱 시작만으로 반영하는지 확인한다. 이 테스트에서는 load() 를 부르기 전에 이미 들어 있어야
 * 한다(= 기동 시 ApplicationRunner 가 동작한다). 콘텐츠를 늘리면 아래 기대 수를 갱신하는 커밋이 함께 와야 한다.
 */
@SpringBootTest
class RealContentLoadTest {

    private static final int QUESTIONS = 746;
    private static final int TOPICS = 35;
    private static final int TRICKY = 183;
    /** 검수 배치를 커밋할 때마다 올린다(B4: tx-01~25). */
    private static final int REVIEWED = 746;

    @DynamicPropertySource
    static void schema(DynamicPropertyRegistry registry) {
        String url = IsolatedSchema.createAndGetUrl();
        registry.add("spring.datasource.url", () -> url);
    }

    @Autowired
    JdbcTemplate jdbc;
    @Autowired
    ContentLoader loader;

    private long count(String sql) {
        return jdbc.queryForObject(sql, Long.class);
    }

    @Test
    void 앱_시작만으로_실제_콘텐츠가_들어간다() {
        assertThat(count("select count(*) from category")).isEqualTo(6);
        assertThat(count("select count(*) from topic")).isEqualTo(TOPICS);
        assertThat(count("select count(*) from question")).isEqualTo(QUESTIONS);
        assertThat(count("select count(*) from question where tier = 'TRICKY'")).isEqualTo(TRICKY);
    }

    @Test
    void 검수된_질문은_기대_수만큼이고_모든_주제는_공개다() {
        assertThat(count("select count(*) from question where status = 'REVIEWED' and reviewed_at is not null and not needs_review")).isEqualTo(REVIEWED);
        assertThat(count("select count(*) from question where status = 'DRAFT' and (reviewed_at is not null or needs_review)")).isZero();
        assertThat(count("select count(*) from question where status not in ('DRAFT', 'REVIEWED')")).isZero();
        assertThat(count("select count(*) from topic where not published")).isZero();
        assertThat(count("select count(*) from question where retired_at is not null")).isZero();
    }

    @Test
    void 주제마다_질문과_출처가_있다() {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                select t.slug, count(q.id) as n, jsonb_array_length(t.sources) as sources
                from topic t left join question q on q.topic_slug = t.slug group by t.slug, t.sources""");
        assertThat(rows).hasSize(TOPICS).allSatisfy(r -> {
            assertThat((Long) r.get("n")).isPositive();
            assertThat((Integer) r.get("sources")).isPositive();
        });
    }

    @Test
    void 다시_반영해도_전체_내용이_같다() {
        String digest = "select md5(string_agg(slug || content_hash || updated_at::text || id::text, ',' order by slug)) from question";
        String before = jdbc.queryForObject(digest, String.class);
        ContentLoader.LoadResult r = loader.load("classpath:content/");
        assertThat(r.questions()).isEqualTo(QUESTIONS);
        assertThat(r.retired()).isZero();
        assertThat(jdbc.queryForObject(digest, String.class)).isEqualTo(before);
        assertThat(count("select count(*) from question")).isEqualTo(QUESTIONS);
    }

    @Test
    void 코드_블록과_보충_표기가_DB에도_그대로_있다() {
        assertThat(count("select count(*) from question where answer_md like '%```%'")).isPositive();
        // has_extra 의 정의: 코드 블록·인라인 코드 밖에 (보충) 이 있다(화면의 보충 배지와 같은 기준). 모든 질문이 이를 지킨다.
        jdbc.queryForList("select slug, has_extra, answer_md from question").forEach(row ->
                assertThat(row.get("has_extra")).as(String.valueOf(row.get("slug")))
                        .isEqualTo(ExtraMark.present((String) row.get("answer_md"))));
    }
}
