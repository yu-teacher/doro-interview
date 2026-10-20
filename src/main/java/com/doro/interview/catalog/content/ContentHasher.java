package com.doro.interview.catalog.content;

import com.doro.interview.catalog.content.ContentModels.QuestionDoc;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/** 질문의 "내용"(제목·키워드·본문)의 해시. 줄 끝 공백·줄바꿈 차이로는 바뀌지 않는다. */
public final class ContentHasher {

    private ContentHasher() {
    }

    public static String hash(QuestionDoc q) {
        StringBuilder sb = new StringBuilder();
        sb.append(normalize(q.title())).append('\u001e');
        for (String k : q.keywords()) {
            sb.append(normalize(k)).append('\u001f');
        }
        sb.append('\u001e').append(normalize(q.body()));
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(sb.toString().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    static String normalize(String text) {
        StringBuilder out = new StringBuilder();
        for (String line : text.replace("\r\n", "\n").split("\n", -1)) {
            out.append(line.stripTrailing()).append('\n');
        }
        return out.toString().strip();
    }
}
