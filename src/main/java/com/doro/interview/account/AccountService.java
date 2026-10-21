package com.doro.interview.account;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** 이 서비스 안의 사용자 사본(`interview_user`). 개인정보 없이 id 와 탈퇴 표식만 다룬다. */
@Service
public class AccountService {

    private final JdbcTemplate jdbc;
    private final ApplicationEventPublisher events;

    public AccountService(JdbcTemplate jdbc, ApplicationEventPublisher events) {
        this.jdbc = jdbc;
        this.events = events;
    }

    /** 사용자의 학습 현황을 한 트랜잭션으로 초기화한다(리스너: progress 의 학습 체크, quiz 의 시험 기록). 노트·내 질문은 남는다. */
    @Transactional
    public void resetProgress(UUID userId) {
        events.publishEvent(new ProgressReset(userId));
    }

    /**
     * 사용자 행이 없으면 만들고, 탈퇴하지 않았으면 true. **이미 있는 행은 건드리지 않으므로** 탈퇴 표식이 있는 사용자는 되살아나지 않는다
     * (동시에 여러 요청이 와도 행은 하나다: `ON CONFLICT DO NOTHING`).
     */
    public boolean ensureActive(UUID userId) {
        jdbc.update("INSERT INTO interview_user (user_id) VALUES (?) ON CONFLICT (user_id) DO NOTHING", userId);
        return isActive(userId);
    }

    /** 읽기 전용: 탈퇴 표식이 없으면 true. 아직 행이 없는(처음 보는) 사용자도 true 다. */
    public boolean isActive(UUID userId) {
        List<Boolean> rows = jdbc.queryForList("SELECT deleted_at IS NULL FROM interview_user WHERE user_id = ?", Boolean.class, userId);
        return rows.isEmpty() || rows.get(0);
    }

    /**
     * 탈퇴 표식(무덤)을 남긴다. 방문한 적 없는 사용자도 행을 새로 만들어 표식을 둔다: 탈퇴 직후 아직 유효한 토큰의 첫 요청이
     * 행을 새로 만들어 되살아나는 경주를 막는다. 이미 표식이 있으면 아무것도 바꾸지 않고 false.
     *
     * @return 이번 호출이 표식을 처음 남겼으면 true
     */
    public boolean markDeleted(UUID userId) {
        return jdbc.update("""
                INSERT INTO interview_user (user_id, deleted_at) VALUES (?, now())
                ON CONFLICT (user_id) DO UPDATE SET deleted_at = now() WHERE interview_user.deleted_at IS NULL""", userId) > 0;
    }
}
