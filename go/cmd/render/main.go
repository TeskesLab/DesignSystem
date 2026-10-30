// Command render captures real Fyne software canvases without an OpenGL display.
package main

import (
	"flag"
	"fmt"
	"image/png"
	"os"
	"path/filepath"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/test"
	ds "github.com/TeskesLab/DesignSystem/go"
	"github.com/TeskesLab/DesignSystem/go/internal/showcase"
)

func main() {
	output := flag.String("output", "rendered", "directory for four PNG software-canvas captures")
	flag.Parse()
	if err := render(*output); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func render(output string) error {
	if err := os.MkdirAll(output, 0755); err != nil {
		return err
	}
	a := test.NewApp()
	defer a.Quit()
	for _, scheme := range []struct {
		name  string
		value ds.Scheme
	}{{"light", ds.Light}, {"dark", ds.Dark}} {
		for _, density := range []struct {
			name  string
			value ds.Density
		}{{"comfortable", ds.Comfortable}, {"compact", ds.Compact}} {
			t := ds.NewFixedTheme(scheme.value, density.value, false)
			a.Settings().SetTheme(t)
			window := a.NewWindow("Teske's Lab software showcase")
			gallery := showcase.New(t, window)
			window.SetContent(gallery.Content)
			window.Resize(fyne.NewSize(1040, 900))
			window.Show()
			if err := gallery.Exercise(window); err != nil {
				window.Close()
				return err
			}
			// test.NewApp's windows use the real software painter, not the blank
			// test.NewCanvas() constructor. Capture traverses native renderers.
			image := window.Canvas().Capture()
			path := filepath.Join(output, "fyne-"+scheme.name+"-"+density.name+".png")
			file, err := os.Create(path)
			if err != nil {
				window.Close()
				return err
			}
			err = png.Encode(file, image)
			closeErr := file.Close()
			window.Close()
			if err != nil {
				return err
			}
			if closeErr != nil {
				return closeErr
			}
			fmt.Println(path)
		}
	}
	return nil
}
