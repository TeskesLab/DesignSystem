package designsystem

import (
	"testing"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/test"
)

func TestActionGuardsEveryDispatchPath(t *testing.T) {
	design := NewFixedTheme(Light, Comfortable, false)
	window := testWindow(t, design)
	calls := 0
	action := design.NewAction("Copy technical value", PrimaryAction, func() { calls++ })
	window.SetContent(action.Object())
	window.Show()
	for _, key := range []fyne.KeyName{fyne.KeySpace, fyne.KeyReturn, fyne.KeyEnter} {
		action.FocusTarget().TypedKey(&fyne.KeyEvent{Name: key})
	}
	test.Tap(action.button)
	if calls != 4 {
		t.Fatalf("native keyboard/pointer dispatch count = %d, want 4", calls)
	}

	blocked := func() {
		t.Helper()
		before := calls
		if action.Activate() {
			t.Fatal("direct dispatch bypassed guard")
		}
		action.button.OnTapped()
		test.Tap(action.button)
		for _, key := range []fyne.KeyName{fyne.KeySpace, fyne.KeyReturn, fyne.KeyEnter} {
			action.FocusTarget().TypedKey(&fyne.KeyEvent{Name: key})
		}
		if calls != before {
			t.Fatal("native or callback dispatch bypassed guard")
		}
	}
	action.SetEnabled(false)
	blocked()
	action.SetBusy(true)
	action.SetEnabled(true)
	blocked()
	action.SetEnabled(false)
	action.SetBusy(false)
	blocked()
	action.SetEnabled(true)
	if !action.Activate() || calls != 5 {
		t.Fatal("action did not recover after busy/disabled transitions")
	}
}

func TestBusyPreservesIdentityLabelGeometryAndFocus(t *testing.T) {
	design := NewTheme(Comfortable, false)
	window := testWindow(t, design)
	action := design.NewAction("Inspect selected device", SecondaryAction, func() {})
	window.SetContent(action.Object())
	window.Show()
	window.Canvas().Focus(action.FocusTarget())
	before := action.Object().MinSize()
	focus := action.FocusTarget()
	label := action.button.AccessibilityLabel()
	action.SetBusy(true)
	if action.Object().MinSize() != before || action.button.AccessibilityLabel() != label || action.FocusTarget() != focus {
		t.Fatal("busy moved geometry or changed control identity/name")
	}
	if window.Canvas().Focused() != focus {
		t.Fatal("busy moved existing keyboard focus")
	}
	action.SetTheme(NewFixedTheme(Dark, Compact, false))
	if action.FocusTarget() != focus {
		t.Fatal("theme switch replaced focus target")
	}
	action.SetBusy(false)
	if action.button.Disabled() {
		t.Fatal("clearing busy did not restore native enabled state")
	}
}

func TestActionReentrancyAndPanicRecovery(t *testing.T) {
	design := NewTheme(Comfortable, false)
	testWindow(t, design)
	var action *Action
	calls := 0
	action = design.NewAction("Reentrant callback", PrimaryAction, func() {
		calls++
		if action.Activate() {
			t.Fatal("reentrant callback dispatched")
		}
		if calls == 1 {
			panic("application failure")
		}
	})
	func() {
		defer func() {
			if recover() == nil {
				t.Error("application panic was swallowed")
			}
		}()
		action.Activate()
	}()
	if !action.Activate() || calls != 2 {
		t.Fatal("panic left action guard locked")
	}
	if design.NewAction("No callback", SecondaryAction, nil).Activate() {
		t.Fatal("nil callback reported dispatch")
	}
}

func TestKeyboardActivationPreservesOrTransfersFocus(t *testing.T) {
	for _, key := range []fyne.KeyName{fyne.KeySpace, fyne.KeyReturn, fyne.KeyEnter} {
		for _, transfer := range []bool{false, true} {
			design := NewTheme(Comfortable, false)
			window := testWindow(t, design)
			next := design.NewAction("Next action", SecondaryAction, func() {})
			var action *Action
			action = design.NewAction("Apply changes", PrimaryAction, func() {
				if transfer {
					window.Canvas().Focus(next.FocusTarget())
				} else {
					action.SetBusy(true)
				}
			})
			window.SetContent(container.NewVBox(action.Object(), next.Object()))
			window.Show()
			window.Canvas().Focus(action.FocusTarget())
			action.FocusTarget().TypedKey(&fyne.KeyEvent{Name: key})
			want := action.FocusTarget()
			if transfer {
				want = next.FocusTarget()
			}
			if window.Canvas().Focused() != want {
				t.Fatalf("%s activation lost focus or overrode the callback's focus choice", key)
			}
		}
	}
}
