# Working conventions for Claude on this repository

## Branch per RC

Each RC (release chunk) developed by Claude gets its own branch, created fresh
from the current `main`:

```
rcNN/claude
```

Examples already used: `rc19/claude`, `rc20/claude`, `rc22/claude`.

Rules:

- Always branch from the tip of `origin/main` at the time the RC starts —
  never from another RC's branch, and never from a stale/cached checkout.
- One branch per RC. Do not reuse a previous `rcNN/claude` branch for a new,
  unrelated RC.
- If a session's default/platform-assigned branch differs from this
  convention (for example a generic `claude/<session-slug>` branch) and
  already carries unrelated history, do not build the RC on top of it —
  create the proper `rcNN/claude` branch from `main` instead, and ask if the
  platform-assigned branch should be used regardless before assuming so.
- Non-RC work (housekeeping, docs, hardening) uses a descriptive branch name
  instead of the `rcNN/claude` pattern (e.g. `docs/...`, `fix/...`).

## Standing PR protocol

- Every change goes through a **draft PR** opened from the RC branch against
  `main`. Never push directly to `main`.
- **Never merge or deploy** without explicit authorization from Romeo/Landry
  in the conversation — a Codex "feu vert technique"/approval verdict is a
  review result, not a merge order, and neither is an external bot
  action (draft→ready, approval, merge) taken outside this session; those
  are reported transparently, not treated as this session's own decision.
- Codex performs an independent review on every RC PR before merge. Address
  every blocking finding, push the fix, and report the new head SHA + CI
  status — do not merge in response to a review verdict alone.

## Don't trust an existing helper's name — check what it actually queries

When a task states a precise data requirement ("the latest **completed**
audit", "a real auditId"), verify the exact filtering behavior of whatever
existing helper you plan to reuse (trace it down to its Prisma query if
needed) rather than assuming a same-named/adjacent helper already enforces
it. No other page needed that guarantee before, so there is no reason to
assume one already provides it.

(This caught a real bug in RC22: `getLatestAudit()` — reused from
`PageOpportunites`/`PageExecution`/`PageRapports` — only sorts by
`createdAt`, with no `status` filter, so a newer pending/failed audit could
mask an earlier completed one's findings.)

## Status enums: switch over every value, never negate a shorthand

When rendering UI driven by a backend enum with more than two values (e.g.
`ok | partial | not_connected | not_configured | unavailable`), handle each
value explicitly instead of collapsing the "not the happy path" cases into a
single negated condition like `status !== 'ok'`. Two states that both aren't
`'ok'` can still call for different UI (e.g. `not_connected` is actionable
with a "Configure" CTA, `unavailable` is a transient failure with no CTA at
all).

## Prefer the exact backend union over a defensive `| string` widening

For a contract shared with your own backend (not an untrusted third party),
mirror its union types exactly. Widening a type like
`confidence?: 'observed' | 'heuristic' | string` "just in case" makes an
unrecognized value fall through to whichever branch happens to be the
`else` — which can silently mislabel data (e.g. defaulting to "observed"
for something that was neither). Prefer an exact union plus exhaustive
per-value rendering, so an unexpected value renders nothing rather than a
wrong label.
