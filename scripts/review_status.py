#!/usr/bin/env python3
"""검수 진행 현황(읽기 전용). content/ 아래 질문 파일의 frontmatter 만 읽는다.

    python3 -I scripts/review_status.py [content 디렉터리]

출력: 주제별 REVIEWED/DRAFT 수, 다음 미검수 질문, 공개 가능 여부, 이상 징후(REVIEWED 인데 reviewed_at 없음 등).
needs_review 는 로더가 DB 에서 내용 해시를 비교해 계산하는 값이라 파일만으로는 알 수 없다: 여기서는 다루지 않는다.
"""
import re
import sys
from pathlib import Path

FM = re.compile(r"\A---\n(.*?)\n---\n", re.S)


def frontmatter(path):
    m = FM.match(path.read_text(encoding="utf-8"))
    out = {}
    if m:
        for line in m.group(1).splitlines():
            k, sep, v = line.partition(":")
            if sep:
                out[k.strip()] = v.strip().strip('"')
    return out


def topic_meta(path):
    meta = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if re.match(r"^[A-Za-z_]+:", line):
            k, _, v = line.partition(":")
            meta[k.strip()] = v.strip().strip('"')
    return meta


def collect(root):
    """[{slug, name, published, questions:[{slug, status, reviewed_at, tier}]}] — 주제 sort 순, 질문은 slug 순."""
    topics = []
    for tfile in sorted(Path(root).glob("*/*/_topic.yml")):
        meta = topic_meta(tfile)
        qs = []
        for qfile in sorted(tfile.parent.glob("*.md")):
            fm = frontmatter(qfile)
            qs.append({"slug": fm.get("slug", qfile.stem), "status": fm.get("status", "DRAFT"),
                       "reviewed_at": fm.get("reviewed_at"), "tier": fm.get("tier", "")})
        topics.append({"slug": meta.get("slug", tfile.parent.name), "name": meta.get("name", ""),
                       "sort": int(meta.get("sort", "0") or 0),
                       "published": meta.get("published", "false") == "true", "questions": qs})
    return sorted(topics, key=lambda t: (t["sort"], t["slug"]))


def summarize(topics):
    lines, problems = [], []
    for t in topics:
        qs = t["questions"]
        rev = [q for q in qs if q["status"] == "REVIEWED"]
        todo = [q for q in qs if q["status"] != "REVIEWED"]
        nxt = todo[0]["slug"] if todo else "-"
        ready = "가능" if qs and not todo else "불가"
        lines.append(f"{t['slug']:<14} REVIEWED {len(rev):>3} / DRAFT {len(todo):>3}  다음: {nxt:<8} "
                     f"공개 {'ON' if t['published'] else 'off'} (공개 가능: {ready})")
        for q in qs:
            if q["status"] == "REVIEWED" and not q["reviewed_at"]:
                problems.append(f"{q['slug']}: REVIEWED 인데 reviewed_at 이 없다")
            if q["status"] != "REVIEWED" and q["reviewed_at"]:
                problems.append(f"{q['slug']}: {q['status']} 인데 reviewed_at 이 있다")
        if t["published"] and todo:
            problems.append(f"{t['slug']}: 공개 주제인데 미검수 {len(todo)}개 (로더 검증기가 거부한다)")
    total = sum(len(t["questions"]) for t in topics)
    done = sum(1 for t in topics for q in t["questions"] if q["status"] == "REVIEWED")
    lines.append(f"합계 REVIEWED {done} / 전체 {total}")
    return lines, problems


def main(argv):
    root = argv[1] if len(argv) > 1 else str(Path(__file__).resolve().parent.parent / "content")
    lines, problems = summarize(collect(root))
    print("\n".join(lines))
    if problems:
        print("\n이상 징후:")
        print("\n".join("  - " + p for p in problems))
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
