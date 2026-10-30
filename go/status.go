package designsystem

import (
	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/canvas"
	"fyne.io/fyne/v2/widget"
)

type StatusKind uint8

const (
	NeutralStatus StatusKind = iota
	InfoStatus
	SuccessStatus
	WarningStatus
	DangerStatus
)

// Status is noninteractive text with a paired semantic background. It does not
// claim to be a live region: announce changing state through the platform's
// application-level accessibility integration. Keep badges short; use a native
// wrapping label for an explanatory callout or a persistent error description.
type Status struct {
	widget.BaseWidget
	design *Theme
	kind   StatusKind
	text   string
}

var _ fyne.Accessible = (*Status)(nil)

func (t *Theme) NewStatus(text string, kind StatusKind) *Status {
	s := &Status{design: t, kind: kind, text: text}
	s.ExtendBaseWidget(s)
	return s
}

func (s *Status) AccessibilityLabel() string             { return s.text }
func (s *Status) AccessibilityRole() fyne.AccessibleRole { return fyne.AccessibleRoleText }

func (s *Status) Set(text string, kind StatusKind) {
	s.text, s.kind = text, kind
	s.Refresh()
}

func (s *Status) SetTheme(t *Theme) {
	s.design = t
	s.Refresh()
}

func statusRoles(kind StatusKind) (Role, Role) {
	switch kind {
	case InfoStatus:
		return StatusInfoText, StatusInfoBg
	case SuccessStatus:
		return StatusSuccessText, StatusSuccessBg
	case WarningStatus:
		return StatusWarningText, StatusWarningBg
	case DangerStatus:
		return StatusDangerText, StatusDangerBg
	default:
		return StatusNeutralText, StatusNeutralBg
	}
}

func (s *Status) CreateRenderer() fyne.WidgetRenderer {
	text := canvas.NewText(s.text, nil)
	text.TextSize = TypeMeta
	text.FontSource = regularFont
	background := canvas.NewRectangle(nil)
	background.CornerRadius = 3 // Reference badge geometry, not the generic pill radius.
	r := &statusRenderer{status: s, text: text, background: background, objects: []fyne.CanvasObject{background, text}}
	r.Refresh()
	return r
}

type statusRenderer struct {
	status     *Status
	text       *canvas.Text
	background *canvas.Rectangle
	objects    []fyne.CanvasObject
}

func (r *statusRenderer) Destroy()                     {}
func (r *statusRenderer) Objects() []fyne.CanvasObject { return r.objects }
func (r *statusRenderer) MinSize() fyne.Size {
	return r.text.MinSize().Add(fyne.NewSize(Space2*2, Space1*2))
}
func (r *statusRenderer) Layout(size fyne.Size) {
	r.background.Resize(size)
	textSize := r.text.MinSize()
	r.text.Move(fyne.NewPos(Space2, (size.Height-textSize.Height)/2))
	r.text.Resize(fyne.NewSize(size.Width-Space2*2, textSize.Height))
}
func (r *statusRenderer) Refresh() {
	foreground, background := statusRoles(r.status.kind)
	variant := fyne.CurrentApp().Settings().ThemeVariant()
	r.text.Text = r.status.text
	r.text.Color = r.status.design.token(foreground, variant)
	r.background.FillColor = r.status.design.token(background, variant)
	r.text.Refresh()
	r.background.Refresh()
	r.Layout(r.status.Size().Max(r.MinSize()))
}
