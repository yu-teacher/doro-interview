-- 개념 태그(통제 어휘), 질문 연결 종류 확장, 필수도. 모두 메타데이터라 content_hash 에 넣지 않는다(docs/M1-PLAN.md D15~D17).

CREATE TABLE concept (
    slug        VARCHAR(40)  PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT         NOT NULL DEFAULT '',
    sort        INT          NOT NULL DEFAULT 0
);

CREATE TABLE question_concept (
    question_id  UUID        NOT NULL REFERENCES question (id),
    concept_slug VARCHAR(40) NOT NULL REFERENCES concept (slug),
    PRIMARY KEY (question_id, concept_slug)
);

CREATE INDEX question_concept_concept_idx ON question_concept (concept_slug);

-- 필수도: 1~3, 판단하지 않은 질문은 NULL(미분류)
ALTER TABLE question ADD COLUMN importance SMALLINT;
ALTER TABLE question ADD CONSTRAINT question_importance_chk CHECK (importance IS NULL OR importance BETWEEN 1 AND 3);

-- 질문 연결 종류에 PREREQ(먼저 이해해야 하는 질문)를 더한다
ALTER TABLE question_link DROP CONSTRAINT question_link_kind_chk;
ALTER TABLE question_link ADD CONSTRAINT question_link_kind_chk CHECK (kind IN ('FOLLOWUP', 'PREREQ', 'RELATED'));
