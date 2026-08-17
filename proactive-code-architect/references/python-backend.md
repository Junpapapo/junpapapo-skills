# Proactive Code Architect — Python Reference

Specialized patterns and rules for Python backend and data projects. This
extends the core rules in `../SKILL.md` with Python-specific guidance.

---

## 1. Feature-Module Canonical Structure

### Web API (FastAPI / Django / Flask)

```
feature_name/
  ├── __init__.py               ← Public API (re-exports only)
  ├── router.py                 ← HTTP endpoints / route definitions
  ├── service.py                ← Business logic (orchestration layer)
  ├── repository.py             ← Database access / external API calls
  ├── schemas.py                ← Pydantic models / marshmallow schemas
  ├── models.py                 ← ORM models (SQLAlchemy, Django ORM)
  ├── utils.py                  ← Pure functions (zero I/O, zero framework)
  ├── constants.py              ← Enums, magic strings, defaults
  ├── exceptions.py             ← Feature-specific exception classes
  └── tests/
      ├── test_service.py
      ├── test_repository.py
      └── test_utils.py
```

### Data / ML Pipeline

```
feature_name/
  ├── __init__.py               ← Public API
  ├── pipeline.py               ← Orchestration (DAG definition)
  ├── extractors.py             ← Data loading / source connectors
  ├── transformers.py           ← Data transformation logic
  ├── validators.py             ← Data quality checks
  ├── schemas.py                ← Data schemas (Pydantic / dataclasses)
  ├── utils.py                  ← Pure helper functions
  └── tests/
      ├── test_transformers.py
      └── test_validators.py
```

### CLI Tool

```
feature_name/
  ├── __init__.py
  ├── cli.py                    ← argparse / click command definitions
  ├── service.py                ← Core logic (CLI-agnostic)
  ├── formatters.py             ← Output formatting (JSON, table, CSV)
  ├── schemas.py                ← Input/output data structures
  └── utils.py                  ← Pure helpers
```

---

## 2. File Responsibilities (Strict)

| File | Allowed | Forbidden |
|------|---------|-----------|
| `router.py` | Route decorators, request parsing, response formatting, input validation delegation | Business logic, SQL queries, file I/O |
| `service.py` | Business orchestration, calling repository + utils, transaction management | SQL queries, HTTP parsing, direct `open()` calls |
| `repository.py` | Database queries, ORM operations, external API calls | Business decisions, HTTP framework imports |
| `schemas.py` | Pydantic/dataclass definitions, validators, serialization config | Business logic, database imports |
| `models.py` | ORM model classes, field definitions, table metadata | Business logic, HTTP imports |
| `utils.py` | Pure functions, formatters, validators, math | Any I/O, database, HTTP, framework imports |
| `constants.py` | Enums, defaults, string literals | Runtime computation |
| `exceptions.py` | Custom exception classes | Catch-and-handle logic |
| `__init__.py` | Re-exports, `__all__` definition | Business logic, class definitions |

---

## 3. Layer Architecture

```
router.py  ──────────►  service.py  ──────────►  repository.py
(HTTP layer)             (business logic)         (data access)
     │                        │                        │
     ▼                        ▼                        ▼
schemas.py              utils.py                  models.py
(request/response)      (pure functions)          (ORM models)
```

### Dependency Flow Rules

- `router` → `service` → `repository` (strict one-way)
- `router` → `schemas` (for request/response validation)
- `service` → `utils`, `schemas`, `repository`
- `repository` → `models` (ORM), external APIs
- `utils` → `schemas` only (for type definitions)
- **NEVER**: `repository` → `router`, `utils` → `service`, `models` → `router`

---

## 4. Service Layer Pattern

```python
# ✅ service.py — business logic, no framework imports
from .repository import FeatureRepository
from .schemas import FeatureInput, FeatureOutput, FeatureFilter
from .utils import calculate_score, validate_range
from .exceptions import FeatureNotFoundError, InvalidFilterError


class FeatureService:
    """Orchestrates feature business logic.

    All I/O is delegated to the repository layer.
    All computation is delegated to utils.
    """

    def __init__(self, repo: FeatureRepository):
        self._repo = repo

    async def get_by_id(self, feature_id: str) -> FeatureOutput:
        raw = await self._repo.fetch(feature_id)
        if raw is None:
            raise FeatureNotFoundError(feature_id)
        return FeatureOutput(
            id=raw.id,
            name=raw.name,
            score=calculate_score(raw.metrics),
        )

    async def list_filtered(self, filters: FeatureFilter) -> list[FeatureOutput]:
        if not validate_range(filters.min_score, filters.max_score):
            raise InvalidFilterError("min_score must be <= max_score")
        items = await self._repo.query(filters)
        return [self._to_output(item) for item in items]

    def _to_output(self, raw) -> FeatureOutput:
        return FeatureOutput(id=raw.id, name=raw.name, score=calculate_score(raw.metrics))
```

```python
# ❌ WRONG — service.py doing I/O directly
class FeatureService:
    async def get_by_id(self, feature_id: str):
        async with aiohttp.ClientSession() as session:  # ← belongs in repository
            resp = await session.get(f"https://api.example.com/{feature_id}")
            data = await resp.json()
        conn = await asyncpg.connect(DATABASE_URL)       # ← belongs in repository
        await conn.execute("INSERT INTO cache ...", data)
        return data
```

---

## 5. Router Layer Pattern

```python
# ✅ router.py — thin HTTP adapter
from fastapi import APIRouter, Depends, HTTPException, status
from .schemas import FeatureInput, FeatureOutput, FeatureFilter
from .service import FeatureService
from .exceptions import FeatureNotFoundError

router = APIRouter(prefix="/features", tags=["features"])


def get_service() -> FeatureService:
    return FeatureService(repo=get_repo())  # dependency injection


@router.get("/{feature_id}", response_model=FeatureOutput)
async def get_feature(feature_id: str, service: FeatureService = Depends(get_service)):
    try:
        return await service.get_by_id(feature_id)
    except FeatureNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feature not found")


@router.get("/", response_model=list[FeatureOutput])
async def list_features(filters: FeatureFilter = Depends(), service: FeatureService = Depends(get_service)):
    return await service.list_filtered(filters)
```

**Rules**:
- Router functions should be <20 lines each.
- One `try/except` per endpoint for domain exceptions → HTTP exceptions mapping.
- No business logic — just parse, delegate, format response.

---

## 6. Utils Rules (Strict)

```python
# ✅ utils.py — ZERO I/O, ZERO framework imports
from decimal import Decimal
from .schemas import MetricData


def calculate_score(metrics: MetricData) -> float:
    """Pure computation — no side effects, no I/O."""
    weighted = metrics.accuracy * 0.4 + metrics.precision * 0.3 + metrics.recall * 0.3
    return round(weighted, 4)


def validate_range(min_val: float | None, max_val: float | None) -> bool:
    """Pure validation — returns bool, never raises."""
    if min_val is None or max_val is None:
        return True
    return min_val <= max_val


def format_percentage(value: float, decimals: int = 2) -> str:
    """Pure formatting."""
    return f"{value * 100:.{decimals}f}%"
```

**Forbidden in utils.py**:
- `import asyncio`, `import aiohttp`, `import requests` — I/O belongs in repository
- `from fastapi import ...` — framework belongs in router
- `from sqlalchemy import ...` — ORM belongs in repository/models
- `open()`, `pathlib.Path().read_text()` — file I/O belongs in repository
- Global mutable state

---

## 7. Schemas / DTOs Pattern

```python
# ✅ schemas.py — data definitions only
from pydantic import BaseModel, Field, field_validator
from enum import Enum
from datetime import datetime


class FeatureStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"


class FeatureInput(BaseModel):
    """Request schema for creating/updating features."""
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)
    tags: list[str] = Field(default_factory=list)

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list[str]) -> list[str]:
        return [tag.strip().lower() for tag in v if tag.strip()]


class FeatureOutput(BaseModel):
    """Response schema for feature data."""
    id: str
    name: str
    score: float
    status: FeatureStatus
    created_at: datetime


class FeatureFilter(BaseModel):
    """Query parameters for list endpoint."""
    query: str | None = None
    status: FeatureStatus | None = None
    min_score: float | None = Field(default=None, ge=0.0, le=1.0)
    max_score: float | None = Field(default=None, ge=0.0, le=1.0)
```

---

## 8. `__init__.py` Pattern

```python
# ✅ __init__.py — re-exports only
"""Feature module public API."""
from .router import router
from .service import FeatureService
from .schemas import FeatureInput, FeatureOutput, FeatureFilter

__all__ = [
    "router",
    "FeatureService",
    "FeatureInput",
    "FeatureOutput",
    "FeatureFilter",
]
```

**Forbidden**: Class definitions, function implementations, global state,
import side effects.

---

## 9. Testing Implications

| File | Test Strategy | Speed |
|------|--------------|-------|
| `utils.py` | Pure unit tests, no mocking needed | <1ms per test |
| `schemas.py` | Validation tests (valid + invalid inputs) | <1ms per test |
| `service.py` | Unit tests with mocked repository | ~5ms per test |
| `repository.py` | Integration tests with test database | ~50ms per test |
| `router.py` | API tests with `TestClient` | ~20ms per test |

**Primary benefit**: `utils.py` and `schemas.py` tests are instantaneous
because they have zero I/O. This is the main reason for separation.

---

## 10. Common Anti-Patterns in Python Projects

| Anti-Pattern | Why It's Bad | Fix |
|-------------|-------------|-----|
| `views.py` with 2000 lines | Django tradition, but unmaintainable | Split to router + service + repository |
| Business logic in serializers | Serializers should only validate shape | Move to service layer |
| SQL in view/router functions | Tight coupling, untestable | Extract to repository |
| God `utils.py` with 50 functions | Becomes a dumping ground | Split by domain: `format_utils.py`, `validation_utils.py` |
| `from module import *` | Namespace pollution, circular risks | Explicit imports always |
| Mutable module-level state | Thread-unsafe, test pollution | Dependency injection via constructor |
| Exception handling in utils | Utils should return values, not raise | Return `Result` types or let caller handle |
| Config values hardcoded | Impossible to test with different values | Move to `constants.py` or env config |
