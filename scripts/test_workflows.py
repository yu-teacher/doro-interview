"""워크플로 정책 시험: 공개 저장소의 서버 러너 배포(deploy.yml)가 안전한 조건에서만 돈다는 것을 고정한다(docker·네트워크 없이)."""
import unittest
from pathlib import Path

import yaml

WORKFLOWS = Path(__file__).resolve().parent.parent / ".github" / "workflows"


def load(name: str) -> dict:
    data = yaml.safe_load((WORKFLOWS / name).read_text(encoding="utf-8"))
    # YAML 1.1 에서 키 on 은 True 로 읽힌다
    if True in data:
        data["on"] = data.pop(True)
    return data


class DeployWorkflowTest(unittest.TestCase):
    def setUp(self):
        self.wf = load("deploy.yml")
        self.job = self.wf["jobs"]["deploy"]

    def test_pull_request_에는_절대_반응하지_않는다(self):
        triggers = set(self.wf["on"])
        self.assertEqual(triggers, {"workflow_run", "workflow_dispatch"})
        for bad in ("pull_request", "pull_request_target", "push", "issue_comment", "schedule"):
            self.assertNotIn(bad, triggers)

    def test_CI_가_main_에서_끝났을_때만_반응한다(self):
        run = self.wf["on"]["workflow_run"]
        self.assertEqual(run["workflows"], ["CI"])
        self.assertEqual(run["types"], ["completed"])
        self.assertEqual(run["branches"], ["main"])

    def test_조건은_CD_ENABLED_와_CI_성공_그리고_push_로_제한된다(self):
        cond = " ".join(str(self.job["if"]).split())
        self.assertIn("vars.CD_ENABLED == 'true'", cond)
        self.assertIn("github.event.workflow_run.conclusion == 'success'", cond)
        self.assertIn("github.event.workflow_run.event == 'push'", cond)  # PR 로 끝난 CI 로는 배포하지 않는다
        self.assertIn("github.event_name == 'workflow_dispatch'", cond)

    def test_서버_러너에서_돌고_권한은_읽기만_있다(self):
        self.assertEqual(self.job["runs-on"], "self-hosted")
        self.assertEqual(self.wf["permissions"], {"contents": "read"})

    def test_배포는_하나씩_순서대로_한다(self):
        self.assertEqual(self.wf["concurrency"]["group"], "interview-deploy")
        self.assertFalse(self.wf["concurrency"]["cancel-in-progress"])

    def test_Doro_를_형제_디렉터리로_받고_성공한_CI_의_커밋을_배포한다(self):
        checkouts = [s for s in self.job["steps"] if str(s.get("uses", "")).startswith("actions/checkout")]
        self.assertEqual([c["with"]["path"] for c in checkouts], ["doro-interview", "Doro"])
        self.assertIn("workflow_run.head_sha", checkouts[0]["with"]["ref"])  # CI 가 통과한 바로 그 커밋
        self.assertEqual(checkouts[1]["with"]["repository"], "yu-teacher/doro")

    def test_배포_단계는_서버의_env_파일과_Doro_경로를_넘기고_비밀을_직접_다루지_않는다(self):
        step = [s for s in self.job["steps"] if "deploy-on-server.sh" in str(s.get("run", ""))][0]
        self.assertIn("--apply", step["run"])
        self.assertIn('INTERVIEW_ENV_FILE="$HOME/doro-interview/.env"', step["run"])
        self.assertEqual(step["env"]["DORO_DIR"], "${{ github.workspace }}/Doro")
        text = (WORKFLOWS / "deploy.yml").read_text(encoding="utf-8")
        self.assertNotIn("secrets.", text)  # 비밀은 서버의 .env 에 있다


class CiWorkflowTest(unittest.TestCase):
    def test_CI_는_배포하지_않고_러너는_GitHub_호스트다(self):
        wf = load("ci.yml")
        for name, job in wf["jobs"].items():
            self.assertEqual(job["runs-on"], "ubuntu-latest", name)  # 서버 러너는 deploy.yml 에만 있다
        self.assertEqual(wf["permissions"], {"contents": "read"})

    def test_CI_이름이_배포_워크플로가_기다리는_이름과_같다(self):
        self.assertEqual(load("ci.yml")["name"], load("deploy.yml")["on"]["workflow_run"]["workflows"][0])


if __name__ == "__main__":
    unittest.main()
