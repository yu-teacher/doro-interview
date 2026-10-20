package com.doro.interview.account;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/** 이 서비스 안의 사용자 사본(`interview_user`). 개인정보 없이 id 와 탈퇴 표식만 다룬다. */
@Service
public class AccountService {

    private final JdbcTemplate jdbc;

    public AccountService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
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
}
