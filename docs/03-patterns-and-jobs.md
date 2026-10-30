# Product patterns and asynchronous work

## Reading / knowledge

Start with a useful title and summary. Keep article text within roughly 60-80 characters per line and normally <=740 px. Show source and revision metadata quietly. Use a right contents rail only when enough space remains; otherwise use an inline disclosure.

Article, Sources, and History are different views. A citation opens a source drawer without losing the passage the reader was reading. Sources show title, quoted passage or artifact context, availability, and review state before IDs. Relationships need a type and a reason; a graph is an optional inspection view.

A page can be published without being independently verified. Label attribution only when it exists. Connection settings and diagnostics belong in their own location, with contextual notices when they affect the task.

The reference's 224 px rail and 740 px measure are shared starting values. The original Librarian handoff's 228 px rail is a product-specific geometry detail, not a conflict in identity.

## Technical workspace

Keep target identity, connection, active artifact, and current operation visible. The central region is the data being inspected. Put properties in a resizable inspector, and operations/results in a stable region.

Hex editors need virtualization, offset navigation, selection, search, copy formats, and large-buffer behavior in the actual product. The 128-byte specimen demonstrates hierarchy and colors only. It is not a production hex editor.

Mutating actions identify the exact target and affected range. Separate actions that read or export from erase/program/write actions. Before a real destructive operation, show preconditions, backup availability when relevant, consequence, and whether it can be undone. Verification is its own reported phase.

On mobile, inspection can stack. Do not squeeze desktop multi-pane controls into unusable columns. Some workflows may need a deliberate read-only mobile mode; document that product decision.

## Monitoring / operations

Contract only in v1; no full dashboard implementation.

Lead with health, freshness timestamp, and active problems. Distinguish measured value, threshold, stale value, and missing value. Label units and sample intervals. Favor trend plus context over decorative gauges. A device offline is not automatically powered off. Do not animate a stale value as if it were live.

Give operators a drill-down path from overview to device to raw event/log. Critical alerts remain until acknowledged/resolved according to product policy; a toast is insufficient.

## Job data contract

Keep backend execution separate from UI connectivity:

    jobId: string
    operation: string
    targetId: string
    phase: queued | running | cancelling | cancelled | succeeded | failed
    lastConfirmedPhase: same enum
    connection: connected | reconnecting | disconnected
    updatedAt: timestamp
    completedUnits: number | null
    totalUnits: number | null
    unit: bytes | items | steps | null
    canCancel: boolean
    result: object | null
    error: { code, userMessage, diagnosticId } | null

The display may derive an **unknown** state when status cannot be confirmed. Unknown is not a backend assertion that execution stopped.

| Trigger | Display/result | Required behavior |
| --- | --- | --- |
| Accepted operation | Queued with durable job ID | Disable duplicate launch; retain target context |
| Worker starts | Running | Show phase and measured progress if available |
| Total unknown | Working, no percent | Use text/indeterminate indicator |
| User requests cancel | Cancellation requested | Disable repeated request; wait for acknowledgement |
| Worker confirms cancel | Cancelled | Explain partial output and available next action |
| Cancel races with completion | Completed | Display actual final result; do not force cancelled |
| Worker fails | Failed | Preserve error, partial result, diagnostic details; offer safe recovery |
| Connection is lost | Status unknown / last confirmed state | Retain job ID; stop implying live progress; reconcile |
| Reconnection | Query same job ID | Update from authoritative result before retrying |
| User closes view | Work continues if supported | Keep a discoverable jobs location; no implicit cancellation |
| Retry requested | New job or backend-supported retry | Check target state and idempotency; never auto-repeat destructive operations |

The demo uses a local timer to exercise these presentation states. Its percentage is explicitly synthetic. Backend persistence, multi-client coordination, authorization, cancellation guarantees, and idempotency are product responsibilities.

## Search and filters

Search starts near the content it finds. Keep query, filters, and result count visible. Debounce remote requests and prevent older responses replacing newer ones. Keep the last successful result visible during a refresh when appropriate, with honest freshness/loading labels.

Distinguish exact matches from related results. Explain why an adjacent item is relevant. Empty because of filters differs from an empty dataset. A failed request must not become “No results”.

## Settings and secrets

Group settings by user intent. Explain consequences beside uncommon or risky choices. Use switches for immediate settings and explicit Save/Cancel for forms. Keep unsaved changes visible.

Mask secrets by default; deliberate reveal and copy should have clear controls and permissions. Do not put credentials in screenshots, URLs, logs, status badges, or generic toast text. This is a product behavior rule, not an extra approval flow.
