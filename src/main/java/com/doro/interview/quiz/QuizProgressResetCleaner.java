package com.doro.interview.quiz;

import com.doro.interview.account.ProgressReset;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * "내 현황 초기화": 시험 기록(세션·문항·내 답·통계)을 지운다. 시험 설정(user_pref)은 기록이 아니라 설정이라 남긴다.
 * AI 피드백은 **최근 24시간 것을 남긴다**: 하루 한도(사용자·전체)가 이 표의 최근 24시간 행 수로 계산되므로, 전부 지우면 초기화로 한도를 되살릴 수 있다.
 * 남는 행은 세션이 없어도 화면에 나오지 않고(피드백은 세션·문항으로만 조회) 24시간 뒤 다음 초기화나 정리 때 사라진다.
 */
@Component
class QuizProgressResetCleaner {

    private final JdbcTemplate jdbc;

    QuizProgressResetCleaner(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @EventListener
    void on(ProgressReset event) {
        jdbc.update("DELETE FROM quiz_feedback WHERE user_id = ? AND created_at <= now() - interval '24 hours'", event.userId());
        jdbc.update("DELETE FROM quiz_item WHERE session_id IN (SELECT id FROM quiz_session WHERE user_id = ?)", event.userId());
        jdbc.update("DELETE FROM quiz_session WHERE user_id = ?", event.userId());
        jdbc.update("DELETE FROM quiz_question_stats WHERE user_id = ?", event.userId());
    }
}
