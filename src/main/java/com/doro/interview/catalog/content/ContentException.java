package com.doro.interview.catalog.content;

import java.util.List;

/** 콘텐츠 파일이 형식에 맞지 않을 때. 문제를 모두 모아서 한 번에 보여 준다. */
public class ContentException extends RuntimeException {

    private final List<String> problems;

    public ContentException(List<String> problems) {
        super(problems.size() + "개의 콘텐츠 문제:\n - " + String.join("\n - ", problems));
        this.problems = List.copyOf(problems);
    }

    public ContentException(String problem) {
        this(List.of(problem));
    }

    public List<String> problems() {
        return problems;
    }
}
