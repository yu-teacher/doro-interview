package com.doro.interview.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpMethod;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.lang.reflect.Parameter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * API 표면 전체에 대한 구조적 보장(docs/M2-PLAN.md S4): 사용자 id 를 받는 입력이 없고, 공개 목록 밖의 모든 엔드포인트는
 * 로그인 없이는 401 이다. 새 엔드포인트가 생기면 이 시험이 자동으로 그것을 대상에 넣는다.
 */
class ApiSurfaceTest extends AbstractProgressApiTest {

    /** 로그인 없이 열려 있는 엔드포인트(읽기 전용 사전과 세션 조회). 새로 열려면 여기에 적어야 한다. */
    private static final Set<String> PUBLIC_GET = Set.of(
            "/api/v1/categories", "/api/v1/topics/{slug}", "/api/v1/questions/{slug}", "/api/v1/questions/featured", "/api/v1/concepts", "/api/v1/concepts/{slug}",
            "/api/v1/search", "/api/v1/bff/session");

    private static final Pattern USER_ID_NAME = Pattern.compile("(?i)user[-_]?id");

    @Autowired
    @Qualifier("requestMappingHandlerMapping")
    RequestMappingHandlerMapping mappings;

    private record Endpoint(HttpMethod method, String pattern, HandlerMethod handler) {
        @Override
        public String toString() {
            return method + " " + pattern;
        }
    }

    private List<Endpoint> endpoints() {
        List<Endpoint> all = new ArrayList<>();
        for (Map.Entry<RequestMappingInfo, HandlerMethod> e : mappings.getHandlerMethods().entrySet()) {
            Set<String> patterns = e.getKey().getPatternValues();
            Set<org.springframework.web.bind.annotation.RequestMethod> methods = e.getKey().getMethodsCondition().getMethods();
            for (String p : patterns) {
                if (!p.startsWith("/api/")) {
                    continue;
                }
                if (methods.isEmpty()) {
                    all.add(new Endpoint(HttpMethod.GET, p, e.getValue()));
                }
                for (var m : methods) {
                    all.add(new Endpoint(HttpMethod.valueOf(m.name()), p, e.getValue()));
                }
            }
        }
        return all;
    }

    @Test
    void 엔드포인트를_실제로_열거했다() {
        // 열거가 비어 있으면 아래 시험이 아무것도 검사하지 못하고 통과한다
        assertThat(endpoints()).hasSizeGreaterThanOrEqualTo(10);
        assertThat(endpoints()).extracting(Endpoint::pattern).contains("/api/v1/progress/{slug}", "/api/v1/progress/summary", "/api/v1/bff/session");
    }

    @Test
    void 사용자_id를_경로_쿼리_본문으로_받는_엔드포인트가_없다() {
        for (Endpoint e : endpoints()) {
            assertThat(e.pattern()).as(e + " 경로").doesNotMatch("(?is).*\\{\\s*user[-_]?id\\b.*");
            for (Parameter p : e.handler().getMethod().getParameters()) {
                PathVariable pv = p.getAnnotation(PathVariable.class);
                RequestParam rp = p.getAnnotation(RequestParam.class);
                if (pv != null) {
                    assertThat(nameOf(pv.value(), pv.name(), p)).as(e + " 경로 변수").doesNotMatch(USER_ID_NAME.pattern());
                }
                if (rp != null) {
                    assertThat(nameOf(rp.value(), rp.name(), p)).as(e + " 쿼리 파라미터").doesNotMatch(USER_ID_NAME.pattern());
                }
                if (p.getAnnotation(RequestBody.class) != null) {
                    for (var f : p.getType().getRecordComponents() == null ? new java.lang.reflect.RecordComponent[0] : p.getType().getRecordComponents()) {
                        assertThat(f.getName()).as(e + " 본문 필드").doesNotMatch(USER_ID_NAME.pattern());
                    }
                }
            }
        }
    }

    private static String nameOf(String value, String name, Parameter p) {
        if (!value.isEmpty()) {
            return value;
        }
        return name.isEmpty() ? p.getName() : name;
    }

    @Test
    void 공개_목록_밖의_모든_엔드포인트는_비로그인이면_401이다() throws Exception {
        int checked = 0;
        for (Endpoint e : endpoints()) {
            if (e.method() == HttpMethod.GET && PUBLIC_GET.contains(e.pattern())) {
                continue;
            }
            String url = e.pattern().replaceAll("\\{[^}]+}", "aa-01");
            mvc.perform(request(e.method(), url).contentType("application/json").content("{}"))
                    .andExpect(status().isUnauthorized());
            checked++;
        }
        assertThat(checked).as("보호되는 엔드포인트가 하나도 없으면 시험이 의미가 없다").isGreaterThanOrEqualTo(3);
        assertThat(rows()).isZero();
    }

    @Test
    void 공개_목록의_엔드포인트는_실제로_존재한다() {
        Set<String> actual = new java.util.HashSet<>();
        endpoints().forEach(e -> actual.add(e.pattern()));
        assertThat(actual).containsAll(PUBLIC_GET); // 목록이 낡아 구멍이 되는 것을 막는다
    }

    private int rows() {
        return jdbc.queryForObject("select count(*) from user_progress", Integer.class);
    }
}
