#![cfg(feature = "gpui-test-support")]
extern crate gpui_kit as gpui;

use gpui_kit::{
    AppContext, Bounds, Context, Entity, Render, TestAppContext, Window, WindowBounds,
    WindowOptions, component::input::InputState, div, prelude::*, px, size, test::TestWindowExt,
};
use teskeslab_design_system::{
    Density, Scheme,
    gpui::{self as design, ActionKind, ActionState, Theme},
};

struct Form {
    theme: Theme,
    input: Entity<InputState>,
    activations: usize,
}

impl Render for Form {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let theme = self.theme;
        div()
            .size_full()
            .tab_group()
            .flex()
            .flex_col()
            .gap_2()
            .p_4()
            .child(
                design::input(theme, &self.input)
                    .id("name")
                    .aria_label("Name"),
            )
            .child(design::action(
                "ready",
                theme,
                ActionKind::Primary,
                "Save",
                ActionState::default(),
                cx.listener(|this, _, _, cx| {
                    this.activations += 1;
                    cx.notify();
                }),
            ))
            .child(design::action(
                "disabled",
                theme,
                ActionKind::Danger,
                "Disabled",
                ActionState {
                    disabled: true,
                    busy: false,
                },
                cx.listener(|this, _, _, cx| {
                    this.activations += 100;
                    cx.notify();
                }),
            ))
            .child(design::action(
                "busy",
                theme,
                ActionKind::Secondary,
                "Busy",
                ActionState {
                    disabled: false,
                    busy: true,
                },
                cx.listener(|this, _, _, cx| {
                    this.activations += 100;
                    cx.notify();
                }),
            ))
            .child(design::action(
                "last",
                theme,
                ActionKind::Quiet,
                "Last",
                ActionState::default(),
                cx.listener(|this, _, _, cx| {
                    this.activations += 1;
                    cx.notify();
                }),
            ))
    }
}

fn open(cx: &mut TestAppContext) -> (gpui_kit::AnyWindowHandle, Entity<Form>) {
    cx.update(|cx| {
        design::init(cx, Theme::default()).expect("bundled fonts");
        gpui_kit::open_window(
            WindowOptions {
                window_bounds: Some(WindowBounds::Windowed(Bounds {
                    origin: Default::default(),
                    size: size(px(640.), px(480.)),
                })),
                ..Default::default()
            },
            cx,
            |window, cx| {
                cx.new(|cx| Form {
                    theme: Theme::default(),
                    input: cx.new(|cx| InputState::new(window, cx)),
                    activations: 0,
                })
            },
        )
        .expect("native test window")
    })
}

#[gpui_kit::test]
fn native_input_action_guards_and_tab_order(cx: &mut TestAppContext) {
    let (handle, view) = open(cx);
    cx.update_window(handle, |_, window, cx| {
        window.render_frame(cx);
        window.click("name", cx);
        window.input("Plex café", cx);
        assert_eq!(window.find("name").value(), Some("Plex café"));
        assert_eq!(window.find("name").focused(), Some(true));
        window.press("tab", cx);
        assert_eq!(window.find("ready").focused(), Some(true));
        window.press("enter", cx);
        assert_eq!(view.read(cx).activations, 1);
        window.press("tab", cx);
        assert_eq!(window.find("busy").focused(), Some(true));
        assert_ne!(window.find("disabled").focused(), Some(true));
        window.press("enter", cx);
        window.press("space", cx);
        assert_eq!(view.read(cx).activations, 1);
        window.press("tab", cx);
        assert_eq!(window.find("last").focused(), Some(true));
        window.press("space", cx);
        assert_eq!(view.read(cx).activations, 2);
        window.click("disabled", cx);
        window.click("busy", cx);
        assert_eq!(view.read(cx).activations, 2);
        window.click("ready", cx);
        assert_eq!(view.read(cx).activations, 3);
        assert_eq!(view.read(cx).input.read(cx).value().as_ref(), "Plex café");
    })
    .unwrap();
}

#[gpui_kit::test]
fn density_changes_real_bounds_without_recreating_input_or_losing_focus(cx: &mut TestAppContext) {
    let (handle, view) = open(cx);
    cx.update_window(handle, |_, window, cx| {
        window.render_frame(cx);
        window.click("name", cx);
        window.input("Persistent selection and state", cx);
        let input_id = view.read(cx).input.entity_id();
        let mut heights = Vec::new();
        for (density, touch) in [
            (Density::Compact, false),
            (Density::Comfortable, false),
            (Density::Compact, true),
        ] {
            let theme = Theme {
                scheme: Scheme::Dark,
                density,
                touch,
            };
            theme.apply(cx);
            view.update(cx, |view, cx| {
                view.theme = theme;
                cx.notify();
            });
            window.render_frame(cx);
            let bounds = window.find("ready").bounds();
            assert!(bounds.size.height >= px(theme.metrics().control_height));
            assert!(window.find("name").bounds().size.height >= px(theme.metrics().control_height));
            assert_eq!(window.find("name").focused(), Some(true));
            assert_eq!(
                window.find("name").value(),
                Some("Persistent selection and state")
            );
            assert_eq!(view.read(cx).input.entity_id(), input_id);
            heights.push(bounds.size.height);
        }
        assert!(
            heights[1] > heights[0],
            "comfortable must change native geometry"
        );
        assert_eq!(heights[2], heights[1], "touch overrides compact density");
        window.press("backspace", cx);
        assert_eq!(
            window.find("name").value(),
            Some("Persistent selection and stat")
        );
    })
    .unwrap();
}
