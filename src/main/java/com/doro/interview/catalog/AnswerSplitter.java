package com.doro.interview.catalog;

import java.util.ArrayList;
import java.util.List;

/**
 * 질문 본문을 "말로 하는 모범 답변"과 "상세(근거·코드·실험 설명)"로 나눈다(docs/M1-PLAN.md D13). 저장 형식은 그대로 두고 읽을 때 나눈다.
 *
 * <p>규칙: 본문은 {@code **모범 답변 …**} 줄로 시작하고, 그 다음 첫 문단(첫 빈 줄까지)이 모범 답변이다. 나머지가 상세다.
 * 시드 159개는 모두 이 모양이다(답변은 한 줄 문단). 헤더가 없으면 첫 문단을 답변으로 본다.
 * 답변 문단 안에는 코드 펜스를 두지 않는다(펜스가 나오면 문단이 끝난다).
 */
public final class AnswerSplitter {

    private AnswerSplitter() {
    }

    public record Split(String spokenAnswer, String detailMd) {
    }

    public static Split split(String body) {
        List<String> lines = new ArrayList<>(List.of(body.replace("\r\n", "\n").split("\n", -1)));
        int i = 0;
        while (i < lines.size() && lines.get(i).isBlank()) {
            i++;
        }
        if (i < lines.size() && lines.get(i).stripLeading().startsWith("**모범 답변")) {
            i++;
            while (i < lines.size() && lines.get(i).isBlank()) {
                i++;
            }
        }
        // 첫 문단: 빈 줄이나 코드 펜스 시작 전까지. 답변이 코드로 시작하면 답변은 비어 있고(검증기가 거부한다) 전부 상세가 된다.
        List<String> spoken = new ArrayList<>();
        while (i < lines.size()) {
            String line = lines.get(i);
            if (line.isBlank() || line.stripLeading().startsWith("```")) {
                break;
            }
            spoken.add(line);
            i++;
        }
        String detail = String.join("\n", lines.subList(i, lines.size())).strip();
        return new Split(String.join("\n", spoken).strip(), detail);
    }
}
