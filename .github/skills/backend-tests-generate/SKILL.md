---
name: backend-tests-generate
description: "Generate pytest tests for the FastAPI backend in this repo. Use when: adding tests for availability, booking, appointment CRUD, webhook, dashboard, or doctors endpoints."
argument-hint: "endpoints to cover, test depth (smoke vs full), DB strategy (temp sqlite vs patch), test folder"
user-invocable: true
---

# Backend Tests Generator

Generate focused, repo-aware tests for the FastAPI backend based on the current app structure.

## When to Use

- Adding or updating tests for backend endpoints
- Creating a regression suite after API changes
- Verifying webhook behavior and DB updates

## Inputs

- Endpoints to cover (default: all in backend/app/main.py)
- Test depth: smoke (happy path) or full (happy + error cases)
- DB strategy: temp sqlite file, in-memory sqlite, or patched storage
- Test folder (default: tests/)

## Procedure

1) Inspect the code
- Read backend/app/main.py for routes, status codes, and behavior.
- Read backend/app/schemas.py for request/response models.
- Read backend/app/storage.py for DB interactions and seeding.

2) Decide the test strategy
- Prefer FastAPI TestClient for request-level tests.
- Choose DB isolation:
  - Temp sqlite file per test module (recommended).
  - In-memory sqlite if safe for connection lifecycle.
  - Monkeypatch storage.get_connection or DB_PATH.

3) Build a test matrix
- /api/doctors: list all, filter by specialization.
- /api/availability: available slot, unavailable slot with alternatives, no doctor match.
- /api/book: success, no matching doctor (404), slot conflict (409).
- /api/appointment: lookup by id, phone, name.
- /api/appointment/{id}: update success, no updates (400), not found (404), conflict (409).
- /webhook/bolna: extraction payload updates, FAQ call (no appointment found).
- /dashboard: HTML response contains seeded rows and status badge text.

4) Implement tests
- Seed doctors and appointments before tests (direct DB insert or seed data files).
- Use deterministic data and fixed dates.
- Assert status codes and key response fields.

5) Quality checks
- Ensure tests are deterministic and isolated.
- Avoid network calls and external dependencies.
- Run pytest and fix any flaky behavior.

## Output Format

- Create tests under tests/ (or user-specified folder).
- Group tests by endpoint file (e.g., test_api_booking.py, test_webhook.py).

## Completion Criteria

- All requested endpoints have tests.
- Happy paths and key error paths are covered.
- Tests pass locally with a clean DB state.
