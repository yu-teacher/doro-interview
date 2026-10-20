"""convert_seed.py 단위 테스트. 시드 원문이 아니라 직접 쓴 작은 샘플 문서만 쓴다.

    python3 -I -m unittest discover -s scripts -p 'test_*.py'
"""
import json
import re
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import convert_seed as cs  # noqa: E402

SAMPLE = """# 샘플 문서

소개 문단.

## 개요

개요 절은 질문이 아니다.

## 기본

### Q. 첫 질문은 무엇인가요?

**모범 답변 (30~60초)**
첫 답변입니다. 공식 문서에서 확인했습니다.

**핵심 키워드**: 하나, 둘(a, b), `x, y`, 셋

(공식 문서) 근거 설명이다.

```java
// ## 코드 안의 제목처럼 보이는 줄은 제목이 아니다
class A {}
```

---

### Q. 두 번째 질문은요?

**모범 답변 (30~60초)**
두 번째 답변입니다.

**핵심 키워드**: 가, 나

(보충) 덧붙인 설명.

## 심화

### Q. 심화 질문입니다.

**모범 답변 (30~60초)**
심화 답변.

**핵심 키워드**: 다

## 꼬리 질문

### Q. 함정 질문입니다.

**모범 답변 (30~60초)**
함정 답변.

**핵심 키워드**: 라, 마

## 출처

실제로 조회한 문서.

- https://example.com/a
- https://example.com/b (일부만 읽음)
"""

TOPIC = cs.TopicSpec("01-sample", "sample", "smp", "샘플", "설명", "UNKNOWN", 4, 1)


def write_seed(root: Path, text: str, name: str = "01-sample.md") -> Path:
    seed = root / "seed"
    seed.mkdir(exist_ok=True)
    (seed / name).write_text(text, encoding="utf-8")
    return seed


def read_front(path: Path) -> tuple[dict, str]:
    raw = path.read_text(encoding="utf-8")
    head, body = raw.split("\n---\n", 1)
    meta = {}
    for line in head.splitlines()[1:]:
        key, value = line.split(": ", 1)
        meta[key] = json.loads(value) if value[:1] in '"[' or value[:1].isdigit() else value
    return meta, body


class ConvertTest(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)
        self.out = self.root / "content"

    def tearDown(self):
        self._tmp.cleanup()

    def run_convert(self, text=SAMPLE, topic=TOPIC):
        seed = write_seed(self.root, text)
        return cs.convert(seed, self.out, [topic])

    def topic_dir(self) -> Path:
        return self.out / "spring" / "sample"

    # -- 정상 변환

    def test_질문_수와_tier를_센다(self):
        summary = self.run_convert()
        self.assertEqual(summary["topics"]["sample"], {"total": 4, "BASIC": 2, "DEEP": 1, "TRICKY": 1})

    def test_slug는_접두사와_두_자리_번호다(self):
        self.run_convert()
        files = sorted(p.name for p in self.topic_dir().glob("*.md"))
        self.assertEqual(files, ["smp-01.md", "smp-02.md", "smp-03.md", "smp-04.md"])

    def test_개요_절은_질문으로_읽지_않는다(self):
        self.run_convert()
        titles = [read_front(p)[0]["title"] for p in sorted(self.topic_dir().glob("*.md"))]
        self.assertNotIn("개요", " ".join(titles))
        self.assertEqual(len(titles), 4)

    def test_키워드는_괄호와_백틱_안의_쉼표로_나누지_않는다(self):
        self.run_convert()
        meta, _ = read_front(self.topic_dir() / "smp-01.md")
        self.assertEqual(meta["keywords"], ["하나", "둘(a, b)", "`x, y`", "셋"])

    def test_본문에서_키워드_줄은_빠지고_나머지는_보존된다(self):
        self.run_convert()
        _, body = read_front(self.topic_dir() / "smp-01.md")
        self.assertNotIn("핵심 키워드", body)
        self.assertIn("**모범 답변 (30~60초)**", body)
        self.assertIn("(공식 문서) 근거 설명이다.", body)
        self.assertNotRegex(body, r"\n\n\n")
        self.assertFalse(body.rstrip().endswith("---"))

    def test_코드_펜스와_그_안의_제목처럼_보이는_줄이_보존된다(self):
        self.run_convert()
        _, body = read_front(self.topic_dir() / "smp-01.md")
        self.assertIn("```java\n// ## 코드 안의 제목처럼 보이는 줄은 제목이 아니다\nclass A {}\n```", body)
        self.assertEqual(body.count("```"), 2)

    def test_보충_표기가_있으면_has_extra다(self):
        self.run_convert()
        self.assertEqual(read_front(self.topic_dir() / "smp-01.md")[0]["has_extra"], "false")
        self.assertEqual(read_front(self.topic_dir() / "smp-02.md")[0]["has_extra"], "true")

    def test_난이도는_tier로_정해진다(self):
        self.run_convert()
        tiers = {read_front(p)[0]["tier"]: read_front(p)[0]["difficulty"] for p in self.topic_dir().glob("*.md")}
        self.assertEqual(tiers, {"BASIC": 1, "DEEP": 2, "TRICKY": 3})

    def test_모두_DRAFT이고_주제는_비공개다(self):
        self.run_convert()
        for p in self.topic_dir().glob("smp-*.md"):
            self.assertEqual(read_front(p)[0]["status"], "DRAFT")
        self.assertIn("published: false", (self.topic_dir() / "_topic.yml").read_text(encoding="utf-8"))

    def test_출처가_주제에_들어간다(self):
        self.run_convert()
        topic = (self.topic_dir() / "_topic.yml").read_text(encoding="utf-8")
        self.assertIn('url: "https://example.com/a"', topic)
        self.assertIn('note: "일부만 읽음"', topic)

    # -- 멱등과 slug 고정

    def test_두_번_변환하면_결과가_바이트까지_같다(self):
        self.run_convert()
        first = {p.name: p.read_bytes() for p in self.out.rglob("*") if p.is_file()}
        self.run_convert()
        second = {p.name: p.read_bytes() for p in self.out.rglob("*") if p.is_file()}
        self.assertEqual(first, second)

    def test_질문_순서가_바뀌어도_slug는_제목을_따라간다(self):
        self.run_convert()
        slug_of = {read_front(p)[0]["title"]: read_front(p)[0]["slug"] for p in self.topic_dir().glob("smp-*.md")}
        swapped = SAMPLE.replace("### Q. 첫 질문은 무엇인가요?", "### Q. @@A").replace(
            "### Q. 두 번째 질문은요?", "### Q. 첫 질문은 무엇인가요?").replace("### Q. @@A", "### Q. 두 번째 질문은요?")
        self.run_convert(swapped)
        after = {read_front(p)[0]["title"]: read_front(p)[0]["slug"] for p in self.topic_dir().glob("smp-*.md")}
        self.assertEqual(slug_of, after)

    def test_새_질문은_빈_번호를_받고_기존_slug는_그대로다(self):
        self.run_convert()
        more = SAMPLE.replace("## 꼬리 질문", "### Q. 새 질문입니다.\n\n**모범 답변 (30~60초)**\n새 답변.\n\n**핵심 키워드**: 바\n\n## 꼬리 질문")
        topic = cs.TopicSpec("01-sample", "sample", "smp", "샘플", "설명", "UNKNOWN", 5, 1)
        write_seed(self.root, more)
        cs.convert(self.root / "seed", self.out, [topic])
        slugs = {read_front(p)[0]["title"]: read_front(p)[0]["slug"] for p in self.topic_dir().glob("smp-*.md")}
        self.assertEqual(slugs["새 질문입니다."], "smp-05")
        self.assertEqual(slugs["첫 질문은 무엇인가요?"], "smp-01")

    def test_시드에서_사라진_질문은_고아로_보고한다(self):
        self.run_convert()
        fewer = SAMPLE.replace("### Q. 두 번째 질문은요?", "### Q. 이름이 바뀐 질문")
        summary = self.run_convert(fewer)
        self.assertEqual(summary["orphans"], ["smp-02"])

    # -- 형식 오류는 실패한다

    def test_키워드_줄이_없으면_실패한다(self):
        broken = SAMPLE.replace("**핵심 키워드**: 가, 나\n", "")
        with self.assertRaisesRegex(cs.ConvertError, "핵심 키워드"):
            self.run_convert(broken)

    def test_모범_답변_줄이_없으면_실패한다(self):
        broken = SAMPLE.replace("**모범 답변 (30~60초)**\n두 번째 답변입니다.", "두 번째 답변입니다.")
        with self.assertRaisesRegex(cs.ConvertError, "모범 답변"):
            self.run_convert(broken)

    def test_키워드가_모범_답변보다_앞이면_실패한다(self):
        broken = SAMPLE.replace(
            "**모범 답변 (30~60초)**\n심화 답변.\n\n**핵심 키워드**: 다",
            "**핵심 키워드**: 다\n\n**모범 답변 (30~60초)**\n심화 답변.")
        with self.assertRaisesRegex(cs.ConvertError, "뒤에 있다"):
            self.run_convert(broken)

    def test_기대_질문_수와_다르면_실패한다(self):
        wrong = cs.TopicSpec("01-sample", "sample", "smp", "샘플", "설명", "UNKNOWN", 5, 1)
        seed = write_seed(self.root, SAMPLE)
        with self.assertRaisesRegex(cs.ConvertError, "기대는 5개"):
            cs.convert(seed, self.out, [wrong])

    def test_기대_꼬리_질문_수와_다르면_실패한다(self):
        wrong = cs.TopicSpec("01-sample", "sample", "smp", "샘플", "설명", "UNKNOWN", 4, 2)
        seed = write_seed(self.root, SAMPLE)
        with self.assertRaisesRegex(cs.ConvertError, "꼬리 1개"):
            cs.convert(seed, self.out, [wrong])

    def test_질문_절이_아닌_곳의_질문은_실패한다(self):
        broken = SAMPLE.replace("소개 문단.", "소개 문단.\n\n### Q. 절 밖의 질문\n\n**모범 답변**\n답.\n\n**핵심 키워드**: 가\n", 1)
        # 첫 H2 앞이라 section 이 None 이다 → 질문으로 읽히지 않고 개수 불일치로 드러난다
        with self.assertRaises(cs.ConvertError):
            self.run_convert(broken)

    def test_같은_제목이_둘이면_실패한다(self):
        dup = SAMPLE.replace("### Q. 두 번째 질문은요?", "### Q. 첫 질문은 무엇인가요?")
        with self.assertRaisesRegex(cs.ConvertError, "같은 제목"):
            self.run_convert(dup)

    def test_시드_파일이_없으면_실패한다(self):
        (self.root / "empty").mkdir()
        with self.assertRaisesRegex(cs.ConvertError, "시드 파일이 없다"):
            cs.convert(self.root / "empty", self.out, [TOPIC])

    # -- CLI

    def test_YAML_큰따옴표_문자열은_JSON과_호환된다(self):
        text = cs.q('따옴표 " 와 \\ 와 콜론: 이 있는 제목')
        self.assertEqual(json.loads(text), '따옴표 " 와 \\ 와 콜론: 이 있는 제목')
        self.assertTrue(re.fullmatch(r'"(?:[^"\\]|\\.)*"', text))


if __name__ == "__main__":
    unittest.main()
