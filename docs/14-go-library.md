# Go / Fyne library

The reusable module is `github.com/TeskesLab/DesignSystem/go`, package `designsystem`, under `go/`. It pins **Fyne v2.8.2** and uses Go 1.22 or newer. It is ready for local-module consumption; this change does not publish a module or migrate a product. Until a module revision is available remotely, use a local `replace` directive:

```go
require github.com/TeskesLab/DesignSystem/go v0.0.0
replace github.com/TeskesLab/DesignSystem/go => /absolute/path/to/DesignSystem/go
```

The module contains generated typed tokens, embedded canonical font files, an actual `fyne.Theme`, small action/status helpers, and native-widget showcases. Generated `tokens_generated.go` and `fonts/` are owned by `scripts/build_native.py`; do not hand-edit them. Apache-2.0 module licensing and the fonts' original SIL OFL travel with the module; project documentation remains CC-BY-SA-4.0.

## Install the theme; keep native controls

```go
package main

import (
    "fyne.io/fyne/v2"
    "fyne.io/fyne/v2/app"
    "fyne.io/fyne/v2/container"
    "fyne.io/fyne/v2/widget"
    ds "github.com/TeskesLab/DesignSystem/go"
)

func main() {
    a := app.New()
    design := ds.NewTheme(ds.Comfortable, false)
    a.Settings().SetTheme(design)
    window := a.NewWindow("Device details")
    value := widget.NewEntry()
    value.SetText("device://lab/analyzer-01")
    status := design.NewStatus("Ready", ds.NeutralStatus)
    copyValue := design.NewAction("Copy value", ds.PrimaryAction, func() {
        a.Clipboard().SetContent(value.Text)
        status.Set("Copied value", ds.SuccessStatus)
    })
    window.SetContent(container.NewVBox(
        widget.NewForm(widget.NewFormItem("Technical value", design.Control(value))),
        copyValue.Object(), status,
    ))
    window.Resize(fyne.NewSize(540, 260))
    window.ShowAndRun()
}
```

Use native `widget.Entry`, `widget.Select`, `widget.Check`, `widget.Form`, `widget.Table`, `widget.Hyperlink`, Fyne tabs, containers and dialogs directly. No alternative widget framework, bespoke dialog stack, or fake table model is introduced. Provide visible field labels with `widget.Form`; validate and associate errors through the native entry/form APIs. Large data remains in data-backed native tables rather than one child widget per record.

`NewTheme(density, touch)` follows the variant Fyne requests. `NewFixedTheme(scheme, density, touch)` explicitly selects Light or Dark, useful for a user preference or screenshots. A zero `Theme` is comfortable and follows the requested variant. Invalid explicit schemes fall back to Light; invalid densities fall back to Comfortable. Do not mutate theme internals: construct a replacement when preferences change, set it on application settings, and call `SetTheme` on existing action/status helpers. This preserves their identity. Recreate `Control` containers when their density changes, or keep density fixed per view. Returning to System means installing `NewTheme`, not persisting an inferred light/dark choice.

### Geometry and fonts

`Theme.Metrics()` returns canonical density values. `Theme.Control(nativeControl)` is a layout-only minimum target: 44 logical units for Comfortable, 32 for non-touch Compact. Touch always uses Comfortable. It never adds a focus stop or forces content below the native widget's minimum. Action helpers include this wrapper automatically. Native widgets that are not wrapped still receive the theme's font, radius and padding changes, but Fyne does not expose a global minimum-control-height setting.

The Fyne scalar inner-padding setting is half the canonical vertical control padding because the native button applies it in both its text renderer and its outer renderer. Fyne's layout/font metrics and one scalar padding value cannot reproduce independent web horizontal/vertical padding exactly. The wrapper guarantees a minimum, not a fixed height; enlarged text and long labels may grow controls. Rows and tables retain native sizing; use `Metrics().RowHeight` when configuring product-specific table rows.

The theme embeds and initializes font resources once:

- Regular: IBM Plex Sans Regular, real weight 400.
- Bold: IBM Plex Sans SemiBold, real weight 600.
- Monospace, including bold monospace requests: IBM Plex Mono Regular, real weight 400; no synthesized bold face.
- Italic or symbol requests: explicit Fyne default-font fallback, not a fabricated Plex face. The default toolkit can itself honor user font configuration. This package does not provide Plex italics or assert full international glyph coverage.

Font resources are shared; treat their `Content()` bytes as read-only. Font/layout units are logical units and remain subject to Fyne scaling, not physical pixels.

### Color mapping and native differences

The theme maps page/raised/sunken surfaces, text, placeholders, input boundaries, primary and status pairs, selected surfaces, separators and scrollbar colors. Native primary controls receive `ActionPrimaryBg` with `ActionPrimaryText`; error/success/warning native importance colors use their corresponding status text color as fill and status background as the paired foreground. Unknown colors, sizes and icons delegate to Fyne's default theme, including the fixed variant when one was selected.

Fyne composites focus/hover/pressed colors over widget backgrounds, so the general theme uses translucent focus-token overlays rather than treating these as opaque page surfaces. Action helpers scope primary/danger hover and pressed colors to canonical action pairs, and quiet actions use link text. Their native renderer is decorated with the canonical separated focus ring; the ring remains visible when a focused action becomes busy. Allow space around actions for this outside decoration. Entry outlines, selection, disabled controls and overlay rendering still need product-specific inspection on real platforms. The library does not claim web pixel identity, universal screen-reader parity, or accessibility certification.

## Guarded action helper

`design.NewAction(label, variant, callback)` returns an `*Action`. Variants are `PrimaryAction`, `SecondaryAction`, `QuietAction`, and `DangerAction`; invalid variants become Secondary. Add `action.Object()` to a layout. `action.FocusTarget()` returns the native focusable button for `window.Canvas().Focus(...)`. Icon and label changes use `SetIcon` and `SetLabel`.

The implementation keeps Fyne's native button, pointer behavior, focus traversal, accessible button label and base renderer, adding a noninteractive focus outline. The focused keyboard route handles Space, Return and keypad Enter without Fyne 2.8.2's pointer-only focus clearing. Activation keeps focus while becoming busy and respects a callback that deliberately moves focus elsewhere. It does not install a global/default Enter action, particularly for dangerous operations. The application still owns irreversible-action confirmation and sensible initial dialog focus.

`SetEnabled`, `SetBusy`, `Enabled`, `Busy`, and `Activate` are the state API. The native event callback, keyboard path and direct `Activate()` all pass through the same guard. Disabled, busy, nil-callback and reentrant dispatch are rejected; `Activate()` returns whether a callback ran. Clearing busy does not override an explicitly disabled action. Busy does not replace the widget, its label, its minimum geometry, or its existing focus; it disables native dispatch and removes it from subsequent normal enabled-control traversal. Show progress/operation wording separately rather than replacing the accessible action name.

There is deliberately no invented job runner or simulated progress. Keep blocking work off the UI goroutine and publish actual completion/error state using `fyne.Do`. For example, an application supplying a real operation can use:

```go
func operationAction(design *ds.Theme, run func() error, result *widget.Label) *ds.Action {
    var action *ds.Action
    action = design.NewAction("Run operation", ds.PrimaryAction, func() {
        action.SetBusy(true) // before dispatch, so repeat activation cannot race
        result.SetText("Running operation")
        go func() {
            err := run() // the application's actual operation, not a fixture timer
            fyne.Do(func() {
                action.SetBusy(false) // runs on both success and ordinary error
                if err != nil {
                    result.SetText("Operation failed: " + err.Error())
                    return
                }
                result.SetText("Operation completed")
            })
        }()
    })
    return action
}
```

All helper mutations and `Activate()` belong on the Fyne UI goroutine; these are not cross-thread synchronization primitives. Worker cancellation, closed-window ownership and backend idempotency remain application concerns. Callback panics propagate instead of being suppressed; the synchronous reentrancy guard is released with `defer`, but panic recovery and recovery of an application's asynchronous busy state are the application's responsibility. Ordinary error paths must clear busy as shown above.

## Noninteractive status helper

`design.NewStatus(text, kind)` creates a noninteractive, accessible-text badge. Kinds are `NeutralStatus`, `InfoStatus`, `SuccessStatus`, `WarningStatus`, and `DangerStatus`; unknown kinds fall back to Neutral. `status.Set(text, kind)` refreshes foreground/background together. `status.SetTheme(design)` refreshes both colors on a preference change.

Badges are short text, not buttons, links, live regions, or complete error-callout implementations. They size to their full label rather than eliding its meaning. On constrained widths use a wrapping native label for long explanations and put badges in an appropriate wrapping/stacked parent. Changing operational state may require a separate application/platform announcement; setting a badge alone does not promise an announcement. Publication, verification, health and freshness should remain separately named states.

## Showcases and regression commands

From the repository root, after generating native assets:

```sh
cd go
go mod download
go test ./...
go run ./cmd/render -output ../validation/native/fyne
```

The renderer uses `test.NewApp()` and its **real Fyne software painter**. It creates native controls and native widget renderers, dispatches the actual clipboard callback via Return, and rejects disabled/busy direct activation. It writes:

- `validation/native/fyne/fyne-light-comfortable.png`
- `validation/native/fyne/fyne-light-compact.png`
- `validation/native/fyne/fyne-dark-comfortable.png`
- `validation/native/fyne/fyne-dark-compact.png`

These captures require neither Xvfb nor OpenGL development libraries. They are genuine toolkit renders, not HTML mockups or a hand-drawn facsimile. The unrelated `test.NewCanvas()` constructor has no painter and produces blank captures; do not substitute it. The screenshot fixtures include explicitly named busy/disabled specimens, not pretend business jobs. Captures exercise both schemes/densities but are not an approved visual baseline until reviewed.

An interactive desktop gallery is also available:

```sh
cd go
go run -tags desktop ./cmd/showcase
```

It provides System/Light/Dark, Comfortable/Compact and Touch controls. Changing preferences rebuilds this demonstration's sample form, so edited fixture values reset; production applications should retain their own model and update helper themes in place. Its copy/clear/restore/focus controls perform the named local operations. The `desktop` tag prevents ordinary software-rendering tests from requiring the desktop graphics driver.

Desktop prerequisites are Fyne's platform C toolchain and graphics/window-system development libraries. On Debian/Ubuntu, the usual base is `build-essential pkg-config libgl1-mesa-dev xorg-dev libwayland-dev wayland-protocols libxkbcommon-dev`; a working display is needed to run. The pinned GLFW build includes X11 and Wayland support. Other operating systems need their corresponding Fyne toolchain. Software capture and the default tests need Go and downloaded module dependencies, not those desktop packages. All module dependencies, including optional desktop imports, are resolved in `go.mod`/`go.sum`.

Tests cover requested versus fixed schemes, native minimum sizes, touch-density protection, invalid tokens, paired contrast, Space/Return/keypad Enter and pointer dispatch, direct-callback guard bypass attempts, busy/disabled ordering, reentrancy, panic guard release, stable busy identity/geometry/focus, visible focus-ring transitions, status changes, and semantic color presence in actual native software raster output. They are intentionally not `t.Parallel` because Fyne's application/theme state is process-global. Tests do not certify OS accessibility, exact hardware compositing, or every toolkit control.
