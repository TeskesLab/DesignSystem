// Package designsystem supplies Teske's Lab tokens, bundled fonts, and a Fyne theme.
// Widgets and mutations follow Fyne's UI-goroutine rules; marshal worker results
// with fyne.Do. Themes are immutable and may be shared by multiple views.
package designsystem

import (
	_ "embed"
	"image/color"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/theme"
)

//go:embed fonts/IBMPlexSans-Regular.ttf
var sansRegular []byte

//go:embed fonts/IBMPlexSans-SemiBold.ttf
var sansStrong []byte

//go:embed fonts/IBMPlexMono-Regular.ttf
var monoRegular []byte

var (
	regularFont = fyne.NewStaticResource("IBMPlexSans-Regular.ttf", sansRegular)
	strongFont  = fyne.NewStaticResource("IBMPlexSans-SemiBold.ttf", sansStrong)
	monoFont    = fyne.NewStaticResource("IBMPlexMono-Regular.ttf", monoRegular)
)

// Theme maps native roles without replacing standard widgets or their semantics.
// Use NewTheme to follow Fyne's requested variant, or NewFixedTheme for an explicit
// preference. A zero Theme is a comfortable, system-variant theme.
type Theme struct {
	density Density
	touch   bool
	fixed   bool
	scheme  Scheme
}

var _ fyne.Theme = (*Theme)(nil)

func NewTheme(density Density, touch bool) *Theme {
	return &Theme{density: density, touch: touch}
}

// NewFixedTheme pins the color scheme. Invalid schemes fall back to Light.
func NewFixedTheme(scheme Scheme, density Density, touch bool) *Theme {
	if scheme != Dark {
		scheme = Light
	}
	return &Theme{density: density, touch: touch, fixed: true, scheme: scheme}
}

func (t *Theme) Metrics() Metrics { return Dimensions(t.density, t.touch) }

func (t *Theme) resolvedScheme(variant fyne.ThemeVariant) Scheme {
	if t.fixed {
		return t.scheme
	}
	if variant == theme.VariantDark {
		return Dark
	}
	return Light
}

func (t *Theme) token(role Role, variant fyne.ThemeVariant) color.NRGBA {
	c, _ := Color(t.resolvedScheme(variant), role)
	return c
}

// Color preserves paired foregrounds for filled native controls. Focus and hover
// are translucent because Fyne composites these colors over control backgrounds.
func (t *Theme) Color(name fyne.ThemeColorName, variant fyne.ThemeVariant) color.Color {
	var role Role
	switch name {
	case theme.ColorNameBackground:
		role = SurfacePage
	case theme.ColorNameButton, theme.ColorNameInputBackground, theme.ColorNameMenuBackground, theme.ColorNameOverlayBackground:
		role = SurfaceRaised
	case theme.ColorNameForeground:
		role = TextPrimary
	case theme.ColorNamePlaceHolder:
		role = TextSecondary
	case theme.ColorNameDisabled:
		role = TextDisabled
	case theme.ColorNameDisabledButton:
		role = DisabledBg
	case theme.ColorNameInputBorder:
		role = ControlBorder
	case theme.ColorNameSeparator:
		role = BorderSubtle
	case theme.ColorNameHeaderBackground, theme.ColorNameScrollBarBackground:
		role = SurfaceSunken
	case theme.ColorNameScrollBar:
		role = ControlBorder
	case theme.ColorNamePrimary:
		role = ActionPrimaryBg
	case theme.ColorNameForegroundOnPrimary:
		role = ActionPrimaryText
	case theme.ColorNameHyperlink:
		role = TextLink
	case theme.ColorNameSelection:
		role = SurfaceSelected
	case theme.ColorNameError:
		role = StatusDangerText
	case theme.ColorNameForegroundOnError:
		role = StatusDangerBg
	case theme.ColorNameSuccess:
		role = StatusSuccessText
	case theme.ColorNameForegroundOnSuccess:
		role = StatusSuccessBg
	case theme.ColorNameWarning:
		role = StatusWarningText
	case theme.ColorNameForegroundOnWarning:
		role = StatusWarningBg
	case theme.ColorNameFocus, theme.ColorNameHover, theme.ColorNamePressed:
		c := t.token(FocusRing, variant)
		c.A = 64
		if name == theme.ColorNameHover {
			c.A = 32
		}
		return c
	default:
		if t.fixed {
			variant = theme.VariantLight
			if t.scheme == Dark {
				variant = theme.VariantDark
			}
		}
		return theme.DefaultTheme().Color(name, variant)
	}
	return t.token(role, variant)
}

// Font uses only reviewed real faces. Italic and symbol requests use Fyne's
// bundled fallback; bold monospace deliberately uses real Plex Mono Regular.
func (t *Theme) Font(style fyne.TextStyle) fyne.Resource {
	if style.Italic || style.Symbol {
		return theme.DefaultTheme().Font(style)
	}
	if style.Monospace {
		return monoFont
	}
	if style.Bold {
		return strongFont
	}
	return regularFont
}

func (t *Theme) Icon(name fyne.ThemeIconName) fyne.Resource {
	return theme.DefaultTheme().Icon(name)
}

func (t *Theme) Size(name fyne.ThemeSizeName) float32 {
	switch name {
	case theme.SizeNameText:
		return TypeUi
	case theme.SizeNameCaptionText:
		return TypeMeta
	case theme.SizeNameHeadingText:
		return TypeSection
	case theme.SizeNameSubHeadingText:
		return TypeSubheading
	case theme.SizeNamePadding:
		return Space2
	case theme.SizeNameInnerPadding:
		// Native buttons apply inner padding in both text and button renderers.
		return t.Metrics().ControlPaddingY / 2
	case theme.SizeNameInputBorder, theme.SizeNameSeparatorThickness:
		return BorderWidth
	case theme.SizeNameButtonRadius, theme.SizeNameInputRadius, theme.SizeNameSelectionRadius:
		return RadiusControl
	case theme.SizeNameCardRadius, theme.SizeNameDialogRadius, theme.SizeNamePopupRadius, theme.SizeNameMenuRadius, theme.SizeNameInnerWindowRadius:
		return RadiusPanel
	default:
		return theme.DefaultTheme().Size(name)
	}
}

// Control wraps a standard control in a minimum touch/density target. It never
// shrinks content, fixes a height, intercepts events, or adds another focus stop.
// Fyne has no global control-height token; use this for inputs, selects and checks.
func (t *Theme) Control(object fyne.CanvasObject) *fyne.Container {
	return container.New(controlLayout{height: t.Metrics().ControlHeight}, object)
}

type controlLayout struct{ height float32 }

func (l controlLayout) MinSize(objects []fyne.CanvasObject) fyne.Size {
	size := fyne.NewSize(0, l.height)
	for _, object := range objects {
		if object.Visible() {
			size = size.Max(object.MinSize())
		}
	}
	return size
}

func (l controlLayout) Layout(objects []fyne.CanvasObject, size fyne.Size) {
	for _, object := range objects {
		if object.Visible() {
			object.Move(fyne.NewPos(0, 0))
			object.Resize(size.Max(object.MinSize()))
		}
	}
}
