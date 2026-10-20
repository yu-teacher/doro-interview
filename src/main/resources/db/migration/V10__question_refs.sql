-- 책·원저자 자료 근거(설계 패턴·아키텍처 주제의 예외, docs/DESIGN.md §4): "책 제목, 장·절, p.45" 같은 문자열 목록.
-- URL 이 아니라 쪽수까지 적어야 해서 sources 와 따로 둔다. 해시에는 넣지 않는다(sources 처럼 메타데이터).
ALTER TABLE question ADD COLUMN refs JSONB NOT NULL DEFAULT '[]'::jsonb;
