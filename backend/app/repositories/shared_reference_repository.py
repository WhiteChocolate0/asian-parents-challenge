"""Read-only gateway to official reference data shared with the LINE Bot."""

from __future__ import annotations

from typing import Any


class SharedDataRepository:
    """Reads public/shared reference tables only; this class has no write methods.

    The supplied client is a server-side Supabase client.  Never instantiate this
    repository in browser code and never use it to access the ``linebot`` schema.
    """

    def __init__(self, client: Any) -> None:
        self._client = client

    @staticmethod
    def _rows(response: Any) -> list[dict[str, Any]]:
        return list(response.data or [])

    def get_vehicle_profiles(self) -> list[dict[str, Any]]:
        response = self._client.schema("public").table("vehicle_profiles").select("*").eq("active", True).execute()
        return self._rows(response)

    def get_vehicle_by_id(self, vehicle_id: str) -> dict[str, Any] | None:
        response = self._client.schema("public").table("vehicle_profiles").select("*").eq("id", vehicle_id).eq("active", True).maybe_single().execute()
        return response.data

    def get_active_tax_rules(self) -> list[dict[str, Any]]:
        response = self._client.schema("public").table("tax_rules").select("*").eq("active", True).order("effective_from", desc=True).execute()
        return self._rows(response)

    def get_knowledge_source(self, source_id: str) -> dict[str, Any] | None:
        response = self._client.schema("public").table("knowledge_sources").select("*").eq("id", source_id).eq("active", True).maybe_single().execute()
        return response.data

    def get_energy_prices(self) -> list[dict[str, Any]]:
        response = self._client.schema("public").table("energy_prices").select("*").eq("active", True).execute()
        return self._rows(response)
