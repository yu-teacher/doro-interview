-- 질문별 내 노트(docs/M2-PLAN.md S5, D14). 사용자와 질문당 한 개, 일반 텍스트. 질문은 slug 로 가리키고 외래키는 없다(D7).
-- 길이 검사는 서비스와 이 CHECK 가 따로 한다(어느 한쪽이 빠져도 다른 쪽이 막는다). 빈 노트는 행을 두지 않는다.
CREATE TABLE my_note (
    user_id       UUID         NOT NULL,
    question_slug VARCHAR(60)  NOT NULL,
    body          TEXT         NOT NULL,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, question_slug),
    CONSTRAINT my_note_body_len_chk CHECK (char_length(body) BETWEEN 1 AND 2000)
);
