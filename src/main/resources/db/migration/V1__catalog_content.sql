-- 사전(catalog) 콘텐츠 테이블. 원본은 저장소의 content/ 파일이고 이 표는 시작할 때 반영한 사본이다(docs/DESIGN.md §5.3, §6).
-- 모듈 사이에는 외래키를 걸지 않는다(§6.0). 이 표들은 catalog 안에서만 서로 참조한다.

CREATE TABLE category (
    slug       VARCHAR(40)  PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    sort       INT          NOT NULL DEFAULT 0
);

CREATE TABLE topic (
    slug             VARCHAR(40)  PRIMARY KEY,
    category_slug    VARCHAR(40)  NOT NULL REFERENCES category (slug),
    name             VARCHAR(100) NOT NULL,
    sort             INT          NOT NULL DEFAULT 0,
    description      TEXT         NOT NULL DEFAULT '',
    -- [{"title": "...", "url": "https://..."}]: 출처는 질문이 아니라 주제(문서) 단위다(§3.3)
    sources          JSONB        NOT NULL DEFAULT '[]'::jsonb,
    base_version     VARCHAR(100),
    -- 표시가 없는 사실을 공식 문서 확인으로 볼 수 있는 문서인지(§3.3)
    default_evidence VARCHAR(10)  NOT NULL DEFAULT 'UNKNOWN',
    -- 주제 단위 노출 스위치. 검수가 끝나기 전에는 false 다(§5.1)
    published        BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT topic_default_evidence_chk CHECK (default_evidence IN ('OFFICIAL', 'UNKNOWN'))
);

CREATE INDEX topic_category_idx ON topic (category_slug, sort);

CREATE TABLE question (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    -- 제목에서 만들지 않는 안정 ID(예: tx-07). 파일에 고정되어 변환을 다시 돌려도 바뀌지 않는다
    slug          VARCHAR(60)  NOT NULL UNIQUE,
    topic_slug    VARCHAR(40)  NOT NULL REFERENCES topic (slug),
    sort          INT          NOT NULL DEFAULT 0,
    tier          VARCHAR(10)  NOT NULL,
    difficulty    SMALLINT     NOT NULL,
    title         TEXT         NOT NULL,
    answer_md     TEXT         NOT NULL,
    keywords      TEXT[]       NOT NULL,
    -- 본문에 (보충) 표기가 있는지
    has_extra     BOOLEAN      NOT NULL DEFAULT FALSE,
    content_hash  CHAR(64)     NOT NULL,
    status        VARCHAR(10)  NOT NULL DEFAULT 'DRAFT',
    reviewed_at   TIMESTAMP WITH TIME ZONE,
    -- 검수 뒤에 내용이 바뀌어 다시 확인해야 하는지(§5.3)
    needs_review  BOOLEAN      NOT NULL DEFAULT FALSE,
    -- 파일에서 사라진 질문은 지우지 않고 닫는다(학습 기록 보존)
    retired_at    TIMESTAMP WITH TIME ZONE,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT question_tier_chk       CHECK (tier IN ('BASIC', 'DEEP', 'TRICKY')),
    CONSTRAINT question_difficulty_chk CHECK (difficulty BETWEEN 1 AND 3),
    CONSTRAINT question_status_chk     CHECK (status IN ('DRAFT', 'REVIEWED')),
    CONSTRAINT question_keywords_chk   CHECK (cardinality(keywords) >= 1),
    CONSTRAINT question_hash_chk       CHECK (content_hash ~ '^[0-9a-f]{64}$')
);

CREATE INDEX question_topic_idx ON question (topic_slug, tier, sort);

-- 사람이 지정하는 질문 사이의 연결(꼬리 질문·관련 질문). 없어도 동작해야 한다(§3.3-1).
CREATE TABLE question_link (
    from_id UUID        NOT NULL REFERENCES question (id),
    to_id   UUID        NOT NULL REFERENCES question (id),
    kind    VARCHAR(10) NOT NULL,
    PRIMARY KEY (from_id, to_id, kind),
    CONSTRAINT question_link_kind_chk CHECK (kind IN ('FOLLOWUP', 'RELATED')),
    CONSTRAINT question_link_self_chk CHECK (from_id <> to_id)
);
