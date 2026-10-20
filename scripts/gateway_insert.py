#!/usr/bin/env python3
"""deploy/gateway-interview.conf 의 upstream·location 을 게이트웨이 nginx.conf 텍스트에 넣는다(doro-games 의 apply-gateway-games.sh 와 같은 방식).

    python3 scripts/gateway_insert.py <nginx.conf> <조각 파일> <결과 파일> [--report-only] [--refresh]

- 멱등: 이미 들어 있으면(`interview_web_upstream` 존재) 아무것도 바꾸지 않는다(`--refresh` 면 기존 블록을 정확히 걷어내고 다시 넣는다).
- 조각의 주석 줄은 넣지 않는다. `--report-only` 는 CSP 헤더를 Content-Security-Policy-Report-Only 로 바꿔 넣는다.
- 삽입 위치: upstream 은 `menu_upstream` 블록 바로 아래, location 은 `# 8. DORO Menu Frontend` 주석(없으면 `location /menu/`) 바로 위.
- 기준점을 정확히 하나 찾지 못하거나 조각 구조가 예상과 다르면 실패한다(엉뚱한 곳에 넣지 않는다).
출력(stdout): 반영했으면 `changed`, 이미 있으면 `already`.
"""
from __future__ import annotations

import re
import sys

UPSTREAM_MARK = "interview_web_upstream"
BLOCK_COMMENT = "# 도로 면접 (/interview/): deploy/gateway-interview.conf 에서 옴"
EXPECTED_UPSTREAMS = 2
EXPECTED_LOCATIONS = 3


class GatewayInsertError(Exception):
    """기준점·조각 구조가 예상과 다를 때."""


def top_level_locations(text: str) -> list[str]:
    """중괄호 짝을 맞춰 location 블록을 통째로 꺼낸다(안에 limit_except 같은 중첩 블록이 있어도 잘리지 않는다)."""
    found = []
    for m in re.finditer(r"location\s+[^{]+\{", text):
        depth, i = 1, m.end()
        while i < len(text) and depth:
            depth += {"{": 1, "}": -1}.get(text[i], 0)
            i += 1
        found.append(text[m.start():i])
    return found


def indent(block: str, n: int) -> str:
    pad = " " * n
    lines = block.strip().splitlines()
    out = [pad + lines[0].strip()]
    for line in lines[1:]:
        s = line.strip()
        out.append("" if not s else pad + ("" if s == "}" else "    ") + s)
    return "\n".join(out) + "\n"


def insert_piece(conf: str, piece: str, report_only: bool = False, refresh: bool = False) -> tuple[str, str]:
    """(상태, 새 설정). 상태는 'changed' 또는 'already'."""
    piece = "\n".join(line for line in piece.splitlines() if not line.lstrip().startswith("#"))
    upstreams = re.findall(r"upstream\s+\w+\s*\{[^}]*\}", piece)
    locations = top_level_locations(piece)
    if len(upstreams) != EXPECTED_UPSTREAMS or len(locations) != EXPECTED_LOCATIONS:
        raise GatewayInsertError(f"조각 파일 구조가 예상과 다르다(upstream {len(upstreams)}, location {len(locations)})")

    if refresh and UPSTREAM_MARK in conf:
        # 이전에 넣은 블록(upstream 2개 + 표시 주석부터 location = /interview 까지)만 정확히 걷어내고 아래에서 다시 넣는다
        conf, n1 = re.subn(r"\n    upstream interview_\w+\s*\{[^}]*\}\n", "", conf)
        conf, n2 = re.subn(r"        # 도로 면접 \(/interview/\).*?location = /interview \{[^}]*\}\n\n", "", conf, flags=re.S)
        if n1 != EXPECTED_UPSTREAMS or n2 != 1 or re.search(r"interview_(web|api)_upstream", conf):
            raise GatewayInsertError(f"기존 도로 면접 블록을 정확히 걷어내지 못했다(upstream {n1}, location 블록 {n2}). 수동 확인 필요")
    if UPSTREAM_MARK in conf:
        return "already", conf

    if report_only:
        locations = [loc.replace("add_header Content-Security-Policy ", "add_header Content-Security-Policy-Report-Only ") for loc in locations]

    m = re.search(r"upstream\s+menu_upstream\s*\{[^}]*\}\n", conf)
    if not m:
        raise GatewayInsertError("menu_upstream 블록을 찾지 못했다")
    conf = conf[:m.end()] + "\n" + "\n".join(indent(u, 4) for u in upstreams) + conf[m.end():]

    # 번호가 붙은 구획 주석("# 8. DORO Menu ...") 바로 위에 넣어 주석과 블록이 어긋나지 않게 한다. 없으면 location /menu/ 위.
    anchor = "        # 8. DORO Menu Frontend"
    if conf.count(anchor) != 1:
        anchor = "        location /menu/ {"
    if conf.count(anchor) != 1:
        raise GatewayInsertError("삽입 위치(# 8. DORO Menu / location /menu/)를 정확히 하나 찾지 못했다")
    block = "        " + BLOCK_COMMENT + "\n" + "\n".join(indent(loc, 8) for loc in locations) + "\n"
    conf = conf.replace(anchor, block + anchor, 1)
    return "changed", conf


def main(argv: list[str]) -> int:
    args = [a for a in argv if not a.startswith("--")]
    flags = {a for a in argv if a.startswith("--")}
    unknown = flags - {"--report-only", "--refresh"}
    if len(args) != 3 or unknown:
        print(__doc__, file=sys.stderr)
        return 2
    conf_path, piece_path, out_path = args
    try:
        state, new_conf = insert_piece(
            open(conf_path, encoding="utf-8").read(), open(piece_path, encoding="utf-8").read(),
            report_only="--report-only" in flags, refresh="--refresh" in flags)
    except GatewayInsertError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1
    open(out_path, "w", encoding="utf-8").write(new_conf)
    print(state)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
