//go:build desktop

// Command showcase is the interactive desktop gallery. Build with -tags desktop.
package main

import (
	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/widget"
	ds "github.com/TeskesLab/DesignSystem/go"
	"github.com/TeskesLab/DesignSystem/go/internal/showcase"
)

func main() {
	a := app.NewWithID("zip.teske.designsystem.showcase")
	window := a.NewWindow("Teske's Lab design system · Fyne")
	scheme := "System"
	density := ds.Comfortable
	touch := false
	var mount *fyne.Container
	apply := func() {
		t := ds.NewTheme(density, touch)
		if scheme != "System" {
			value := ds.Light
			if scheme == "Dark" {
				value = ds.Dark
			}
			t = ds.NewFixedTheme(value, density, touch)
		}
		a.Settings().SetTheme(t)
		gallery := showcase.New(t, window)
		mount.Objects = []fyne.CanvasObject{gallery.Content}
		mount.Refresh()
	}
	mount = container.NewStack()
	schemeSelect := widget.NewSelect([]string{"System", "Light", "Dark"}, func(value string) { scheme = value; apply() })
	densitySelect := widget.NewSelect([]string{"Comfortable", "Compact"}, func(value string) {
		density = ds.Comfortable
		if value == "Compact" {
			density = ds.Compact
		}
		apply()
	})
	touchCheck := widget.NewCheck("Touch targets", func(value bool) { touch = value; apply() })
	schemeSelect.SetSelected("System")
	densitySelect.SetSelected("Comfortable")
	window.SetContent(container.NewBorder(container.NewHBox(widget.NewLabel("Scheme"), schemeSelect, widget.NewLabel("Density"), densitySelect, touchCheck), nil, nil, nil, mount))
	window.Resize(fyne.NewSize(1040, 960))
	window.ShowAndRun()
}
