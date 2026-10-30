# Component contracts

The reference CSS is reusable; fixture behavior is not product business logic. Native platforms implement these contracts with their own semantic widgets.

## Shared state model

Every interactive control supports default, hover where available, focus, pressed/active, and disabled where meaningful. Async actions add busy and completion/failure feedback. Selected, checked, expanded, invalid, and read-only are distinct states.

Busy does not silently remove a control or move focus. Preserve its accessible name; show a verb describing the operation. Prevent repeated dispatch in the event handler and backend as appropriate. Disabled styling is never the only enforcement. Read-only data remains selectable and inspectable.

Use minimum dimensions, not fixed heights that clip text. Labels may wrap. Errors are text connected to the input. Hover content must also work on focus; essential actions remain visible without hover.

## Core contracts

| ID / component | Anatomy and variants | Behavior and acceptance |
| --- | --- | --- |
| C01 Button | Label, optional leading/trailing icon. Primary, secondary, quiet, danger. | Real button for actions. Enter/Space activate once. One primary task action per local group. Disabled or busy cannot dispatch. No positional shift on busy. Visible label names the action and object. |
| C02 Link | Meaningful text; optional external-destination indicator. | Real link for navigation. Enter follows it. Preserve open-in-new-tab/copy-link behavior. Underline links inside prose. Never use a button-shaped div. |
| C03 Text field | Label, input, optional helper, optional error, units if needed. | Visible/programmatic label. Validate on blur when useful and on submit; avoid errors while entering an incomplete valid value. On failed submission, focus the first invalid field or a linked summary for long forms. Preserve input. Read-only differs from disabled. |
| C04 Select | Label, current choice, list of options. | Prefer native select for short simple choices. Keyboard and type-to-select work. A custom searchable combobox needs its own keyboard contract and tests; it is not provided in v1. |
| C05 Checkbox | Checkable control plus clickable text label. | Independent boolean or multi-selection; Space toggles. Indeterminate is only for aggregate selection. Mixed does not mean unknown. Whole label is a hit area. |
| C06 Radio group | Group label and mutually exclusive choices. | One tab stop into the group, arrows select within it using native behavior. Use when choices benefit from being visible together. Not demonstrated in the gallery. |
| C07 Switch | Label, on/off state, optional helper. | Applies an immediate setting. Use checkbox for a preference saved later with the form. Expose checked state and support Space. A pending server change has busy/rollback feedback. Not demonstrated in the gallery. |
| C08 Tabs | Tablist, tabs, selected indicator, panels. | Roving tabindex; arrows; Home/End. Automatic activation only for immediate local panels; manual Enter/Space for slow content. Linked routes should remain links unless implementing genuine tab semantics. |
| C09 Navigation | Brand/product identifier, short grouped destinations, active marker. | Real links, aria-current, stable order. Mobile opens a modal menu instead of stacking every desktop navigation group. Close before moving focus to destination title. |
| C10 Data table | Caption/context, headers, rows, optional sort/filter/selection, pagination. | Real table for static tabular data. Numeric columns align right. Sort button exposes aria-sort. Preserve selection while sorting; explain page/all-result selection. Horizontal scrolling stays inside its region. Interactive grid requires separate arrow-key/editing contracts. |
| C11 Status badge | Text, optional icon, paired semantic colors. | Noninteractive by default. Announce changing operational state through a separate live region. Publication, verification, health, and freshness are separate dimensions. |
| C12 Callout | Icon, short heading, explanation, optional action. | Use info, warning, success, or danger according to meaning. Persist errors needing action. Reserve alert announcements for new urgent failures; avoid announcing every static callout on load. |
| C13 Dialog | Title, content, close/cancel, action group. | Move focus inside; make background inert; contain Tab; Escape closes; restore focus. Initial focus is least destructive for irreversible actions. Do not trigger destructive actions through a generic default Enter binding. |
| C14 Drawer | Title, supporting context, inspectable content, close. | Modal drawer follows the dialog contract; nonmodal inspector has no focus trap. At narrow width become full-width. Preserve underlying reading/scroll position. Choose modal vs nonmodal explicitly. |
| C15 Toast | Brief result, optional action, dismiss. | Noncritical confirmation only; polite announcement; never steal focus. Reference timeout 8 s; production pauses while hovered/focused and provides a persistent result elsewhere. Errors and undo requiring a response need persistent feedback. |
| C16 Progress / job | Operation name, state, determinate or indeterminate progress, cancel if supported, persistent result. | Measured progress only. Never fake percent from elapsed time in production. Completion/cancel is acknowledged by the worker. Closing the view is not cancellation. See job contract. |
| C17 Disclosure | Explicit summary label, expanded content. | Native details/summary or toolkit equivalent. Enter/Space toggle. Expanded state is exposed. Do not hide warnings the user needs before acting. |
| C18 Empty state | Specific title, cause/context, useful next action. | Distinguish no items, no matches, no permission, loading, and unavailable. Keep active filters visible. A no-results action can clear the query. |
| C19 Code / technical value | Mono text, label, optional copy, local scroll. | Preserve bytes/whitespace; expose full value and accessible label. Copy reports success only after it occurs. Wrapping identifiers is fine; changing their content is not. |
| C20 Tooltip | Short label/explanation attached to a control. | Available on hover and keyboard focus, dismissible with Escape, stays while pointer enters it. Never contains essential instructions or interactive content. Not demonstrated in the gallery. |

## Component API contract

Framework wrappers should expose equivalent meaning, without requiring identical syntax:

- Button: variant, disabled, busy, label, optional icon, onActivate.
- Field: id, label, value, helperText, errorText, required, disabled, readOnly, onChange.
- Dialog: open, title, description when short, initialFocus, onRequestClose, returnFocus.
- Table: stable rowKey, columns, sort model, selection model, pagination model, empty/loading/error state.
- Job: jobId, phase, lastConfirmedPhase, connection, completedUnits, totalUnits when known, canCancel, result, error, updatedAt.

Use strings for IDs and exact values. Do not use array indexes as persistent keys. Escape untrusted text; the reference uses textContent for data. Source content, log text, and device labels are data, not HTML.

## Geometry and composition

- Button and field minimum heights follow density. Dialogs use comfortable controls.
- Two actions normally align with the content edge; dialog action groups align at the trailing edge and wrap on narrow screens.
- Primary/secondary actions may sit together. Destructive actions need separation and explicit wording, not merely a red neighbor.
- Input boundaries use control-border. Decorative cards use border-subtle.
- A badge is not a button, a table cell is not automatically clickable, and a row containing controls is not one large invisible action.
- A large clickable row needs a clear primary link and separate secondary actions without nested interactive elements.
- The reference table has no pagination because its fixture has three items. Production lists must define pagination, totals, loading, selection scope, and filter persistence.

## Definition of done per component

1. Document purpose, non-use cases, states, tokens, semantic role, focus behavior, and responsive behavior.
2. Render default and edge cases in both themes/densities where supported.
3. Test keyboard activation, disabled dispatch prevention, labels, error association, and long/localized text.
4. Capture an approved reference in the target platform; compare after changes.
5. Record product-specific limitations. Do not claim platform equivalence from a web screenshot.

Trees, comboboxes, date pickers, virtualized grids, chart widgets, rich editors, drag/drop, and command palettes require later contracts. Do not improvise them as token-colored divs.
