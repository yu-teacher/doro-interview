-- Doro 의 "영구 탈퇴한 사용자" 목록을 어디까지 처리했는지(증분 조회의 기준 시각). SDK 동기화가 쓴다(docs/M2-PLAN.md S7).
CREATE TABLE iam_sync_state (
    name       VARCHAR(50) PRIMARY KEY,
    cursor_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
