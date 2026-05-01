---
name: voice-call-compliance-review
description: 'Use when reviewing agent prompts, system prompts, call scripts, or conversation flows for automated voice calls against RBI, TRAI, consent, DND, disclosure, opt-out, and call-time compliance concerns.'
argument-hint: 'Review these prompts for RBI/TRAI compliance in automated voice calls.'
user-invocable: true
---
# Voice Call Compliance Review

## When to Use
- Review agent prompts for automated outbound or inbound voice calls
- Check whether a call script, system prompt, or workflow risks violating RBI/TRAI-related expectations
- Assess consent, disclosure, caller identity, opt-out, DND handling, and operational guardrails
- Compare prompt behavior against the intended customer support or sales use case

## Procedure
1. Read the prompt, call flow, and any surrounding implementation notes.
2. Identify the call purpose, caller identity, data captured, call direction, and whether the call is transactional, informational, support-related, or promotional.
3. Check for compliance-sensitive gaps:
   - consent or lawful basis before the call
   - clear disclosure that the caller is an automated agent or business representative
   - opt-out, stop-calling, or human-escalation path
   - DND / suppression-list handling where applicable
   - calling-hour or timezone restrictions where applicable
   - limits on repeated retries, callback loops, or spam-like behavior
   - handling of personal data, OTPs, account numbers, and sensitive information
   - transcript retention, logging, and access controls
4. Flag prompt wording that could mislead users, pressure them, collect unnecessary data, or skip disclosure.
5. Distinguish between what the prompt guarantees, what the product implementation must enforce, and what needs legal or policy confirmation.
6. Compare the current prompt against safer alternatives and explain the tradeoffs.
7. If the evidence is incomplete, state the missing source instead of assuming compliance.

## Output Format
Return a short compliance review with these sections:
- Scope
- Compliance Findings
- Risky Prompt Lines or Behaviors
- Recommended Prompt Fixes
- Implementation Guardrails
- Open Questions

## Review Criteria
- Be specific about the exact prompt behavior being reviewed.
- Prefer concrete findings over generic advice.
- Call out any mismatch between the agent prompt and the actual telephony workflow.
- Treat this as a compliance screening aid, not legal advice.
- If the prompt is safe only when paired with backend controls, say which controls are required.

## Notes
- Verify the latest RBI and TRAI requirements before relying on the result.
- If the call use case is customer support, distinguish it from marketing or promotional outreach.
- If the use case includes outbound dialing at scale, review retries, identity, consent records, and suppression handling carefully.