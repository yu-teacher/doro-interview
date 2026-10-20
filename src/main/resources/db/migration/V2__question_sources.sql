-- 질문별 출처(그 질문을 검수하며 실제로 대조한 URL 목록). 메타데이터라 content_hash 에 넣지 않는다(docs/M1-PLAN.md D14).
ALTER TABLE question ADD COLUMN sources JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE question ADD CONSTRAINT question_sources_chk CHECK (jsonb_typeof(sources) = 'array');
