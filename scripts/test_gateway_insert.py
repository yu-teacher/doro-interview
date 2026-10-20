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

    upstream games_web_upstream {
        server doro-games-web:80;
    }

    server {
        listen 443 ssl;

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
    def test_조각의_구조는_upstream_2개_location_3개다(self):
        body = "\n".join(l for l in PIECE.splitlines() if not l.lstrip().startswith("#"))
        self.assertEqual(len(re.findall(r"upstream\s+\w+\s*\{", body)), 2)
        self.assertEqual(len(gi.top_level_locations(body)), 3)

    def test_upstream_2개와_location_3개를_한_번씩_넣고_원래_줄은_그대로다(self):
        state, out = gi.insert_piece(BASE, PIECE)
        self.assertEqual(state, "changed")
        self.assertEqual(out.count("upstream interview_web_upstream"), 1)
        self.assertEqual(out.count("upstream interview_api_upstream"), 1)
        for loc in ("location /interview/api/ {", "location /interview/ {", "location = /interview {"):
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
        self.assertIn("\n        location /interview/api/ {\n            limit_except GET HEAD { deny all; }\n", out)
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

    def test_API_location_은_읽기_전용이다(self):
        _, out = gi.insert_piece(BASE, PIECE)
        api = [l for l in gi.top_level_locations(out) if l.startswith("location /interview/api/")][0]
        self.assertIn("limit_except GET HEAD { deny all; }", api)
        self.assertIn("proxy_pass http://interview_api_upstream/api/;", api)
        self.assertIn("proxy_set_header X-Forwarded-For $remote_addr;", api)

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
    def test_실제_게이트웨이_기준_설정에도_들어간다(self):
        real = REAL.read_text(encoding="utf-8")
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
