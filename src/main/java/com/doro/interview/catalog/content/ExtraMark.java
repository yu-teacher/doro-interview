package com.doro.interview.catalog.content;

/**
 * {@code has_extra} 의 정의: 본문의 **코드 블록·인라인 코드 밖**에 {@code (보충)} 표기가 있다.
 * 화면은 코드 안의 표기를 배지로 바꾸지 않으므로, 코드 안에만 있는 표기까지 세면 "보충 포함" 필터와 화면이 어긋난다.
 */
public final class ExtraMark {

    private static final String MARK = "(보충)";

    private ExtraMark() {
    }

    public static boolean present(String body) {
        StringBuilder prose = new StringBuilder();
        boolean fence = false;
        for (String line : body.replace("\r\n", "\n").split("\n", -1)) {
            if (line.stripLeading().startsWith("```")) {
                fence = !fence;
                continue;
            }
            if (!fence) {
                prose.append(line).append('\n');
            }
        }
        return prose.toString().replaceAll("`[^`\\n]*`", "").contains(MARK);
    }
}
