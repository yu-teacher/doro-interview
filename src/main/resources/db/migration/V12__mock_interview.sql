-- 꼬리질문 모의면접(docs/M7-PLAN.md D1·§4). 시험(quiz_session/quiz_item)은 "시작할 때 문항 순서를 전부 정한다"가 불변식이라
-- 답에 따라 문항이 늘어나는 모의면접은 별도 표에 둔다. 질문은 slug 로 가리키고 외래키는 없다(모듈 사이 규칙).
CREATE TABLE mock_session (
    id                UUID PRIMARY KEY,
    user_id           UUID    NOT NULL,
    -- 시작할 때 뽑은 본 질문 순서(D2). 꼬리질문은 답할 때 하나씩 정해 mock_turn 에 쌓인다.
    main_slugs        JSONB   NOT NULL,
    main_count        INT     NOT NULL,
    max_depth         INT     NOT NULL,
    include_unlearned BOOLEAN NOT NULL DEFAULT FALSE,
    -- {"categories":[...],"topics":[...],"tiers":[...]} 시작할 때의 범위(감사·재현용)
    scope             JSONB   NOT NULL DEFAULT '{}'::jsonb,
    -- M7b(AI) 자리. M7a 에서는 항상 FALSE 다.
    ai_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
    started_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at       TIMESTAMP WITH TIME ZONE,
    report            TEXT,
    CONSTRAINT mock_session_main_count_chk CHECK (main_count BETWEEN 1 AND 5),
    CONSTRAINT mock_session_depth_chk CHECK (max_depth BETWEEN 0 AND 3),
    CONSTRAINT mock_session_report_len_chk CHECK (report IS NULL OR char_length(report) <= 4000)
);

CREATE INDEX mock_session_user_idx ON mock_session (user_id, started_at);
CREATE INDEX mock_session_ai_idx ON mock_session (ai_enabled, started_at);

-- 한 턴 = 질문 하나. 다음 턴은 서버가 결과를 기록할 때 정해 같은 트랜잭션에서 저장한다(D4: 새로고침·재전송해도 같은 흐름).
-- result 가 NULL 인 턴은 세션마다 많아야 하나(지금 묻고 있는 턴)다.
CREATE TABLE mock_turn (
    session_id      UUID        NOT NULL,
    seq             INT         NOT NULL,
    parent_seq      INT,
    depth           INT         NOT NULL,
    origin          VARCHAR(10) NOT NULL,
    question_slug   VARCHAR(60),
    probe_text      TEXT,
    probe_keyword   TEXT,
    result          VARCHAR(10),
    seconds         INT,
    answer_text     TEXT,
    missed_keywords JSONB,
    answered_at     TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (session_id, seq),
    CONSTRAINT mock_turn_seq_chk CHECK (seq >= 1 AND (parent_seq IS NULL OR parent_seq < seq)),
    CONSTRAINT mock_turn_depth_chk CHECK (depth BETWEEN 0 AND 3),
    CONSTRAINT mock_turn_origin_chk CHECK (origin IN ('MAIN', 'LINK', 'PREREQ', 'AI_PROBE')),
    -- AI 탐침은 질문 은행에 없는 문장이다(slug 없음). 나머지는 실제 질문이다(탐침 문장 없음).
    CONSTRAINT mock_turn_source_chk CHECK (
        (origin = 'AI_PROBE' AND question_slug IS NULL AND probe_text IS NOT NULL)
        OR (origin <> 'AI_PROBE' AND question_slug IS NOT NULL AND probe_text IS NULL)),
    CONSTRAINT mock_turn_probe_len_chk CHECK (probe_text IS NULL OR char_length(probe_text) <= 200),
    CONSTRAINT mock_turn_result_chk CHECK (result IS NULL OR result IN ('CORRECT', 'WRONG', 'SKIPPED')),
    CONSTRAINT mock_turn_seconds_chk CHECK (seconds IS NULL OR seconds >= 0),
    CONSTRAINT mock_turn_answer_len_chk CHECK (answer_text IS NULL OR char_length(answer_text) BETWEEN 1 AND 2000)
);

-- 같은 세션에서 같은 질문은 한 번만(꼬리 연결에 순환이 있어도 끝난다)
CREATE UNIQUE INDEX mock_turn_unique_question ON mock_turn (session_id, question_slug) WHERE question_slug IS NOT NULL;
