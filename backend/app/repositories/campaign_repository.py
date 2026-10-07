"""Server-side persistence for the anonymous quiz campaign.

This module intentionally contains no query to the ``linebot`` schema and no
mutation of shared reference tables.  Caller authentication/ownership checks
belong in the API service before invoking private-result methods.
"""

from __future__ import annotations

from datetime import datetime, timezone
from hashlib import sha256
from typing import Any


class CampaignRepository:
    def __init__(self, client: Any) -> None:
        self._client = client

    @property
    def _schema(self) -> Any:
        return self._client.schema("campaign")

    @staticmethod
    def token_hash(raw_token: str) -> str:
        return sha256(raw_token.encode("utf-8")).hexdigest()

    def create_quiz_session(self, anonymous_session_id: str) -> dict[str, Any]:
        return self._schema.table("quiz_sessions").insert({"anonymous_session_id": anonymous_session_id}).execute().data[0]

    def get_quiz_session(self, anonymous_session_id: str) -> dict[str, Any] | None:
        response = self._schema.table("quiz_sessions").select("*").eq("anonymous_session_id", anonymous_session_id).maybe_single().execute()
        return response.data

    def complete_quiz_session(self, session_id: str) -> None:
        self._schema.table("quiz_sessions").update({"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}).eq("id", session_id).execute()

    def get_answers(self, session_id: str) -> list[dict[str, Any]]:
        response = self._schema.table("quiz_answers").select("question_id, selected_option").eq("quiz_session_id", session_id).execute()
        return list(response.data or [])

    def save_answer(self, quiz_session_id: str, question_id: str, selected_option: str, score_delta: float, dimension_delta: dict[str, float]) -> dict[str, Any]:
        payload = {"quiz_session_id": quiz_session_id, "question_id": question_id, "selected_option": selected_option, "score_delta": score_delta, "dimension_delta_json": dimension_delta}
        return self._schema.table("quiz_answers").upsert(payload, on_conflict="quiz_session_id,question_id").execute().data[0]

    def create_result(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Persist a result calculated server-side from published questions."""
        return self._schema.table("quiz_results").upsert(payload, on_conflict="quiz_session_id").execute().data[0]

    def get_result_for_session(self, quiz_session_id: str) -> dict[str, Any] | None:
        response = self._schema.table("quiz_results").select("*").eq("quiz_session_id", quiz_session_id).maybe_single().execute()
        return response.data

    def get_result_for_share_token(self, raw_token: str) -> dict[str, Any] | None:
        response = self._schema.table("share_results").select("quiz_results!inner(id, persona_key, defense_value, ability_scores_json, result_summary)").eq("share_token_hash", self.token_hash(raw_token)).gt("expires_at", datetime.now(timezone.utc).isoformat()).maybe_single().execute()
        return response.data

    def create_share_result(self, quiz_result_id: str, raw_token: str, share_format: str, expires_at: datetime) -> dict[str, Any]:
        payload = {"quiz_result_id": quiz_result_id, "share_token_hash": self.token_hash(raw_token), "share_format": share_format, "expires_at": expires_at.astimezone(timezone.utc).isoformat()}
        return self._schema.table("share_results").insert(payload).execute().data[0]

    def create_link_token(self, quiz_result_id: str, raw_token: str, expires_at: datetime) -> dict[str, Any]:
        payload = {"quiz_result_id": quiz_result_id, "token_hash": self.token_hash(raw_token), "expires_at": expires_at.astimezone(timezone.utc).isoformat()}
        return self._schema.table("link_tokens").insert(payload).execute().data[0]
