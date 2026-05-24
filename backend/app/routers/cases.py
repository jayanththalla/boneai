"""
BoneAI — Cases Router (Radiologist Queue).

GET  /cases              → List flagged cases with pagination
PATCH /cases/{report_id} → Update case status + radiologist note
"""
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import CaseRecord, CasePatch, CaseStatus

logger = logging.getLogger("boneai.cases")

router = APIRouter(tags=["cases"])


def _get_cases_store() -> dict[str, CaseRecord]:
    """Lazy import to avoid circular dependency with triage router."""
    from app.routers.triage import cases_store
    return cases_store


@router.get("/cases", response_model=list[CaseRecord])
async def list_cases(
    status: Optional[CaseStatus] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """Return paginated list of radiologist queue cases."""
    store = _get_cases_store()
    cases = list(store.values())

    # Filter by status if provided
    if status is not None:
        cases = [c for c in cases if c.status == status]

    # Sort by timestamp descending (newest first)
    cases.sort(key=lambda c: c.timestamp, reverse=True)

    # Paginate
    start = (page - 1) * limit
    end = start + limit

    return cases[start:end]


@router.patch("/cases/{report_id}", response_model=CaseRecord)
async def update_case(report_id: str, patch: CasePatch):
    """Update case status and radiologist note."""
    store = _get_cases_store()

    if report_id not in store:
        raise HTTPException(status_code=404, detail=f"Case {report_id} not found")

    case = store[report_id]
    case.status = patch.status

    if patch.radiologist_note is not None:
        case.radiologist_note = patch.radiologist_note

    store[report_id] = case

    logger.info(f"Case {report_id} updated: status={patch.status}")

    return case
