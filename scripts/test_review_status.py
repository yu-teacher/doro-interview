"""review_status.py 단위 테스트(임시 디렉터리의 작은 샘플 콘텐츠만 사용).

    python3 -I -m unittest discover -s scripts -p 'test_*.py'
"""
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import review_status as rs  # noqa: E402


def q(slug, status, reviewed_at=None):
    extra = f"reviewed_at: {reviewed_at}\n" if reviewed_at else ""
    return f'---\nslug: "{slug}"\ntier: BASIC\nstatus: {status}\n{extra}---\n본문\n'


class ReviewStatusTest(unittest.TestCase):
    def make(self, topics):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        root = Path(tmp.name)
        for slug, sort, published, questions in topics:
            d = root / "cat" / slug
            d.mkdir(parents=True)
            (d / "_topic.yml").write_text(f'slug: "{slug}"\nname: "n"\nsort: {sort}\npublished: {str(published).lower()}\n',
                                          encoding="utf-8")
            for name, text in questions:
                (d / f"{name}.md").write_text(text, encoding="utf-8")
        return root

    def test_counts_next_and_order(self):
        root = self.make([("b", 20, False, [("b-01", q("b-01", "DRAFT"))]),
                          ("a", 10, False, [("a-01", q("a-01", "REVIEWED", "2026-10-20")), ("a-02", q("a-02", "DRAFT"))])])
        lines, problems = rs.summarize(rs.collect(root))
        self.assertTrue(lines[0].startswith("a "))
        self.assertIn("REVIEWED   1 / DRAFT   1", lines[0])
        self.assertIn("a-02", lines[0])
        self.assertIn("공개 가능: 불가", lines[0])
        self.assertIn("합계 REVIEWED 1 / 전체 3", lines[-1])
        self.assertEqual(problems, [])

    def test_publishable_when_all_reviewed(self):
        root = self.make([("a", 1, False, [("a-01", q("a-01", "REVIEWED", "2026-10-20"))])])
        lines, _ = rs.summarize(rs.collect(root))
        self.assertIn("공개 가능: 가능", lines[0])
        self.assertIn("다음: -", lines[0])

    def test_anomalies(self):
        root = self.make([("a", 1, True, [("a-01", q("a-01", "REVIEWED")), ("a-02", q("a-02", "DRAFT", "2026-10-20"))])])
        _, problems = rs.summarize(rs.collect(root))
        self.assertEqual(len(problems), 3)

    def test_read_only(self):
        root = self.make([("a", 1, False, [("a-01", q("a-01", "DRAFT"))])])
        before = {p: p.read_text(encoding="utf-8") for p in root.rglob("*") if p.is_file()}
        rs.summarize(rs.collect(root))
        self.assertEqual(before, {p: p.read_text(encoding="utf-8") for p in root.rglob("*") if p.is_file()})

    def test_real_content_runs(self):
        topics = rs.collect(Path(__file__).resolve().parent.parent / "content")
        self.assertTrue(topics)


if __name__ == "__main__":
    unittest.main()
