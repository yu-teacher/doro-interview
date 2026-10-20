package com.doro.interview.progress;

import com.doro.interview.catalog.CatalogReader;
import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import com.doro.interview.progress.read.ProgressReader;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * "완전히 학습함" 체크. 사용자 id 는 항상 인자로 받는다(docs/M2-PLAN.md D5): 현재 사용자를 해석하는 곳은 api 컨트롤러뿐이다.
 * 질문·주제가 보이는지는 {@link CatalogReader} 가 판정하고, 보이지 않으면 없는 것과 같은 404 다.
 */
@Service
public class ProgressService {

    private final JdbcTemplate jdbc;
    private final CatalogReader catalog;
    private final ProgressReader reader;

    ProgressService(JdbcTemplate jdbc, CatalogReader catalog, ProgressReader reader) {
        this.jdbc = jdbc;
        this.catalog = catalog;
        this.reader = reader;
    }

    /** 멱등: 체크는 이미 있으면 그대로(처음 체크한 시각 유지), 해제는 없어도 오류가 아니다. */
    @Transactional
    public void setLearned(UUID userId, String questionSlug, boolean learned) {
        if (!catalog.isVisibleQuestion(questionSlug)) {
            throw new InterviewException(ErrorCode.NOT_FOUND);
        }
        apply(userId, List.of(questionSlug), learned);
    }

    /**
     * 주제의 보이는 질문 전체를 체크/해제한다. {@code expectedCount} 는 사용자가 확인창에서 본 개수이며, 실제와 다르면
     * (콘텐츠가 그 사이 바뀜) 아무것도 바꾸지 않고 409 를 던진다. 반영한 질문 수를 돌려준다.
     */
    @Transactional
    public int setTopic(UUID userId, String topicSlug, boolean learned, int expectedCount) {
        List<String> slugs = catalog.visibleQuestionSlugs(topicSlug).orElseThrow(() -> new InterviewException(ErrorCode.NOT_FOUND));
        if (slugs.size() != expectedCount) {
            throw new InterviewException(ErrorCode.PROGRESS_COUNT_MISMATCH);
        }
        apply(userId, slugs, learned);
        return slugs.size();
    }

    /** 보이는 주제별 (보이는 질문 수, 그중 체크한 수). 닫힌 질문에 남은 옛 기록은 세지 않는다. */
    @Transactional(readOnly = true)
    public Summary summary(UUID userId) {
        Set<String> learned = reader.learnedSlugs(userId);
        Map<String, List<String>> byTopic = catalog.visibleQuestionSlugsByTopic();
        List<TopicProgress> topics = new ArrayList<>();
        int total = 0;
        int done = 0;
        for (var e : byTopic.entrySet()) {
            int topicDone = (int) e.getValue().stream().filter(learned::contains).count();
            topics.add(new TopicProgress(e.getKey(), e.getValue().size(), topicDone));
            total += e.getValue().size();
            done += topicDone;
        }
        return new Summary(total, done, List.copyOf(topics));
    }

    private void apply(UUID userId, List<String> slugs, boolean learned) {
        if (learned) {
            jdbc.batchUpdate("INSERT INTO user_progress (user_id, question_slug) VALUES (?, ?) ON CONFLICT (user_id, question_slug) DO NOTHING",
                    slugs, slugs.size(), (ps, slug) -> {
                        ps.setObject(1, userId);
                        ps.setString(2, slug);
                    });
        } else {
            jdbc.batchUpdate("DELETE FROM user_progress WHERE user_id = ? AND question_slug = ?", slugs, slugs.size(), (ps, slug) -> {
                ps.setObject(1, userId);
                ps.setString(2, slug);
            });
        }
    }

    public record TopicProgress(String topicSlug, int total, int learned) {
    }

    public record Summary(int total, int learned, List<TopicProgress> topics) {
    }
}
