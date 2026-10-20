#!/usr/bin/env python3
"""시드 면접 문서(스프링 Q&A 마크다운)를 content/ 질문 파일로 바꾸는 일회성 도구. 표준 라이브러리만 쓴다.

    python3 scripts/convert_seed.py --seed ~/Documents/kdt/demo/docs/interview --out content

규칙(docs/M0-PLAN.md S3):
- `## 기본 / ## 심화 / ## 꼬리 질문` 절의 `### Q.` 블록만 질문이다(BASIC / DEEP / TRICKY). 다른 절은 건너뛴다.
- 블록마다 `**모범 답변`이 하나, `**핵심 키워드**:` 줄이 하나 있고 이 순서여야 한다. 아니면 실패한다.
- 문서별 질문 수·꼬리 질문 수가 기대값과 다르면 실패한다(질문이 파서에 빠졌는지 즉시 드러난다).
- 질문 slug 는 `<주제 접두사>-<두 자리 번호>`. 첫 변환 때만 부여하고, 이미 content/ 가 있으면 제목으로 찾아 같은 slug 를 쓴다.
- 같은 입력을 두 번 변환하면 바이트까지 같다.
- 본문의 (공식 문서)/(보충)/(실험 확인) 표기는 그대로 둔다(렌더러가 배지로 바꾼다).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

TIER_BY_SECTION = {"기본": "BASIC", "심화": "DEEP", "꼬리 질문": "TRICKY"}
DIFFICULTY_BY_TIER = {"BASIC": 1, "DEEP": 2, "TRICKY": 3}
BASE_VERSION = "Spring Framework 7 / Boot 4"


class ConvertError(Exception):
    """시드 문서가 기대한 형식이 아닐 때."""


@dataclass(frozen=True)
class TopicSpec:
    file_stem: str          # 시드 파일 이름(확장자 제외)
    slug: str               # 주제 slug (DB 기본키)
    prefix: str             # 질문 slug 접두사
    name: str
    description: str
    default_evidence: str   # OFFICIAL: 문서가 "표시 없는 사실은 공식 문서 확인"이라고 밝힌 경우
    expected_total: int
    expected_tricky: int


# 시드 7편. 기대 질문 수는 2026-10-20 실측값(docs/DESIGN.md §3.1).
SEED_TOPICS = [
    TopicSpec("01-ioc-di", "ioc-di", "ioc", "IoC / DI", "제어의 역전, 의존성 주입, 빈 스코프·생명주기, 순환 참조", "UNKNOWN", 22, 6),
    TopicSpec("02-aop-proxy", "aop-proxy", "aop", "AOP와 프록시", "JDK 동적 프록시 vs CGLIB, 어드바이스, 자기 호출 문제", "OFFICIAL", 20, 5),
    TopicSpec("03-transaction", "transaction", "tx", "트랜잭션", "전파·격리·롤백 규칙, readOnly, UnexpectedRollbackException", "UNKNOWN", 25, 6),
    TopicSpec("04-spring-mvc", "spring-mvc", "mvc", "Spring MVC", "DispatcherServlet 흐름, 필터 vs 인터셉터, 예외 처리", "UNKNOWN", 23, 5),
    TopicSpec("05-jpa", "jpa", "jpa", "JPA", "영속성 컨텍스트, 더티 체킹, 지연 로딩, N+1", "UNKNOWN", 31, 6),
    TopicSpec("06-spring-boot", "spring-boot", "boot", "스프링 부트", "자동 설정, 프로필, 프로퍼티 우선순위, 테스트 슬라이스", "OFFICIAL", 21, 6),
    TopicSpec("07-misc-and-history", "spring-misc", "misc", "기타와 버전 변화", "싱글톤 동시성, 커넥션 풀, 가상 스레드, 3 → 7 변화", "UNKNOWN", 17, 5),
]

CATEGORY = {"slug": "spring", "name": "스프링", "sort": 20}

H2_RE = re.compile(r"^## (.+?)\s*$")
Q_RE = re.compile(r"^### Q\.\s*(.+?)\s*$")
ANSWER_RE = re.compile(r"^\*\*모범 답변")
KEYWORDS_RE = re.compile(r"^\*\*핵심 키워드\*\*:\s*(.+?)\s*$")
SOURCE_RE = re.compile(r"^- (https?://\S+)(?:\s+\((.+)\))?\s*$")


@dataclass
class Question:
    title: str
    tier: str
    keywords: list[str]
    body: str
    slug: str = ""


@dataclass
class ParsedDoc:
    questions: list[Question] = field(default_factory=list)
    sources: list[dict[str, str]] = field(default_factory=list)


def split_keywords(text: str) -> list[str]:
    """쉼표로 나누되 괄호·백틱 안의 쉼표는 나누지 않는다."""
    parts: list[str] = []
    depth = 0
    in_code = False
    buf: list[str] = []
    for ch in text:
        if ch == "`":
            in_code = not in_code
        elif not in_code:
            if ch in "([{（":
                depth += 1
            elif ch in ")]}）":
                depth = max(0, depth - 1)
            elif ch == "," and depth == 0:
                parts.append("".join(buf).strip())
                buf = []
                continue
        buf.append(ch)
    parts.append("".join(buf).strip())
    result = [p for p in parts if p]
    if not result:
        raise ConvertError(f"키워드를 읽지 못했다: {text!r}")
    return result


def iter_lines_with_fence(lines: list[str]):
    """(줄, 코드 펜스 안인지)를 낸다. 펜스 안의 `## ` 등은 제목이 아니다."""
    in_fence = False
    for line in lines:
        stripped = line.lstrip()
        if stripped.startswith("```"):
            yield line, True  # 펜스 줄 자체는 본문의 일부로 취급
            in_fence = not in_fence
            continue
        yield line, in_fence


def parse_document(text: str, doc_name: str) -> ParsedDoc:
    lines = text.replace("\r\n", "\n").split("\n")
    doc = ParsedDoc()
    section: str | None = None
    block_title: str | None = None
    block_lines: list[str] = []
    stray_q = 0
    section_q_lines = 0

    def flush() -> None:
        nonlocal block_title, block_lines
        if block_title is None:
            return
        tier = TIER_BY_SECTION[section] if section in TIER_BY_SECTION else None
        if tier is None:
            raise ConvertError(f"{doc_name}: 질문 절이 아닌 '{section}' 안에 질문이 있다: {block_title}")
        doc.questions.append(build_question(block_title, tier, block_lines, doc_name))
        block_title = None
        block_lines = []

    for line, in_fence in iter_lines_with_fence(lines):
        if not in_fence:
            m2 = H2_RE.match(line)
            if m2:
                flush()
                section = m2.group(1)
                continue
            mq = Q_RE.match(line)
            if mq:
                flush()
                block_title = mq.group(1)
                block_lines = []
                section_q_lines += 1
                continue
            if section == "출처":
                ms = SOURCE_RE.match(line)
                if ms:
                    entry = {"url": ms.group(1)}
                    if ms.group(2):
                        entry["note"] = ms.group(2)
                    doc.sources.append(entry)
        if block_title is not None:
            block_lines.append(line)
    flush()

    raw_q = len([1 for line, in_fence in iter_lines_with_fence(lines) if not in_fence and Q_RE.match(line)])
    if raw_q != len(doc.questions):
        raise ConvertError(f"{doc_name}: '### Q.' 줄 {raw_q}개 중 {len(doc.questions)}개만 질문으로 읽었다")
    return doc


def build_question(title: str, tier: str, block_lines: list[str], doc_name: str) -> Question:
    # 끝의 빈 줄·구분선(---) 제거
    lines = list(block_lines)
    while lines and (lines[-1].strip() == "" or lines[-1].strip() == "---"):
        lines.pop()
    while lines and lines[0].strip() == "":
        lines.pop(0)

    answer_idx = [i for i, (ln, fenced) in enumerate(iter_lines_with_fence(lines)) if not fenced and ANSWER_RE.match(ln)]
    kw_idx = [i for i, (ln, fenced) in enumerate(iter_lines_with_fence(lines)) if not fenced and KEYWORDS_RE.match(ln)]
    if len(answer_idx) != 1:
        raise ConvertError(f"{doc_name}: '{title}' — '**모범 답변' 줄이 {len(answer_idx)}개다(1개여야 한다)")
    if len(kw_idx) != 1:
        raise ConvertError(f"{doc_name}: '{title}' — '**핵심 키워드**:' 줄이 {len(kw_idx)}개다(1개여야 한다)")
    if not answer_idx[0] < kw_idx[0]:
        raise ConvertError(f"{doc_name}: '{title}' — 모범 답변이 핵심 키워드보다 뒤에 있다")

    keywords = split_keywords(KEYWORDS_RE.match(lines[kw_idx[0]]).group(1))
    del lines[kw_idx[0]]
    body = collapse_blank_runs(lines)
    return Question(title=title, tier=tier, keywords=keywords, body=body)


def collapse_blank_runs(lines: list[str]) -> str:
    """키워드 줄을 빼면서 생긴 연속 빈 줄을 하나로 줄인다(코드 펜스 안은 그대로 둔다)."""
    out: list[str] = []
    prev_blank = False
    for line, in_fence in iter_lines_with_fence(lines):
        blank = line.strip() == ""
        if blank and prev_blank and not in_fence:
            continue
        out.append(line)
        prev_blank = blank
    return "\n".join(out).strip("\n") + "\n"


# ----------------------------------------------------------------------------- 출력

def q(value: str) -> str:
    """YAML 큰따옴표 문자열(JSON 문자열은 유효한 YAML 이다)."""
    return json.dumps(value, ensure_ascii=False)


def read_existing_slugs(topic_dir: Path) -> dict[str, str]:
    """이미 만든 질문 파일에서 제목 → slug 를 읽는다(slug 를 다시 매기지 않기 위해)."""
    found: dict[str, str] = {}
    if not topic_dir.is_dir():
        return found
    for path in sorted(topic_dir.glob("*.md")):
        head = path.read_text(encoding="utf-8").split("\n---\n", 1)[0]
        slug = re.search(r'(?m)^slug: ("(?:[^"\\]|\\.)*")$', head)
        title = re.search(r'(?m)^title: ("(?:[^"\\]|\\.)*")$', head)
        if slug and title:
            found[json.loads(title.group(1))] = json.loads(slug.group(1))
    return found


def assign_slugs(questions: list[Question], prefix: str, existing: dict[str, str]) -> list[str]:
    """새 질문에만 번호를 부여한다. 반환값: 시드에 더는 없는 기존 slug(고아) 목록."""
    titles = [x.title for x in questions]
    if len(set(titles)) != len(titles):
        dup = sorted({t for t in titles if titles.count(t) > 1})
        raise ConvertError(f"같은 제목의 질문이 있다(slug 를 제목으로 이어 붙일 수 없다): {dup}")
    used = {s for s in existing.values()}
    number = 0
    for item in questions:
        if item.title in existing:
            item.slug = existing[item.title]
            continue
        while True:
            number += 1
            candidate = f"{prefix}-{number:02d}"
            if candidate not in used:
                break
        used.add(candidate)
        item.slug = candidate
    return sorted(slug for title, slug in existing.items() if title not in set(titles))


def render_question(item: Question, topic: TopicSpec) -> str:
    keywords = ", ".join(q(k) for k in item.keywords)
    has_extra = "(보충)" in item.body
    return (
        "---\n"
        f"slug: {q(item.slug)}\n"
        f"topic: {q(topic.slug)}\n"
        f"tier: {item.tier}\n"
        f"difficulty: {DIFFICULTY_BY_TIER[item.tier]}\n"
        f"title: {q(item.title)}\n"
        f"keywords: [{keywords}]\n"
        f"has_extra: {'true' if has_extra else 'false'}\n"
        "status: DRAFT\n"
        "---\n"
        f"{item.body}"
    )


def render_topic(topic: TopicSpec, sort: int, sources: list[dict[str, str]]) -> str:
    lines = [
        f"slug: {q(topic.slug)}",
        f"category: {q(CATEGORY['slug'])}",
        f"name: {q(topic.name)}",
        f"sort: {sort}",
        f"slug_prefix: {q(topic.prefix)}",
        f"description: {q(topic.description)}",
        f"base_version: {q(BASE_VERSION)}",
        f"default_evidence: {topic.default_evidence}",
        "published: false",
    ]
    if sources:
        lines.append("sources:")
        for entry in sources:
            lines.append(f"  - url: {q(entry['url'])}")
            if "note" in entry:
                lines.append(f"    note: {q(entry['note'])}")
    else:
        lines.append("sources: []")
    return "\n".join(lines) + "\n"


def render_category() -> str:
    return f"slug: {q(CATEGORY['slug'])}\nname: {q(CATEGORY['name'])}\nsort: {CATEGORY['sort']}\n"


def write_if_changed(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and path.read_text(encoding="utf-8") == content:
        return
    path.write_text(content, encoding="utf-8", newline="\n")


def convert(seed_dir: Path, out_dir: Path, topics: list[TopicSpec] = SEED_TOPICS, enforce_counts: bool = True) -> dict:
    """변환하고 요약(주제별 질문 수, tier 분포, 고아 slug)을 돌려준다. 형식이 틀리면 ConvertError."""
    parsed: list[tuple[TopicSpec, ParsedDoc]] = []
    for topic in topics:
        path = seed_dir / f"{topic.file_stem}.md"
        if not path.is_file():
            raise ConvertError(f"시드 파일이 없다: {path}")
        doc = parse_document(path.read_text(encoding="utf-8"), path.name)
        if enforce_counts:
            tricky = sum(1 for x in doc.questions if x.tier == "TRICKY")
            if len(doc.questions) != topic.expected_total or tricky != topic.expected_tricky:
                raise ConvertError(
                    f"{path.name}: 질문 {len(doc.questions)}개(꼬리 {tricky}개), 기대는 {topic.expected_total}개(꼬리 {topic.expected_tricky}개)")
        parsed.append((topic, doc))

    summary: dict = {"topics": {}, "orphans": []}
    category_dir = out_dir / CATEGORY["slug"]
    write_if_changed(category_dir / "_category.yml", render_category())
    for sort, (topic, doc) in enumerate(parsed, start=1):
        topic_dir = category_dir / topic.slug
        existing = read_existing_slugs(topic_dir)
        orphans = assign_slugs(doc.questions, topic.prefix, existing)
        summary["orphans"].extend(orphans)
        write_if_changed(topic_dir / "_topic.yml", render_topic(topic, sort * 10, doc.sources))
        for item in doc.questions:
            write_if_changed(topic_dir / f"{item.slug}.md", render_question(item, topic))
        tiers: dict[str, int] = {}
        for item in doc.questions:
            tiers[item.tier] = tiers.get(item.tier, 0) + 1
        summary["topics"][topic.slug] = {"total": len(doc.questions), **tiers}
    return summary


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--seed", required=True, type=Path, help="시드 마크다운 디렉터리(01-ioc-di.md …)")
    ap.add_argument("--out", required=True, type=Path, help="content/ 디렉터리")
    args = ap.parse_args(argv)
    try:
        summary = convert(args.seed, args.out)
    except ConvertError as e:
        print(f"변환 실패: {e}", file=sys.stderr)
        return 1
    total = sum(t["total"] for t in summary["topics"].values())
    tricky = sum(t.get("TRICKY", 0) for t in summary["topics"].values())
    for slug, t in summary["topics"].items():
        print(f"  {slug:14s} {t['total']:3d}  (BASIC {t.get('BASIC', 0)}, DEEP {t.get('DEEP', 0)}, TRICKY {t.get('TRICKY', 0)})")
    print(f"합계 {total}개 (TRICKY {tricky}개), 주제 {len(summary['topics'])}개")
    if summary["orphans"]:
        print(f"주의: 시드에 더는 없는 기존 slug {summary['orphans']} — 파일을 지울지 사람이 판단한다", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
