"""Migration-level guardrail; live verification is scripts/verify-option-constraint.mjs."""

from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]


class QuizOptionConstraintTests(unittest.TestCase):
    def test_answer_constraint_allows_exactly_three_published_option_keys(self) -> None:
        migration = (ROOT / "supabase/migrations/campaign_007_allow_three_quiz_options.sql").read_text()
        self.assertIn("drop constraint if exists quiz_answers_selected_option_check", migration)
        self.assertIn("check (selected_option in ('A', 'B', 'C'))", migration)

    def test_answer_column_remains_required(self) -> None:
        original = (ROOT / "supabase/migrations/campaign_002_quiz_answers.sql").read_text()
        self.assertIn("selected_option text not null", original)

    def test_published_quiz_option_keys_match_answer_constraint(self) -> None:
        content = (ROOT / "supabase/migrations/campaign_006_quiz_content.sql").read_text()
        self.assertIn("option_key text not null check (option_key in ('A', 'B', 'C'))", content)


if __name__ == "__main__":
    unittest.main()
