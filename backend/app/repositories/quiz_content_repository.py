"""Read versioned campaign quiz content; page/UI code never owns scoring rules."""

from __future__ import annotations

from typing import Any


class QuizContentRepository:
    def __init__(self, client: Any) -> None:
        self._client = client

    def get_active_questions(self) -> list[dict[str, Any]]:
        response = (
            self._client.schema("campaign")
            .table("quiz_questions")
            .select("id, stage_no, stage_title, order_no, display_text, quiz_options(option_key, display_text, money_score, safety_score, face_score, tradition_score)")
            .eq("active", True)
            .order("order_no")
            .execute()
        )
        return list(response.data or [])
