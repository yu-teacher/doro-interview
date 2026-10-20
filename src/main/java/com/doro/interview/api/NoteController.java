package com.doro.interview.api;

import com.doro.interview.account.CurrentUser;
import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import com.doro.interview.common.response.ApiResponse;
import com.doro.interview.progress.NoteService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * 내 노트 API(docs/M2-PLAN.md D14). 로그인이 필요하고(없으면 401), 사용자 id 는 토큰에서만 얻는다. 노트가 없으면 200 + {@code body:null}
 * 이고, 질문이 보이지 않으면 사전 API 와 같은 404 다. 응답은 사용자 개인 내용이라 어디에도 저장하지 않는다.
 */
@RestController
@RequestMapping("/api/v1/notes")
public class NoteController {

    private static final Pattern SLUG = Pattern.compile("[a-z0-9]+(-[a-z0-9]+)*");
    private static final int MAX_SLUG_LENGTH = 60;

    private final CurrentUser currentUser;
    private final NoteService notes;

    public NoteController(CurrentUser currentUser, NoteService notes) {
        this.currentUser = currentUser;
        this.notes = notes;
    }

    public record NoteResponse(String slug, String body, Instant updatedAt) {
        static NoteResponse of(String slug, Optional<NoteService.Note> note) {
            return note.map(n -> new NoteResponse(n.slug(), n.body(), n.updatedAt())).orElse(new NoteResponse(slug, null, null));
        }
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<NoteResponse>> get(@PathVariable String slug) {
        UUID user = currentUser.require();
        String valid = validSlug(slug);
        return noStore(ApiResponse.success(NoteResponse.of(valid, notes.get(user, valid))));
    }

    @PutMapping("/{slug}")
    public ResponseEntity<ApiResponse<NoteResponse>> put(@PathVariable String slug, @RequestBody Map<String, Object> request) {
        UUID user = currentUser.require();
        if (!request.keySet().equals(Set.of("body")) || !(request.get("body") instanceof String body)) {
            throw new InterviewException(ErrorCode.INVALID_INPUT);
        }
        String valid = validSlug(slug);
        return noStore(ApiResponse.success(NoteResponse.of(valid, notes.put(user, valid, body))));
    }

    private static String validSlug(String slug) {
        if (slug.length() > MAX_SLUG_LENGTH || !SLUG.matcher(slug).matches()) {
            throw new InterviewException(ErrorCode.NOT_FOUND);
        }
        return slug;
    }

    private static <T> ResponseEntity<ApiResponse<T>> noStore(ApiResponse<T> body) {
        return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "no-store").body(body);
    }
}
