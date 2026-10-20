-- 사용자별 "완전히 학습함" 체크(docs/M2-PLAN.md S3). 질문은 외래키가 아니라 slug 로 가리킨다(모듈 사이 외래키 없음, D7).
-- 질문이 닫히거나 사라져도 행은 남는다(학습 기록 보존); 분모·분자는 조회할 때 보이는 질문으로만 센다.
CREATE TABLE user_progress (
    user_id       UUID         NOT NULL,
    question_slug VARCHAR(60)  NOT NULL,
    -- 처음 체크한 시각. 다시 체크해도 바뀌지 않는다.
    learned_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, question_slug)
);
