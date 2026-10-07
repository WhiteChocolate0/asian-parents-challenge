"""Fast guardrails for this repository; full RLS tests run against Supabase DEV."""

from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]


class DatabaseArchitectureTests(unittest.TestCase):
    def test_campaign_tables_are_schema_isolated_and_rls_protected(self) -> None:
        migrations = "\n".join(path.read_text() for path in sorted((ROOT / "supabase/migrations").glob("campaign_*.sql")))
        for table in ("quiz_sessions", "quiz_answers", "quiz_results", "share_results", "link_tokens", "quiz_questions", "quiz_options"):
            self.assertIn(f"campaign.{table}", migrations)
            self.assertIn(f"alter table campaign.{table} enable row level security", migrations)
        self.assertIn("revoke all on schema campaign from anon, authenticated", migrations)

    def test_website_repositories_do_not_access_linebot_or_mutate_shared_data(self) -> None:
        repository_files = list((ROOT / "backend/app/repositories").glob("*.py"))
        source = "\n".join(path.read_text() for path in repository_files)
        self.assertNotIn('schema("linebot")', source)
        shared = (ROOT / "backend/app/repositories/shared_reference_repository.py").read_text()
        for forbidden in (".insert(", ".update(", ".delete(", ".upsert("):
            self.assertNotIn(forbidden, shared)


if __name__ == "__main__":
    unittest.main()
