/**
 * 복습 알림: 다시 공부 후보(체크했고 마지막 결과가 틀림)를 틀린 지 1·3·7일째에 알려 준다. 발송·기기·설정은 플랫폼 알림 서비스(doro-notify)가 맡고,
 * 이 모듈은 "누구에게 무엇을 보낼지" 만 정한다. 다른 모듈은 읽기 창구(catalog, mine.read, progress.read, quiz.read)로만 읽는다.
 */
package com.doro.interview.reminder;
