from __future__ import annotations

import asyncio
import time
from typing import Any, AsyncGenerator, Generator

import httpx

from .errors import ApiError


class _Base:
    def __init__(self, base_url: str, token: str, max_retries: int = 2):
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.max_retries = max_retries

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}

    @staticmethod
    def _raise(payload: dict[str, Any], status: int) -> None:
        error = payload.get("error") or {}
        raise ApiError(
            error.get("message", "API request failed"),
            status=status,
            code=error.get("code"),
            trace_id=payload.get("traceId"),
            details=error.get("details"),
        )


class ErlcPanelClient(_Base):
    def __init__(self, base_url: str, token: str, max_retries: int = 2, timeout: float = 15.0):
        super().__init__(base_url, token, max_retries)
        self._http = httpx.Client(timeout=timeout)

    def request(self, method: str, path: str, params: dict[str, Any] | None = None, json: dict[str, Any] | None = None):
        url = f"{self.base_url}{path}"
        for attempt in range(self.max_retries + 1):
            response = self._http.request(method, url, headers=self._headers(), params=params, json=json)
            payload = response.json()
            if response.is_success:
                return payload
            if response.status_code in (429, 503) and attempt < self.max_retries and method in {"GET", "DELETE"}:
                time.sleep(int(response.headers.get("retry-after", "1")))
                continue
            self._raise(payload, response.status_code)


    def moderation_history(self, **params):
        return self.request("GET", "/v1/moderation/history", params=params)

    def moderation_statistics(self):
        return self.request("GET", "/v1/moderation/statistics")

    def shift_history(self, **params):
        return self.request("GET", "/v1/shifts/history", params=params)

    def shift_events(self, **params):
        return self.request("GET", "/v1/shifts/events", params=params)

    def activity_summaries(self):
        return self.request("GET", "/v1/activity/summaries")

    def yearly_report(self, year: int):
        return self.request("GET", f"/v1/activity/reports/yearly/{year}")

    def server_configuration(self):
        return self.request("GET", "/v1/server/configuration")

    def server_mappings(self):
        return self.request("GET", "/v1/server/mappings")

    def list_tokens(self):
        return self.request("GET", "/v1/tokens")

    def create_token(self, payload: dict[str, Any]):
        return self.request("POST", "/v1/tokens", json=payload)

    def revoke_token(self, token_id: str):
        return self.request("DELETE", f"/v1/tokens/{token_id}")
    def paginate(self, path: str, params: dict[str, Any] | None = None) -> Generator[list[dict[str, Any]], None, None]:
        params = dict(params or {})
        page = 1
        while True:
            params["page"] = page
            payload = self.request("GET", path, params=params)
            yield payload["data"]
            pagination = payload.get("pagination")
            if not pagination or page >= pagination["totalPages"]:
                break
            page += 1


class AsyncErlcPanelClient(_Base):
    def __init__(self, base_url: str, token: str, max_retries: int = 2, timeout: float = 15.0):
        super().__init__(base_url, token, max_retries)
        self._http = httpx.AsyncClient(timeout=timeout)

    async def request(self, method: str, path: str, params: dict[str, Any] | None = None, json: dict[str, Any] | None = None):
        url = f"{self.base_url}{path}"
        for attempt in range(self.max_retries + 1):
            response = await self._http.request(method, url, headers=self._headers(), params=params, json=json)
            payload = response.json()
            if response.is_success:
                return payload
            if response.status_code in (429, 503) and attempt < self.max_retries and method in {"GET", "DELETE"}:
                await asyncio.sleep(int(response.headers.get("retry-after", "1")))
                continue
            self._raise(payload, response.status_code)


    async def moderation_history(self, **params):
        return await self.request("GET", "/v1/moderation/history", params=params)

    async def moderation_statistics(self):
        return await self.request("GET", "/v1/moderation/statistics")

    async def shift_history(self, **params):
        return await self.request("GET", "/v1/shifts/history", params=params)

    async def shift_events(self, **params):
        return await self.request("GET", "/v1/shifts/events", params=params)

    async def activity_summaries(self):
        return await self.request("GET", "/v1/activity/summaries")

    async def yearly_report(self, year: int):
        return await self.request("GET", f"/v1/activity/reports/yearly/{year}")

    async def server_configuration(self):
        return await self.request("GET", "/v1/server/configuration")

    async def server_mappings(self):
        return await self.request("GET", "/v1/server/mappings")

    async def list_tokens(self):
        return await self.request("GET", "/v1/tokens")

    async def create_token(self, payload: dict[str, Any]):
        return await self.request("POST", "/v1/tokens", json=payload)

    async def revoke_token(self, token_id: str):
        return await self.request("DELETE", f"/v1/tokens/{token_id}")
    async def paginate(self, path: str, params: dict[str, Any] | None = None) -> AsyncGenerator[list[dict[str, Any]], None]:
        params = dict(params or {})
        page = 1
        while True:
            params["page"] = page
            payload = await self.request("GET", path, params=params)
            yield payload["data"]
            pagination = payload.get("pagination")
            if not pagination or page >= pagination["totalPages"]:
                break
            page += 1

    async def aclose(self):
        await self._http.aclose()
