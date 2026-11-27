package com.doro.interview.reminder;

import com.doro.interview.catalog.CatalogReader;
import com.doro.interview.mine.read.MyQuestionReader;
import com.doro.interview.progress.read.ProgressReader;
import com.doro.interview.quiz.read.QuizStatsReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.UUID;

/**
 * 복습 알림. 매일 정해진 시각에, 다시 공부 후보(체크했고 마지막 결과가 틀림) 중 **틀린 지 1·3·7일째**(달력 날짜, 설정 시간대 기준)인 질문이 있는
 * 사용자에게 알림 한 건을 요청한다. 다시 풀어 맞히면 후보에서 빠지고, 또 틀리면 그날부터 다시 센다.
 * <ul>
 *   <li>받을지 말지(기기 등록·끄기)는 알림 서비스가 판정한다: 이 앱으로 기기를 등록하지 않은 사용자에게는 아무것도 가지 않는다.</li>
 *   <li>멱등 키가 (날짜, 사용자)라서 같은 날 두 번 돌아도(재시작·수동 실행) 한 번만 간다.</li>
 *   <li>보낼 시각에 서비스가 내려가 있었으면 그날 알림은 건너뛴다(다음 날 7일째 질문 등은 그대로 간다).</li>
 * </ul>
 */
@Component
public class ReviewReminder {

    static final String TYPE = "review";
    static final String TAG = "interview-review";
    static final long TTL_SECONDS = 12 * 60 * 60;

    private static final Logger log = LoggerFactory.getLogger(ReviewReminder.class);

    /** 한 사용자에게 오늘 알릴 내용: 질문 수와 대표 질문 제목(slug 순 첫 번째). */
    record Due(int count, String firstTitle) {
    }

    /** 한 번 실행한 결과(로그·시험용). */
    record Run(int users, int requested, int failed) {
    }

    private final ReminderProperties properties;
    private final NotifyClient notify;
    private final QuizStatsReader stats;
    private final ProgressReader progress;
    private final CatalogReader catalog;
    private final MyQuestionReader mine;
    private final Clock clock;

    @Autowired
    ReviewReminder(ReminderProperties properties, NotifyClient notify, QuizStatsReader stats, ProgressReader progress, CatalogReader catalog, MyQuestionReader mine) {
        this(properties, notify, stats, progress, catalog, mine, Clock.systemUTC());
    }

    ReviewReminder(ReminderProperties properties, NotifyClient notify, QuizStatsReader stats, ProgressReader progress, CatalogReader catalog, MyQuestionReader mine, Clock clock) {
        this.properties = properties;
        this.notify = notify;
        this.stats = stats;
        this.progress = progress;
        this.catalog = catalog;
        this.mine = mine;
        this.clock = clock;
    }

    /** 기동할 때 알림 종류와 공개 경로를 알림 서비스에 등록한다(멱등). 실패해도 기동은 계속하고, 보내기 전에 다시 시도한다. */
    @EventListener(ApplicationReadyEvent.class)
    public void registerOnStartup() {
        if (properties.enabled()) {
            registerType();
        }
    }

    @Scheduled(cron = "${interview.reminder.cron:0 0 20 * * *}", zone = "${interview.reminder.zone:Asia/Seoul}")
    public void runScheduled() {
        if (!properties.enabled()) {
            return;
        }
        Run run = sendFor(LocalDate.now(clock.withZone(properties.getZone())));
        log.info("review reminders: users={}, requested={}, failed={}", run.users(), run.requested(), run.failed());
    }

    boolean registerType() {
        Map<String, Object> type = new LinkedHashMap<>();
        type.put("type", TYPE);
        type.put("label", "복습 알림");
        type.put("description", "틀린 질문을 1·3·7일째에 다시 알려 줘요");
        try {
            return notify.put("/internal/v1/apps/" + NotifyClient.APP + "/types", Map.of("types", List.of(type), "scopePath", properties.scopePath()), null).ok();
        } catch (NotifyClient.UnreachableException e) {
            log.warn("notify type registration skipped: {}", e.getMessage());
            return false;
        }
    }

    /** 이 날짜(설정 시간대)에 보낼 알림을 계산해서 요청한다. 알림 서비스에 닿지 못하면 남은 사용자는 건너뛴다(시간 초과를 사용자 수만큼 기다리지 않게). */
    Run sendFor(LocalDate today) {
        registerType();
        Map<UUID, Due> due = dueOn(today);
        int requested = 0;
        int failed = 0;
        Instant expires = today.plusDays(1).atStartOfDay(properties.getZone()).toInstant();
        for (Map.Entry<UUID, Due> e : due.entrySet()) {
            try {
                if (notify.post("/internal/v1/notifications", request(today, e.getKey(), e.getValue(), expires)).ok()) {
                    requested++;
                } else {
                    failed++;
                }
            } catch (NotifyClient.UnreachableException ex) {
                log.warn("review reminders stopped: {}", ex.getMessage());
                failed += due.size() - requested - failed;
                break;
            }
        }
        return new Run(due.size(), requested, failed);
    }

    /** 사용자별로 오늘 알릴 질문. 후보 규칙은 내 현황 화면과 같다: 체크했고, 마지막 결과가 틀림이고, 지금 보이는 질문(공용 또는 내 질문). */
    Map<UUID, Due> dueOn(LocalDate today) {
        ZoneId zone = properties.getZone();
        Map<UUID, Set<String>> wrong = new TreeMap<>();
        for (int days : new TreeSet<>(properties.getIntervalDays())) {
            LocalDate day = today.minusDays(days);
            stats.lastWrongAskedBetween(day.atStartOfDay(zone).toInstant(), day.plusDays(1).atStartOfDay(zone).toInstant())
                    .forEach((user, slugs) -> wrong.computeIfAbsent(user, k -> new HashSet<>()).addAll(slugs));
        }
        Map<UUID, Due> out = new LinkedHashMap<>();
        wrong.forEach((user, slugs) -> {
            Set<String> learned = progress.learnedAmong(user, slugs);
            if (learned.isEmpty()) {
                return;
            }
            Map<String, String> titles = new TreeMap<>();
            catalog.visibleQuestionHeadings(learned).forEach((slug, h) -> titles.put(slug, h.title()));
            mine.headings(user, learned).forEach((slug, h) -> titles.put(slug, h.title()));
            if (!titles.isEmpty()) {
                out.put(user, new Due(titles.size(), titles.values().iterator().next()));
            }
        });
        return out;
    }

    private Map<String, Object> request(LocalDate today, UUID user, Due due, Instant expires) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("idempotencyKey", "review:" + today + ":" + user);
        body.put("app", NotifyClient.APP);
        body.put("type", TYPE);
        body.put("recipients", List.of(user));
        body.put("title", "다시 볼 질문 " + due.count() + "개");
        body.put("body", clip(due.count() == 1 ? "‘" + due.firstTitle() + "’ 다시 풀어 볼까요?" : "‘" + due.firstTitle() + "’ 외 " + (due.count() - 1) + "개를 다시 풀어 볼까요?", 200));
        body.put("tag", TAG);
        body.put("url", properties.scopePath() + "stats");
        body.put("ttlSeconds", TTL_SECONDS);
        body.put("expiresAt", expires.toString());
        return body;
    }

    private static String clip(String text, int max) {
        return text.length() <= max ? text : text.substring(0, max - 1) + "…";
    }
}
