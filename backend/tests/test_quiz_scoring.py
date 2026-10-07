import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.services.quiz_scoring import calculate_result

QUESTIONS_FILE = Path(__file__).resolve().parents[2] / "src/data/quiz.ts"


def question(question_id: str, stage: int, option: str, **scores: int) -> dict:
    dimensions = {name: scores.get(name, 0) for name in ("money", "safety", "face", "tradition")}
    return {"id": question_id, "stage_no": stage, "quiz_options": [{"option_key": option, **{f"{name}_score": value for name, value in dimensions.items()}}]}


class QuizScoringTests(unittest.TestCase):
    def test_quiz_content_has_fifteen_questions_and_four_types(self) -> None:
        content = QUESTIONS_FILE.read_text()
        for question_number in range(1, 16):
            self.assertIn(f"id: 'q{question_number:02d}'", content)
        for persona in ("money:", "safety:", "face:", "tradition:"):
            self.assertIn(persona, content)

    def test_each_dimension_can_be_primary(self) -> None:
        for dimension in ("money", "safety", "face", "tradition"):
            result = calculate_result([question("q01", 1, "A", **{dimension: 10})], {"q01": "A"})
            self.assertEqual(result.primary_persona, dimension)

    def test_stage_three_then_fixed_priority_breaks_tie(self) -> None:
        content = [
            question("q01", 1, "A", money=4, safety=4),
            question("q11", 3, "A", safety=1),
        ]
        self.assertEqual(calculate_result(content, {"q01": "A", "q11": "A"}).primary_persona, "safety")
