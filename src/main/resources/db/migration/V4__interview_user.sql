-- 이 서비스 안의 사용자 사본(원본은 Doro IAM). 개인정보(이메일·이름·닉네임)를 갖지 않고 id 만 갖는다(docs/M2-PLAN.md D6).
-- 행은 ① 로그인 뒤 첫 세션 조회 ② 영구 탈퇴 동기화의 무덤 표식(deleted_at)으로 생긴다. 다른 모듈의 표와는 외래키로 잇지 않는다.
CREATE TABLE interview_user (
    user_id    UUID        PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);
