package com.doro.interview.reminder;

import java.time.ZoneId;
import java.util.List;

/**
 * 복습 알림 설정({@code interview.reminder.*}). 알림 서비스 호출자 토큰이 비어 있으면 기능 전체가 꺼진다(화면은 "알림을 쓸 수 없음" 으로 보인다).
 * 토큰은 환경변수로만 받고 어디에도 기록하지 않는다.
 */
public class ReminderProperties {

    /** 알림 서비스 주소(Docker 내부망). 게이트웨이를 거치지 않는다(알림 서비스는 X-Forwarded-* 가 붙은 내부 호출을 404 로 막는다). */
    private String notifyBaseUrl = "http://localhost:8089";
    /** 알림 서비스의 호출자 토큰(이름 interview). */
    private String serviceToken = "";
    /** 웹의 공개 하위 경로(예: /dev/interview). 알림을 눌렀을 때 열 주소와 알림 서비스에 알리는 범위가 이 경로 아래다. */
    private String webBasePath = "/interview";
    /** 틀린 날로부터 며칠째에 알릴지(달력 날짜 기준). */
    private List<Integer> intervalDays = List.of(1, 3, 7);
    /** 보내는 시각과 시간대. */
    private String cron = "0 0 20 * * *";
    private ZoneId zone = ZoneId.of("Asia/Seoul");

    public boolean enabled() {
        return !serviceToken.isBlank();
    }

    /** 앞뒤 슬래시를 정리한 공개 경로(항상 '/' 로 시작하고 끝난다). */
    public String scopePath() {
        String trimmed = webBasePath.strip().replaceAll("^/+|/+$", "");
        return trimmed.isEmpty() ? "/" : "/" + trimmed + "/";
    }

    public String getNotifyBaseUrl() { return notifyBaseUrl; }
    public void setNotifyBaseUrl(String notifyBaseUrl) { this.notifyBaseUrl = notifyBaseUrl == null ? "" : notifyBaseUrl.replaceAll("/+$", ""); }
    public String getServiceToken() { return serviceToken; }
    public void setServiceToken(String serviceToken) { this.serviceToken = serviceToken == null ? "" : serviceToken.strip(); }
    public String getWebBasePath() { return webBasePath; }
    public void setWebBasePath(String webBasePath) { this.webBasePath = webBasePath == null || webBasePath.isBlank() ? "/interview" : webBasePath; }
    public List<Integer> getIntervalDays() { return intervalDays; }
    public void setIntervalDays(List<Integer> intervalDays) { this.intervalDays = List.copyOf(intervalDays); }
    public String getCron() { return cron; }
    public void setCron(String cron) { this.cron = cron; }
    public ZoneId getZone() { return zone; }
    public void setZone(ZoneId zone) { this.zone = zone; }

    @Override
    public String toString() {
        // 토큰은 남기지 않는다
        return "ReminderProperties[notifyBaseUrl=" + notifyBaseUrl + ", enabled=" + enabled() + ", scopePath=" + scopePath() + ", intervalDays=" + intervalDays + "]";
    }
}
