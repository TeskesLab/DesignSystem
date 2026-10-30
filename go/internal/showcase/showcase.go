// Package showcase contains the same native widgets for desktop and software rendering.
package showcase

import (
	"fmt"
	"net/url"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/widget"
	ds "github.com/TeskesLab/DesignSystem/go"
)

// Gallery exposes the real copy action so the renderer can exercise dispatch.
type Gallery struct {
	Content fyne.CanvasObject
	Copy    *ds.Action
	Value   *widget.Entry
	Result  *ds.Status
}

func New(t *ds.Theme, window fyne.Window) *Gallery {
	g := &Gallery{}
	g.Value = widget.NewEntry()
	g.Value.SetText("device://lab/usb-analyzer-01")
	g.Result = t.NewStatus("Ready to copy", ds.NeutralStatus)
	g.Copy = t.NewAction("Copy value", ds.PrimaryAction, func() {
		fyne.CurrentApp().Clipboard().SetContent(g.Value.Text)
		g.Result.Set("Copied value", ds.SuccessStatus)
	})
	clear := t.NewAction("Clear value", ds.DangerAction, func() {
		g.Value.SetText("")
		g.Result.Set("Value cleared locally", ds.NeutralStatus)
	})
	restore := t.NewAction("Restore example", ds.SecondaryAction, func() {
		g.Value.SetText("device://lab/usb-analyzer-01")
		g.Result.Set("Example restored", ds.InfoStatus)
	})
	busy := t.NewAction("Busy specimen", ds.SecondaryAction, nil)
	busy.SetBusy(true)
	disabled := t.NewAction("Disabled specimen", ds.SecondaryAction, nil)
	disabled.SetEnabled(false)
	quiet := t.NewAction("Focus value", ds.QuietAction, func() { window.Canvas().Focus(g.Value) })

	name := widget.NewEntry()
	name.SetText("USB analyzer — bench A")
	selectMode := widget.NewSelect([]string{"Observe only", "Capture packets", "Review capture"}, nil)
	selectMode.SetSelected("Observe only")
	check := widget.NewCheck("Retain local capture metadata", nil)
	check.SetChecked(true)
	form := widget.NewForm(
		widget.NewFormItem("Device label", t.Control(name)),
		widget.NewFormItem("Mode", t.Control(selectMode)),
		widget.NewFormItem("Technical value", t.Control(g.Value)),
	)
	link, _ := url.Parse("https://fyne.io")
	note := widget.NewLabel("Native Entry, Select, Check, Table and Hyperlink retain Fyne behavior. Busy and disabled specimens do not run jobs.")
	note.Wrapping = fyne.TextWrapWord
	header := container.NewVBox(
		widget.NewLabelWithStyle("Teske's Lab · Fyne", fyne.TextAlignLeading, fyne.TextStyle{Bold: true}),
		note,
		form,
		t.Control(check),
		container.NewGridWithColumns(3, g.Copy.Object(), restore.Object(), quiet.Object()),
		container.NewGridWithColumns(3, clear.Object(), disabled.Object(), busy.Object()),
		container.NewHBox(g.Result, widget.NewHyperlink("Fyne toolkit documentation", link)),
		widget.NewSeparator(),
		container.NewGridWithColumns(5,
			t.NewStatus("Verified", ds.SuccessStatus),
			t.NewStatus("Needs review", ds.WarningStatus),
			t.NewStatus("Failed", ds.DangerStatus),
			t.NewStatus("Information", ds.InfoStatus),
			t.NewStatus("Not evaluated", ds.NeutralStatus)),
		widget.NewLabelWithStyle("Data-backed native table", fyne.TextAlignLeading, fyne.TextStyle{Bold: true}),
	)
	rows := [][3]string{
		{"Artifact", "Verification", "Bytes"},
		{"capture-01.pcapng", "Verified", "18432"},
		{"firmware.bin", "Not evaluated", "262144"},
		{"device-log.txt", "Needs review", "4096"},
	}
	table := widget.NewTable(
		func() (int, int) { return len(rows), 3 },
		func() fyne.CanvasObject { return widget.NewLabel("Template") },
		func(id widget.TableCellID, object fyne.CanvasObject) {
			object.(*widget.Label).SetText(rows[id.Row][id.Col])
		},
	)
	table.SetColumnWidth(0, 300)
	table.SetColumnWidth(1, 220)
	table.SetColumnWidth(2, 140)
	code := widget.NewLabelWithStyle("Plex Mono 400 · 00 01 7f 80 ff · no synthesized mono bold", fyne.TextAlignLeading, fyne.TextStyle{Monospace: true})
	g.Content = container.NewBorder(header, code, nil, nil, table)
	return g
}

// Exercise dispatches the real clipboard callback, then confirms the same action
// cannot dispatch from shortcuts while disabled or busy. No business work is faked.
func (g *Gallery) Exercise(window fyne.Window) error {
	clipboard := fyne.CurrentApp().Clipboard()
	clipboard.SetContent("before")
	g.Copy.SetEnabled(false)
	if g.Copy.Activate() || clipboard.Content() != "before" {
		return fmt.Errorf("disabled copy action dispatched")
	}
	g.Copy.SetBusy(true)
	g.Copy.SetEnabled(true)
	if g.Copy.Activate() || clipboard.Content() != "before" {
		return fmt.Errorf("busy copy action dispatched")
	}
	g.Copy.SetBusy(false)
	window.Canvas().Focus(g.Copy.FocusTarget())
	g.Copy.FocusTarget().TypedKey(&fyne.KeyEvent{Name: fyne.KeyReturn})
	if clipboard.Content() != g.Value.Text {
		return fmt.Errorf("keyboard copy did not update native clipboard")
	}
	return nil
}
