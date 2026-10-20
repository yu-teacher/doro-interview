-- 랜덤 면접(docs/M3-PLAN.md §4). 질문은 slug 로 가리키고 외래키는 없다(모듈 사이 외래키 금지, M2 D7).
-- 세션 id 는 클라이언트가 만든 UUID 다(시험 쓰기는 PUT 만 통과하는 게이트웨이 규칙과 멱등을 위해, M3 D1).
CREATE TABLE quiz_session (
    id                UUID PRIMARY KEY,
    user_id           UUID    NOT NULL,
    -- {"categories":[...],"topics":[...],"tiers":[...]} 시작할 때의 범위(감사·재현용)
    scope             JSONB   NOT NULL DEFAULT '{}'::jsonb,
    include_unlearned BOOLEAN NOT NULL DEFAULT FALSE,
    planned_count     INT     NOT NULL,
    started_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at       TIMESTAMP WITH TIME ZONE,
    CONSTRAINT quiz_session_count_chk CHECK (planned_count BETWEEN 1 AND 30)
);

CREATE INDEX quiz_session_user_idx ON quiz_session (user_id, started_at);

-- 문제 순서는 세션을 시작할 때 전부 정한다(M3 D2). result 가 NULL 이면 아직 안 푼 문항이다.
CREATE TABLE quiz_item (
    session_id    UUID        NOT NULL,
    seq           INT         NOT NULL,
    question_slug VARCHAR(60) NOT NULL,
    result        VARCHAR(10),
    seconds       INT,
    answer_text   TEXT,
    answered_at   TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (session_id, seq),
    -- 같은 세션에서 같은 질문은 한 번만
    CONSTRAINT quiz_item_unique_question UNIQUE (session_id, question_slug),
    CONSTRAINT quiz_item_seq_chk CHECK (seq >= 1),
    CONSTRAINT quiz_item_result_chk CHECK (result IS NULL OR result IN ('CORRECT', 'WRONG', 'SKIPPED')),
    CONSTRAINT quiz_item_seconds_chk CHECK (seconds IS NULL OR seconds >= 0),
    CONSTRAINT quiz_item_answer_len_chk CHECK (answer_text IS NULL OR char_length(answer_text) BETWEEN 1 AND 2000)
);

-- 시험이 소유하는 통계: 가중 랜덤과 "다시 공부 후보" 의 원본이다. 진도(user_progress)와 별개다.
CREATE TABLE quiz_question_stats (
    user_id       UUID        NOT NULL,
    question_slug VARCHAR(60) NOT NULL,
    ask_count     INT         NOT NULL DEFAULT 0,
    miss_count    INT         NOT NULL DEFAULT 0,
    last_asked_at TIMESTAMP WITH TIME ZONE,
    last_result   VARCHAR(10),
    PRIMARY KEY (user_id, question_slug),
    CONSTRAINT quiz_stats_counts_chk CHECK (ask_count >= 0 AND miss_count >= 0 AND miss_count <= ask_count),
    CONSTRAINT quiz_stats_result_chk CHECK (last_result IS NULL OR last_result IN ('CORRECT', 'WRONG'))
);

CREATE TABLE user_pref (
    user_id                  UUID PRIMARY KEY,
    include_unlearned_default BOOLEAN NOT NULL DEFAULT FALSE
);
