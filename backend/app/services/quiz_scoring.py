"""Deterministic, game-oriented result calculation for 亞洲父母挑戰."""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass


DIMENSIONS = ("money", "safety", "face", "tradition")
TIE_PRIORITY = ("safety", "money", "face", "tradition")


@dataclass(frozen=True)
class QuizResult:
    primary_persona: str
    secondary_trait: str
    dimension_scores: dict[str, int]
    defense_value: int


def calculate_result(questions: Iterable[Mapping[str, object]], answers: Mapping[str, str]) -> QuizResult:
    """Calculate only from published option configuration, never client score input.

    On a top-score tie, stage 3 scores win; a fixed priority resolves any remaining
    tie. Scores are a game "defense value", never a psychological measurement.
    """
    totals = dict.fromkeys(DIMENSIONS, 0)
    stage_three = dict.fromkeys(DIMENSIONS, 0)
    for question in questions:
        selected = answers.get(str(question["id"]))
        option = next((item for item in question["quiz_options"] if item["option_key"] == selected), None)  # type: ignore[index]
        if option is None:
            continue
        for dimension in DIMENSIONS:
            value = int(option[f"{dimension}_score"])
            totals[dimension] += value
            if int(question["stage_no"]) == 3:
                stage_three[dimension] += value

    highest = max(totals.values())
    candidates = [dimension for dimension in DIMENSIONS if totals[dimension] == highest]
    primary = sorted(candidates, key=lambda key: (-stage_three[key], TIE_PRIORITY.index(key)))[0]
    secondary = sorted((key for key in DIMENSIONS if key != primary), key=lambda key: (-totals[key], TIE_PRIORITY.index(key)))[0]
    defense_value = min(5, max(1, round(totals[primary] / 33 * 5)))
    return QuizResult(primary, secondary, totals, defense_value)
