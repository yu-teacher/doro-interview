-- 내 질문(docs/M4-PLAN.md §4): 사용자 한 명만 보는 질문. id 는 클라이언트가 만든 UUID 다(PUT 전용 게이트웨이 규칙과 멱등, D2).
-- 시험·체크는 이 질문을 slug 'my-<id>' 로 가리킨다(user_progress·quiz_* 의 question_slug, 모듈 사이 외래키 없음).
CREATE TABLE my_question (
    id           UUID PRIMARY KEY,
    user_id      UUID         NOT NULL,
    title        VARCHAR(200) NOT NULL,
    answer_text  TEXT         NOT NULL DEFAULT '',
    keywords     TEXT[]       NOT NULL DEFAULT '{}',
    tier         VARCHAR(8)   NOT NULL,
    source_label VARCHAR(40),
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT my_question_title_chk CHECK (char_length(title) BETWEEN 1 AND 200),
    CONSTRAINT my_question_answer_chk CHECK (char_length(answer_text) <= 4000),
    CONSTRAINT my_question_tier_chk CHECK (tier IN ('BASIC', 'DEEP', 'TRICKY')),
    CONSTRAINT my_question_source_chk CHECK (source_label IS NULL OR char_length(source_label) BETWEEN 1 AND 40)
);

CREATE INDEX my_question_user_idx ON my_question (user_id, created_at);
