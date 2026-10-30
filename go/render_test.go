package designsystem

import (
	"image"
	"image/color"
	"math"
	"testing"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/container"
)

func countColor(image image.Image, expected color.Color) int {
	r, g, b, a := expected.RGBA()
	count := 0
	bounds := image.Bounds()
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			pr, pg, pb, pa := image.At(x, y).RGBA()
			if pr == r && pg == g && pb == b && pa == a {
				count++
			}
		}
	}
	return count
}

// Text ink is antialiased: verify the foreground/background blend rather than
// requiring small regular glyphs to contain fully opaque interior pixels.
func countBlendedInk(image image.Image, foreground, background color.NRGBA) int {
	fg := [3]float64{float64(foreground.R), float64(foreground.G), float64(foreground.B)}
	bg := [3]float64{float64(background.R), float64(background.G), float64(background.B)}
	channel := 0
	for i := 1; i < 3; i++ {
		if math.Abs(fg[i]-bg[i]) > math.Abs(fg[channel]-bg[channel]) {
			channel = i
		}
	}
	if fg[channel] == bg[channel] {
		return 0
	}
	count := 0
	for y := image.Bounds().Min.Y; y < image.Bounds().Max.Y; y++ {
		for x := image.Bounds().Min.X; x < image.Bounds().Max.X; x++ {
			r, g, b, _ := image.At(x, y).RGBA()
			pixel := [3]float64{float64(r) / 257, float64(g) / 257, float64(b) / 257}
			coverage := (pixel[channel] - bg[channel]) / (fg[channel] - bg[channel])
			if coverage < 0.5 || coverage > 1 {
				continue
			}
			matches := true
			for i := range fg {
				if math.Abs(pixel[i]-(bg[i]+coverage*(fg[i]-bg[i]))) > 2 {
					matches = false
				}
			}
			if matches {
				count++
			}
		}
	}
	return count
}

func TestNativeSoftwareRenderingUsesSemanticPairs(t *testing.T) {
	for _, scheme := range []Scheme{Light, Dark} {
		for _, density := range []Density{Comfortable, Compact} {
			design := NewFixedTheme(scheme, density, false)
			window := testWindow(t, design)
			primary := design.NewAction("Copy artifact", PrimaryAction, func() {})
			danger := design.NewAction("Remove local value", DangerAction, func() {})
			status := design.NewStatus("Verified", SuccessStatus)
			window.SetContent(container.NewVBox(primary.Object(), danger.Object(), status))
			window.Resize(fyne.NewSize(420, 240))
			window.Show()
			capture := window.Canvas().Capture()
			for _, pair := range [][2]Role{
				{ActionPrimaryBg, ActionPrimaryText},
				{ActionDangerBg, ActionDangerText},
				{StatusSuccessBg, StatusSuccessText},
			} {
				background, _ := Color(scheme, pair[0])
				foreground, _ := Color(scheme, pair[1])
				if countColor(capture, background) < 100 || countBlendedInk(capture, foreground, background) < 10 {
					t.Errorf("scheme %d density %d: native raster omitted semantic pair %v", scheme, density, pair)
				}
			}
			status.Set("Needs investigation", DangerStatus)
			if status.AccessibilityLabel() != "Needs investigation" || status.AccessibilityRole() != fyne.AccessibleRoleText {
				t.Fatal("updated status lost accessible text semantics")
			}
			capture = window.Canvas().Capture()
			want, _ := Color(scheme, StatusDangerBg)
			if countColor(capture, want) < 100 {
				t.Fatal("status renderer retained stale background after state change")
			}
		}
	}
}

func TestStatusThemeSwitchRefreshesBothColors(t *testing.T) {
	design := NewFixedTheme(Light, Comfortable, false)
	window := testWindow(t, design)
	status := design.NewStatus("Not evaluated", StatusKind(255))
	window.SetContent(status)
	window.Resize(fyne.NewSize(300, 70))
	window.Show()
	status.SetTheme(NewFixedTheme(Dark, Comfortable, false))
	capture := window.Canvas().Capture()
	background, _ := Color(Dark, StatusNeutralBg)
	foreground, _ := Color(Dark, StatusNeutralText)
	if countColor(capture, background) < 100 || countBlendedInk(capture, foreground, background) < 10 {
		t.Fatal("status failed neutral fallback or theme refresh")
	}
}

func TestActionKeyboardFocusHasSeparatedVisibleRing(t *testing.T) {
	for _, scheme := range []Scheme{Light, Dark} {
		design := NewFixedTheme(scheme, Comfortable, false)
		window := testWindow(t, design)
		action := design.NewAction("Apply changes", PrimaryAction, func() {})
		window.SetContent(container.NewPadded(action.Object()))
		window.Resize(fyne.NewSize(320, 100))
		window.Show()
		position := fyne.CurrentApp().Driver().AbsolutePositionForObject(action.button)
		ring, _ := Color(scheme, FocusRing)
		ringPixels := func() int {
			capture := window.Canvas().Capture()
			count := 0
			for y := int(position.Y) - FocusOffset - FocusWidth - 1; y < int(position.Y); y++ {
				for x := int(position.X) + 20; x < int(position.X+action.button.Size().Width)-20; x++ {
					if sameColor(capture.At(x, y), ring) {
						count++
					}
				}
			}
			return count
		}
		if ringPixels() != 0 {
			t.Fatal("unfocused action shows a focus ring")
		}
		window.Canvas().Focus(action.FocusTarget())
		if ringPixels() < 100 {
			t.Fatal("keyboard focus has no separated, high-contrast ring")
		}
		action.SetBusy(true)
		if ringPixels() < 100 {
			t.Fatal("busy state removed the retained focus indicator")
		}
		window.Canvas().Unfocus()
		if ringPixels() != 0 {
			t.Fatal("focus ring remained after keyboard focus moved away")
		}
	}
}
