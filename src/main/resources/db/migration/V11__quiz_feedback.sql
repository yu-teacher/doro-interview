-- AI 피드백(docs/M6-PLAN.md D2): 문항마다 한 번만 만들고 저장한다(같은 요청을 다시 보내도 호출하지 않는다 = 비용 한 번).
-- user_id 는 한도 계산(사용자·전체, 최근 24시간)과 탈퇴 정리에 쓴다. 세션·문항에 외래키를 걸지 않는다(모듈 사이 규칙과 같다).
CREATE TABLE quiz_feedback (
    session_id UUID        NOT NULL,
    seq        INT         NOT NULL,
    user_id    UUID        NOT NULL,
    feedback   TEXT        NOT NULL,
    model      VARCHAR(60) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (session_id, seq),
    CONSTRAINT quiz_feedback_len_chk CHECK (char_length(feedback) BETWEEN 1 AND 2000)
);

CREATE INDEX quiz_feedback_user_idx ON quiz_feedback (user_id, created_at);
CREATE INDEX quiz_feedback_created_idx ON quiz_feedback (created_at);
