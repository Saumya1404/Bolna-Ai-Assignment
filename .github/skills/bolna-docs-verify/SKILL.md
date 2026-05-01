---
name: bolna-docs-verify
description: "Fetch bolna.ai documentation and verify plan and code against it. Use when: checking Bolna voice agent setup, tools, webhooks, and next steps based on official docs."
argument-hint: "docsUrl(s), files to verify (default: plan.md, systemprompt.md, backend/app/*)"
user-invocable: true
---

# Bolna Docs Verification

Verify the current plan and implementation against Bolna documentation and identify next steps.

## When to Use

- Validating the plan.md against Bolna platform requirements
- Checking FastAPI endpoints, tool names, or webhook shapes vs docs
- Deciding the next steps for Bolna agent setup

## Inputs

- Documentation URL(s) (required): one or more Bolna docs pages
- Files to verify (default): plan.md, systemprompt.md, backend/app/*, data/*.json

## Procedure

1) Gather inputs
- Confirm the docs URL(s).
- Confirm files to verify, or use the defaults.

2) Fetch documentation
- Use fetch_webpage on each docs URL.
- Extract: agent config requirements, tool schema requirements, webhook payloads, auth, call constraints, and any required fields.
- If a docs URL is blocked or incomplete, ask the user for a more specific page.

3) Summarize requirements
- Create a short list of mandatory fields and recommended settings.
- Call out any hard limits (rate limits, concurrency, inbound-only constraints, tool timeouts).

4) Verify plan and code
- Compare plan.md and systemprompt.md to the docs requirements.
- Compare API endpoints and request/response shapes in backend/app/*.py.
- Check that the tool names and paths match what the docs require.

5) Report gaps and next steps
- List mismatches with file references.
- Provide a prioritized next-steps checklist.
- If user asks for fixes, implement changes using apply_patch.

## Output Format

- Findings: bullet list of mismatches or missing items
- Next steps: ordered checklist
- Sources: list of docs URLs used

## Completion Criteria

- Docs fetched and summarized
- Plan and code reviewed against docs
- Clear next steps produced
