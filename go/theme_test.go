package designsystem

import (
	"image/color"
	"math"
	"testing"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/test"
	"fyne.io/fyne/v2/theme"
	"fyne.io/fyne/v2/widget"
)

func testWindow(t *testing.T, design *Theme) fyne.Window {
	t.Helper()
	a := test.NewApp()
	a.Settings().SetTheme(design)
	window := a.NewWindow(t.Name())
	t.Cleanup(func() { window.Close(); a.Quit() })
	return window
}

func sameColor(a, b color.Color) bool {
	ar, ag, ab, aa := a.RGBA()
	br, bg, bb, ba := b.RGBA()
	return ar == br && ag == bg && ab == bb && aa == ba
}

func TestThemeHonorsRequestedAndFixedSchemes(t *testing.T) {
	design := NewTheme(Comfortable, false)
	testWindow(t, design)
	for _, scheme := range []Scheme{Light, Dark} {
		variant := theme.VariantLight
		if scheme == Dark {
			variant = theme.VariantDark
		}
		want := design.Color(theme.ColorNameBackground, variant)
		fixed := NewFixedTheme(scheme, Compact, false)
		other := theme.VariantDark
		if variant == other {
			other = theme.VariantLight
		}
		if sameColor(want, design.Color(theme.ColorNameBackground, other)) {
			t.Fatal("adaptive theme ignored the requested variant")
		}
		for _, requested := range []fyne.ThemeVariant{theme.VariantDark, theme.VariantLight} {
			if !sameColor(fixed.Color(theme.ColorNameBackground, requested), want) {
				t.Fatal("fixed theme followed requested variant")
			}
		}
	}
}

func TestDensityTargetsNeverClipNativeContent(t *testing.T) {
	window := testWindow(t, NewTheme(Comfortable, false))
	for _, density := range []Density{Compact, Comfortable, Density(255)} {
		for _, touch := range []bool{false, true} {
			design := NewTheme(density, touch)
			fyne.CurrentApp().Settings().SetTheme(design)
			entry := widget.NewEntry()
			entry.SetText("Long localized value — 日本語")
			control := design.Control(entry)
			window.SetContent(control)
			minimum := control.MinSize()
			if minimum.Height < design.Metrics().ControlHeight || minimum.Height < entry.MinSize().Height || minimum.Width < entry.MinSize().Width {
				t.Fatal("density wrapper clips native minimum")
			}
			control.Resize(minimum)
			if entry.Size().Height < entry.MinSize().Height {
				t.Fatal("layout shrank native entry below its minimum")
			}
			if touch && design.Metrics().ControlHeight < 44 {
				t.Fatal("compact touch target was accepted")
			}
		}
	}
}

func TestTokenBoundsAndPairedContrast(t *testing.T) {
	if _, ok := Color(Scheme(255), SurfacePage); ok {
		t.Fatal("invalid scheme accepted")
	}
	if _, ok := Color(Light, RoleCount); ok {
		t.Fatal("invalid role accepted")
	}
	if _, ok := RoleName(RoleCount); ok {
		t.Fatal("invalid role name accepted")
	}
	names := make(map[string]bool)
	for role := Role(0); role < RoleCount; role++ {
		name, ok := RoleName(role)
		if !ok || names[name] {
			t.Fatalf("role %d has no unique semantic name", role)
		}
		names[name] = true
	}
	for _, scheme := range []Scheme{Light, Dark} {
		for _, pair := range [][2]Role{
			{TextPrimary, SurfacePage}, {TextPrimary, SurfaceRaised},
			{ActionPrimaryText, ActionPrimaryBg}, {ActionPrimaryText, ActionPrimaryHover}, {ActionPrimaryText, ActionPrimaryPressed},
			{ActionDangerText, ActionDangerBg}, {ActionDangerText, ActionDangerHover}, {ActionDangerText, ActionDangerPressed},
			{StatusSuccessText, StatusSuccessBg}, {StatusWarningText, StatusWarningBg}, {StatusDangerText, StatusDangerBg}, {StatusInfoText, StatusInfoBg}, {StatusNeutralText, StatusNeutralBg},
		} {
			foreground, _ := Color(scheme, pair[0])
			background, _ := Color(scheme, pair[1])
			a, b := luminance(foreground), luminance(background)
			if a < b {
				a, b = b, a
			}
			if ratio := (a + .05) / (b + .05); ratio < 4.5 {
				t.Errorf("scheme %v pair %v contrast %.2f < 4.5", scheme, pair, ratio)
			}
		}
	}
}

func luminance(c color.NRGBA) float64 {
	linear := func(channel uint8) float64 {
		x := float64(channel) / 255
		if x <= .04045 {
			return x / 12.92
		}
		return math.Pow((x+.055)/1.055, 2.4)
	}
	return .2126*linear(c.R) + .7152*linear(c.G) + .0722*linear(c.B)
}
