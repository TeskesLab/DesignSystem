package designsystem

import (
	"image/color"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/canvas"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/theme"
	"fyne.io/fyne/v2/widget"
)

type ActionVariant uint8

const (
	SecondaryAction ActionVariant = iota
	PrimaryAction
	QuietAction
	DangerAction
)

// Action composes a native button, not an imitation of a button. Add Object() to
// your layout and use FocusTarget() for explicit canvas focus. All methods must
// run on the Fyne UI goroutine. Business jobs and error presentation stay owned
// by the application; SetBusy blocks dispatch until the application clears it.
type Action struct {
	button      *actionButton
	view        *container.ThemeOverride
	minimum     *fyne.Container
	variant     ActionVariant
	enabled     bool
	busy        bool
	dispatching bool
	onActivate  func()
}

// NewAction retains the label while busy to avoid geometry/focus/name changes.
// Present operation text and completion/failure in a separate persistent status.
// A nil callback is inert. Invalid variants use SecondaryAction.
func (t *Theme) NewAction(label string, variant ActionVariant, onActivate func()) *Action {
	if variant > DangerAction {
		variant = SecondaryAction
	}
	a := &Action{variant: variant, enabled: true, onActivate: onActivate}
	a.button = &actionButton{design: t}
	a.button.Text = label
	a.button.OnTapped = func() { a.Activate() }
	switch variant {
	case PrimaryAction:
		a.button.Importance = widget.HighImportance
	case QuietAction:
		a.button.Importance = widget.LowImportance
	case DangerAction:
		a.button.Importance = widget.DangerImportance
	}
	a.button.ExtendBaseWidget(a.button)
	a.minimum = t.Control(a.button)
	a.view = container.NewThemeOverride(a.minimum, actionTheme{Theme: t, variant: variant})
	return a
}

func (a *Action) Object() fyne.CanvasObject   { return a.view }
func (a *Action) FocusTarget() fyne.Focusable { return a.button }
func (a *Action) Busy() bool                  { return a.busy }
func (a *Action) Enabled() bool               { return a.enabled }

// Activate returns whether a callback was dispatched, including direct and
// shortcut activation. Reentrant calls are blocked even before SetBusy is used.
// A deferred guard release also prevents a recovered callback panic from leaving
// the action permanently locked. Panics are not swallowed by the library.
func (a *Action) Activate() bool {
	if !a.enabled || a.busy || a.dispatching || a.onActivate == nil {
		return false
	}
	a.dispatching = true
	defer func() { a.dispatching = false }()
	a.onActivate()
	return true
}

func (a *Action) SetEnabled(enabled bool) {
	a.enabled = enabled
	a.syncDisabled()
}

func (a *Action) SetBusy(busy bool) {
	a.busy = busy
	a.syncDisabled()
}

func (a *Action) SetIcon(icon fyne.Resource) { a.button.SetIcon(icon) }
func (a *Action) SetLabel(label string)      { a.button.SetText(label) }

// SetTheme updates a scoped action when the application's density or explicit
// preference changes. Native button identity and focus target remain stable.
func (a *Action) SetTheme(t *Theme) {
	a.button.design = t
	a.minimum.Layout = controlLayout{height: t.Metrics().ControlHeight}
	a.view.Theme = actionTheme{Theme: t, variant: a.variant}
	a.view.Refresh()
}

func (a *Action) syncDisabled() {
	if !a.enabled || a.busy {
		a.button.Disable()
	} else {
		a.button.Enable()
	}
}

// Fyne 2.8 buttons handle Space; add Return and keypad Enter for C01 without
// installing a window-global default that could activate a destructive action.
type actionButton struct {
	widget.Button
	design  *Theme
	focused bool
}

func (b *actionButton) FocusGained() {
	b.focused = true
	b.Button.FocusGained()
}

func (b *actionButton) FocusLost() {
	b.focused = false
	b.Button.FocusLost()
}

// Retain the native renderer and add only a noninteractive focus decoration.
// The ring is separated from the fill so focused primary/danger actions remain
// distinguishable without relying on a low-contrast change of background.
func (b *actionButton) CreateRenderer() fyne.WidgetRenderer {
	native := b.Button.CreateRenderer()
	outline := canvas.NewRectangle(color.Transparent)
	outline.StrokeWidth = FocusWidth
	outline.CornerRadius = RadiusControl + FocusOffset + FocusWidth/2
	renderer := &actionRenderer{
		WidgetRenderer: native,
		button:         b,
		outline:        outline,
		objects:        append(native.Objects(), outline),
	}
	renderer.refreshOutline()
	return renderer
}

type actionRenderer struct {
	fyne.WidgetRenderer
	button  *actionButton
	outline *canvas.Rectangle
	objects []fyne.CanvasObject
}

func (r *actionRenderer) Objects() []fyne.CanvasObject { return r.objects }

func (r *actionRenderer) Layout(size fyne.Size) {
	r.WidgetRenderer.Layout(size)
	const inset = FocusOffset + FocusWidth/2
	r.outline.Move(fyne.NewPos(-inset, -inset))
	r.outline.Resize(size.Add(fyne.NewSize(2*inset, 2*inset)))
}

func (r *actionRenderer) Refresh() {
	r.WidgetRenderer.Refresh()
	r.refreshOutline()
}

func (r *actionRenderer) refreshOutline() {
	r.outline.StrokeColor = r.button.design.token(FocusRing, fyne.CurrentApp().Settings().ThemeVariant())
	r.outline.Hidden = !r.button.focused
	r.outline.Refresh()
}

func (b *actionButton) TypedKey(event *fyne.KeyEvent) {
	if event.Name == fyne.KeySpace || event.Name == fyne.KeyReturn || event.Name == fyne.KeyEnter {
		// Fyne's pointer Tapped path clears focus before dispatch. Keyboard
		// activation must retain it, unless the application deliberately moves it.
		if !b.Disabled() && b.OnTapped != nil {
			b.OnTapped()
		}
		return
	}
	b.Button.TypedKey(event)
}

type actionTheme struct {
	*Theme
	variant ActionVariant
}

func (t actionTheme) Color(name fyne.ThemeColorName, variant fyne.ThemeVariant) color.Color {
	var role Role
	if t.variant == PrimaryAction {
		switch name {
		case theme.ColorNameHover:
			role = ActionPrimaryHover
		case theme.ColorNamePressed, theme.ColorNameFocus:
			role = ActionPrimaryPressed
		default:
			return t.Theme.Color(name, variant)
		}
	} else if t.variant == DangerAction {
		switch name {
		case theme.ColorNameError:
			role = ActionDangerBg
		case theme.ColorNameForegroundOnError:
			role = ActionDangerText
		case theme.ColorNameHover:
			role = ActionDangerHover
		case theme.ColorNamePressed, theme.ColorNameFocus:
			role = ActionDangerPressed
		default:
			return t.Theme.Color(name, variant)
		}
	} else if t.variant == QuietAction && name == theme.ColorNameForeground {
		role = TextLink
	} else {
		return t.Theme.Color(name, variant)
	}
	return t.token(role, variant)
}
