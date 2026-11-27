package com.doro.interview.reminder;

import com.doro.interview.account.AbstractAuthTest;
import com.doro.interview.catalog.content.ContentLoader;
import com.doro.interview.support.ContentFixture;
import com.doro.interview.support.FakeNotify;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.nio.file.Path;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/** 복습 알림: 누구에게 무엇을 보내는지(1·3·7일째, 체크·보이는 질문만), 요청 모양, 멱등 키, 알림 서비스가 죽었을 때. */
class ReviewReminderTest extends AbstractAuthTest {

    static final FakeNotify NOTIFY = new FakeNotify();
    static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    static final LocalDate TODAY = LocalDate.of(2026, 11, 27);
    static final String HEADER = "**모범 답변 (30~60초)**\n";

    @DynamicPropertySource
    static void notify(DynamicPropertyRegistry registry) {
        registry.add("interview.reminder.notify-base-url", NOTIFY::url);
        registry.add("interview.reminder.service-token", () -> FakeNotify.TOKEN);
        registry.add("interview.reminder.web-base-path", () -> "dev/interview/");
    }

    @AfterAll
    static void stopNotify() {
        NOTIFY.stop();
    }

    @Autowired
    ReviewReminder reminder;
    @Autowired
    ContentLoader loader;
    @Autowired
    ObjectMapper json;

    @TempDir
    Path tmp;

    final UUID alice = UUID.randomUUID();
    final UUID bob = UUID.randomUUID();
    final UUID carol = UUID.randomUUID();

    @BeforeEach
    void seed() {
        jdbc.execute("TRUNCATE quiz_feedback, my_question, quiz_item, quiz_session, quiz_question_stats, user_pref, user_progress, my_note, question_link, question_concept, question, concept, topic, category CASCADE");
        loader.load(new ContentFixture(tmp).category("c1")
                .topic("c1", "t1", "aa", true).topic("c1", "t2", "bb", false)
                .questionWith("c1", "t1", "aa-01", "DEEP", "심화 질문", List.of("k"), HEADER + "답.\n", "2026-10-20", List.of(), List.of())
                .questionWith("c1", "t1", "aa-02", "BASIC", "기본 질문", List.of("k"), HEADER + "답.\n", "2026-10-20", List.of(), List.of())
                .questionWith("c1", "t1", "aa-03", "TRICKY", "함정 질문", List.of("k"), HEADER + "답.\n", "2026-10-20", List.of(), List.of())
                .questionWith("c1", "t2", "bb-01", "BASIC", "비공개 질문", List.of("k"), HEADER + "답.\n", null, List.of(), List.of())
                .location());
        NOTIFY.reset();
    }

    void learned(UUID user, String... slugs) {
        for (String slug : slugs) {
            jdbc.update("INSERT INTO user_progress (user_id, question_slug) VALUES (?, ?)", user, slug);
        }
    }

    /** 서울 시각 기준 {@code daysAgo} 일 전 오후 3시에 마지막으로 이 결과를 냈다. */
    void last(UUID user, String slug, String result, int daysAgo) {
        OffsetDateTime at = TODAY.minusDays(daysAgo).atTime(15, 0).atZone(SEOUL).toOffsetDateTime();
        jdbc.update("""
                INSERT INTO quiz_question_stats (user_id, question_slug, ask_count, miss_count, last_asked_at, last_result)
                VALUES (?, ?, 1, ?, ?, ?)""", user, slug, "WRONG".equals(result) ? 1 : 0, at, result);
    }

    Map<UUID, JsonNode> sentByUser() {
        return NOTIFY.requests("POST", "/internal/v1/notifications").stream()
                .map(r -> json.readTree(r.body()))
                .collect(java.util.stream.Collectors.toMap(n -> UUID.fromString(n.path("recipients").get(0).asString()), n -> n));
    }

    @Test
    @DisplayName("틀린 지 1·3·7일째인 다시 공부 후보만 센다(2일째·당일·맞힌 것·체크 안 한 것·비공개 질문은 빠진다)")
    void picksOnlyDueCandidates() {
        learned(alice, "aa-01", "aa-02", "aa-03", "bb-01");
        last(alice, "aa-01", "WRONG", 1);
        last(alice, "aa-02", "WRONG", 7);
        last(alice, "aa-03", "WRONG", 2);
        last(alice, "bb-01", "WRONG", 3); // 비공개 주제: 보이지 않으니 세지 않는다
        learned(bob, "aa-01");
        last(bob, "aa-01", "CORRECT", 1); // 맞혔으면 후보가 아니다
        last(carol, "aa-01", "WRONG", 3); // 체크하지 않았으면 후보가 아니다

        Map<UUID, ReviewReminder.Due> due = reminder.dueOn(TODAY);

        assertThat(due).containsOnlyKeys(alice);
        assertThat(due.get(alice).count()).isEqualTo(2);
        assertThat(due.get(alice).firstTitle()).isEqualTo("심화 질문"); // slug 순 첫 번째(aa-01)
    }

    @Test
    @DisplayName("날짜 경계는 서울 시간 기준이다: 어제 23시 59분은 1일째, 오늘 0시 1분은 아직 아니다")
    void usesSeoulCalendarDays() {
        learned(alice, "aa-01", "aa-02");
        jdbc.update("INSERT INTO quiz_question_stats (user_id, question_slug, ask_count, miss_count, last_asked_at, last_result) VALUES (?, 'aa-01', 1, 1, ?, 'WRONG')",
                alice, TODAY.minusDays(1).atTime(23, 59).atZone(SEOUL).toOffsetDateTime());
        jdbc.update("INSERT INTO quiz_question_stats (user_id, question_slug, ask_count, miss_count, last_asked_at, last_result) VALUES (?, 'aa-02', 1, 1, ?, 'WRONG')",
                alice, TODAY.atTime(0, 1).atZone(SEOUL).toOffsetDateTime());

        assertThat(reminder.dueOn(TODAY).get(alice).count()).isEqualTo(1);
    }

    @Test
    @DisplayName("사용자마다 알림 한 건을 요청한다: 앱·종류·멱등 키(날짜+사용자)·공개 경로 아래 내 현황 주소, 호출자 토큰")
    void sendsOneRequestPerUser() {
        learned(alice, "aa-01", "aa-02");
        last(alice, "aa-01", "WRONG", 1);
        last(alice, "aa-02", "WRONG", 3);
        learned(bob, "aa-03");
        last(bob, "aa-03", "WRONG", 7);

        ReviewReminder.Run run = reminder.sendFor(TODAY);

        assertThat(run).isEqualTo(new ReviewReminder.Run(2, 2, 0));
        assertThat(NOTIFY.requests()).allMatch(r -> FakeNotify.TOKEN.equals(r.token()));
        JsonNode types = json.readTree(NOTIFY.requests("PUT", "/internal/v1/apps/interview/types").getFirst().body());
        assertThat(types.path("scopePath").asString()).isEqualTo("/dev/interview/");
        assertThat(types.path("types").get(0).path("type").asString()).isEqualTo("review");

        Map<UUID, JsonNode> sent = sentByUser();
        JsonNode a = sent.get(alice);
        assertThat(a.path("app").asString()).isEqualTo("interview");
        assertThat(a.path("type").asString()).isEqualTo("review");
        assertThat(a.path("idempotencyKey").asString()).isEqualTo("review:2026-11-27:" + alice);
        assertThat(a.path("url").asString()).isEqualTo("/dev/interview/stats");
        assertThat(a.path("title").asString()).isEqualTo("다시 볼 질문 2개");
        assertThat(a.path("body").asString()).isEqualTo("‘심화 질문’ 외 1개를 다시 풀어 볼까요?");
        assertThat(sent.get(bob).path("body").asString()).isEqualTo("‘함정 질문’ 다시 풀어 볼까요?");
    }

    @Test
    @DisplayName("알림 서비스가 실패 응답을 주면 실패로 세고 계속한다")
    void countsFailures() {
        learned(alice, "aa-01");
        last(alice, "aa-01", "WRONG", 1);
        NOTIFY.failWith(503);

        assertThat(reminder.sendFor(TODAY)).isEqualTo(new ReviewReminder.Run(1, 0, 1));
    }

    @Test
    @DisplayName("보낼 사람이 없으면 알림 요청이 없다")
    void nothingDue() {
        assertThat(reminder.sendFor(TODAY)).isEqualTo(new ReviewReminder.Run(0, 0, 0));
        assertThat(NOTIFY.requests("POST", "/internal/v1/notifications")).isEmpty();
    }
}
