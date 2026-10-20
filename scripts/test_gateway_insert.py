"""gateway_insert.py 단위 테스트(docker·서버 없이). 실제 게이트웨이 기준 설정(../Doro/gateway/nginx.conf)이 있으면 그것으로도 시험한다."""
import difflib
import re
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import gateway_insert as gi  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
PIECE = (ROOT / "deploy" / "gateway-interview.conf").read_text(encoding="utf-8")
REAL = ROOT.parent / "Doro" / "gateway" / "nginx.conf"

BASE = """events {}
http {
    upstream portal_upstream {
        server doro-web-portal:80;
    }

    upstream menu_upstream {
        server doro-menu:80;
    }

    upstream bff_upstream {
        server doro-bff-api:8085;
    }

    map $bff_token $bff_authorization {
        ""      $http_authorization;
        default "Bearer $bff_token";
    }

    upstream games_web_upstream {
        server doro-games-web:80;
    }

    server {
        listen 443 ssl;

        location @bff_forbidden {
            return 403 'x';
        }
        location @bff_unavailable {
            return 503 'x';
        }

        location / {
            proxy_pass http://portal_upstream;
        }

        # 8. DORO Menu Frontend (오늘 뭐 먹지? 도로메뉴 서브 서비스)
        location /menu/ {
            proxy_pass http://menu_upstream;
        }
    }
}
"""


def added_only(before: str, after: str) -> bool:
    """after 는 before 에 줄을 더하기만 한 것이다(원래 줄이 하나도 바뀌거나 사라지지 않았다)."""
    diff = list(difflib.unified_diff(before.splitlines(), after.splitlines(), lineterm="", n=0))
    return not any(line.startswith("-") and not line.startswith("---") for line in diff)


class InsertTest(unittest.TestCase):
    def test_조각의_구조는_upstream_2개_location_7개다(self):
        body = "\n".join(l for l in PIECE.splitlines() if not l.lstrip().startswith("#"))
        self.assertEqual(len(re.findall(r"upstream\s+\w+\s*\{", body)), 2)
        self.assertEqual(len(gi.top_level_locations(body)), 7)

    def test_upstream_2개와_location_7개를_한_번씩_넣고_원래_줄은_그대로다(self):
        state, out = gi.insert_piece(BASE, PIECE)
        self.assertEqual(state, "changed")
        self.assertEqual(out.count("upstream interview_web_upstream"), 1)
        self.assertEqual(out.count("upstream interview_api_upstream"), 1)
        for loc in ("location /interview/api/ {", "location /interview/ {", "location = /interview {",
                    "location = /interview/api/v1/bff/login {", "location = /interview/api/v1/bff/callback {",
                    "location = /interview/api/v1/bff/logout {", "location = /_bff_auth_interview {"):
            self.assertEqual(out.count(loc), 1, loc)
        self.assertTrue(added_only(BASE, out))

    def test_upstream_은_menu_upstream_바로_아래고_location_은_메뉴_구획_주석_바로_위다(self):
        _, out = gi.insert_piece(BASE, PIECE)
        self.assertLess(out.index("upstream menu_upstream"), out.index("upstream interview_web_upstream"))
        self.assertLess(out.index("upstream interview_api_upstream"), out.index("upstream games_web_upstream"))
        self.assertLess(out.index("location = /interview {"), out.index("# 8. DORO Menu Frontend"))
        self.assertLess(out.index("# 도로 면접 (/interview/)"), out.index("location /interview/api/ {"))

    def test_두_번째는_already_이고_결과가_같다(self):
        _, once = gi.insert_piece(BASE, PIECE)
        state, twice = gi.insert_piece(once, PIECE)
        self.assertEqual(state, "already")
        self.assertEqual(twice, once)

    def test_조각의_주석은_넣지_않는다(self):
        _, out = gi.insert_piece(BASE, PIECE)
        self.assertNotIn("규칙(Doro docs", out)
        self.assertNotIn("1) http 블록의", out)

    def test_들여쓰기가_맞다(self):
        _, out = gi.insert_piece(BASE, PIECE)
        self.assertIn("\n    upstream interview_web_upstream {\n        server doro-interview-web:80;\n    }\n", out)
        self.assertIn("\n        location /interview/api/ {\n            limit_except GET HEAD PUT { deny all; }\n", out)
        self.assertIn("\n        location = /interview {\n            return 301 /interview/;\n        }\n", out)

    def test_report_only_는_CSP_헤더만_바꾼다(self):
        _, enforced = gi.insert_piece(BASE, PIECE)
        _, report = gi.insert_piece(BASE, PIECE, report_only=True)
        self.assertIn("add_header Content-Security-Policy \"", enforced)
        self.assertNotIn("Report-Only", enforced)
        self.assertEqual(report.count("add_header Content-Security-Policy-Report-Only \""), 1)
        self.assertNotIn("add_header Content-Security-Policy \"", report)
        self.assertEqual(report.replace("Content-Security-Policy-Report-Only", "Content-Security-Policy"), enforced)

    def test_refresh_는_기존_블록을_걷어내고_조각대로_다시_쓴다(self):
        _, once = gi.insert_piece(BASE, PIECE, report_only=True)
        changed_piece = PIECE.replace("script-src 'self';", "script-src 'self' 'sha256-abc';")
        state, out = gi.insert_piece(once, changed_piece, refresh=True)
        self.assertEqual(state, "changed")
        self.assertIn("'sha256-abc'", out)
        self.assertEqual(out.count("upstream interview_web_upstream"), 1)
        self.assertEqual(out.count("location /interview/ {"), 1)
        self.assertNotIn("Report-Only", out)  # refresh 는 --report-only 를 다시 주지 않으면 강제 모드로 돌아온다
        self.assertTrue(added_only(BASE, out))

    def test_refresh_는_들어_있지_않으면_그냥_넣는다(self):
        state, out = gi.insert_piece(BASE, PIECE, refresh=True)
        self.assertEqual(state, "changed")
        self.assertEqual(out.count("upstream interview_web_upstream"), 1)

    def test_refresh_는_블록이_손상됐으면_거부한다(self):
        _, once = gi.insert_piece(BASE, PIECE)
        broken = once.replace("        location = /interview {\n            return 301 /interview/;\n        }\n\n", "")
        with self.assertRaisesRegex(gi.GatewayInsertError, "걷어내지 못했다"):
            gi.insert_piece(broken, PIECE, refresh=True)

    def test_menu_upstream_이_없으면_거부한다(self):
        with self.assertRaisesRegex(gi.GatewayInsertError, "menu_upstream"):
            gi.insert_piece(BASE.replace("menu_upstream", "other_upstream"), PIECE)

    def test_삽입_위치를_정확히_하나_못_찾으면_거부한다(self):
        no_anchor = BASE.replace("        # 8. DORO Menu Frontend (오늘 뭐 먹지? 도로메뉴 서브 서비스)\n", "").replace("location /menu/ {", "location /other/ {")
        with self.assertRaisesRegex(gi.GatewayInsertError, "삽입 위치"):
            gi.insert_piece(no_anchor, PIECE)
        # 번호 주석이 모호해도 location /menu/ 가 하나뿐이면 거기로 폴백한다(의도된 동작)
        dup_comment = BASE.replace("        location /menu/ {", "        # 8. DORO Menu Frontend\n        location /menu/ {")
        state, out = gi.insert_piece(dup_comment, PIECE)
        self.assertEqual(state, "changed")
        self.assertLess(out.index("location = /interview {"), out.index("        location /menu/ {"))
        # 두 기준점이 모두 모호하면 엉뚱한 곳에 넣지 않고 거부한다
        both = dup_comment.replace("        location /menu/ {", "        location /menu/ {\n        }\n        location /menu/ {", 1)
        with self.assertRaisesRegex(gi.GatewayInsertError, "삽입 위치"):
            gi.insert_piece(both, PIECE)

    def test_조각_구조가_다르면_거부한다(self):
        with self.assertRaisesRegex(gi.GatewayInsertError, "조각 파일 구조"):
            gi.insert_piece(BASE, PIECE.replace("location = /interview {\n    return 301 /interview/;\n}", ""))
        with self.assertRaisesRegex(gi.GatewayInsertError, "조각 파일 구조"):
            gi.insert_piece(BASE, "location /x/ { }")

    def _loc(self, out, head):
        return [l for l in gi.top_level_locations(out) if l.startswith(head)][0]

    def test_API_location_은_PUT_까지만_쓰기를_통과시키고_인증을_거친다(self):
        _, out = gi.insert_piece(BASE, PIECE)
        api = self._loc(out, "location /interview/api/ {")
        self.assertIn("limit_except GET HEAD PUT { deny all; }", api)
        self.assertIn("auth_request /_bff_auth_interview;", api)
        self.assertIn("auth_request_set $bff_token $upstream_http_x_doro_access_token;", api)
        self.assertIn("error_page 403 = @bff_forbidden;", api)
        self.assertIn("error_page 500 = @bff_unavailable;", api)
        self.assertIn("proxy_set_header Authorization $bff_authorization;", api)
        self.assertIn("proxy_pass http://interview_api_upstream/api/;", api)
        self.assertIn("proxy_set_header X-Forwarded-For $remote_addr;", api)
        for method in ("DELETE", "POST", "PATCH"):
            self.assertNotIn(method, api.split("{ deny all; }")[0])

    def test_auth_request_대상은_내부_전용이고_쿠키가_있을_때만_BFF_를_부른다(self):
        _, out = gi.insert_piece(BASE, PIECE)
        auth = self._loc(out, "location = /_bff_auth_interview {")
        self.assertIn("internal;", auth)
        self.assertIn('if ($cookie_doro_interview_session = "") { return 204; }', auth)
        self.assertIn("proxy_pass http://bff_upstream/internal/auth;", auth)
        self.assertIn("proxy_pass_request_body off;", auth)
        self.assertIn("proxy_set_header X-Doro-Service interview;", auth)
        self.assertIn("proxy_set_header X-Original-Method $request_method;", auth)
        self.assertIn("proxy_set_header Host $host;", auth)

    def test_로그인_콜백_로그아웃은_BFF_의_interview_경로로_이어진다(self):
        _, out = gi.insert_piece(BASE, PIECE)
        for name in ("login", "callback", "logout"):
            loc = self._loc(out, f"location = /interview/api/v1/bff/{name} {{")
            self.assertIn(f"proxy_pass http://bff_upstream/bff/interview/{name};", loc)
            self.assertNotIn("limit_except", loc)  # 로그아웃 POST 가 막히지 않는다(CSRF 는 BFF 가 확인한다)
            self.assertNotIn("auth_request", loc)

    def test_세션_조회는_BFF_가_아니라_서비스가_처리한다(self):
        _, out = gi.insert_piece(BASE, PIECE)
        self.assertNotIn("/interview/api/v1/bff/session", out)

    def test_BFF_공용_정의가_없는_게이트웨이에는_반영하지_않는다(self):
        for needle, name in (("upstream bff_upstream {", "bff_upstream"), ("map $bff_token $bff_authorization {", "bff_authorization"),
                             ("location @bff_forbidden {", "@bff_forbidden"), ("location @bff_unavailable {", "@bff_unavailable")):
            broken = BASE.replace(needle, needle.replace("bff", "xxx").replace("@xxx", "@xxx"))
            with self.assertRaisesRegex(gi.GatewayInsertError, "BFF 공용 정의"):
                gi.insert_piece(broken, PIECE)

    def test_이미_반영된_게이트웨이는_공용_정의_검사_없이_already(self):
        _, once = gi.insert_piece(BASE, PIECE)
        self.assertEqual(gi.insert_piece(once, PIECE)[0], "already")

    def test_웹_location_은_CSP_와_보안_헤더를_다시_적는다(self):
        _, out = gi.insert_piece(BASE, PIECE)
        web = [l for l in gi.top_level_locations(out) if l.startswith("location /interview/ {")][0]
        for header in ("X-Content-Type-Options", "X-Frame-Options", "Strict-Transport-Security", "Referrer-Policy", "Permissions-Policy"):
            self.assertIn(header, web)
        csp = re.search(r'add_header Content-Security-Policy "([^"]+)"', web).group(1)
        self.assertIn("script-src 'self';", csp)
        self.assertIn("object-src 'none'", csp)
        self.assertNotIn("unsafe-inline", csp)
        self.assertNotIn("unsafe-eval", csp)
        self.assertNotIn("http:", csp)
        self.assertIn("proxy_hide_header Content-Security-Policy;", web)

    @unittest.skipUnless(REAL.exists(), "../Doro/gateway/nginx.conf 가 없다")
    def test_실제_게이트웨이_기준_설정과_호환된다(self):
        real = REAL.read_text(encoding="utf-8")
        if gi.UPSTREAM_MARK in real:
            # Doro 의 참고 사본에 이미 반영돼 있다(로그인 연결 PR 머지 뒤): 같은 조각을 다시 넣어도 아무것도 바꾸지 않고, 블록이 한 번씩만 있다
            self.assertEqual(gi.insert_piece(real, PIECE)[0], "already")
            self.assertEqual(real.count("upstream interview_web_upstream"), 1)
            self.assertEqual(real.count("location /interview/api/ {"), 1)
            return
        state, out = gi.insert_piece(real, PIECE)
        self.assertEqual(state, "changed")
        self.assertTrue(added_only(real, out))
        self.assertEqual(out.count("interview_web_upstream"), 2)   # upstream 정의 1 + proxy_pass 1
        self.assertEqual(out.count("interview_api_upstream"), 2)
        self.assertEqual(gi.insert_piece(out, PIECE)[0], "already")


class CliTest(unittest.TestCase):
    def run_cli(self, *extra):
        with tempfile.TemporaryDirectory() as d:
            conf = Path(d, "nginx.conf"); conf.write_text(BASE, encoding="utf-8")
            piece = Path(d, "piece.conf"); piece.write_text(PIECE, encoding="utf-8")
            out = Path(d, "out.conf")
            rc = gi.main([str(conf), str(piece), str(out), *extra])
            return rc, out.read_text(encoding="utf-8") if out.exists() else None

    def test_성공하면_결과_파일을_쓴다(self):
        rc, out = self.run_cli()
        self.assertEqual(rc, 0)
        self.assertIn("interview_web_upstream", out)

    def test_알_수_없는_옵션은_2로_끝난다(self):
        rc, out = self.run_cli("--nope")
        self.assertEqual(rc, 2)
        self.assertIsNone(out)

    def test_인자가_모자라면_2로_끝난다(self):
        self.assertEqual(gi.main(["only-one"]), 2)


if __name__ == "__main__":
    unittest.main()
