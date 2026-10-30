#![cfg(feature = "egui")]

use egui::{Event, Key, Modifiers};
use teskeslab_design_system::egui::{self as design, ActionKind, ActionState, Theme};
use teskeslab_design_system::{Density, Scheme};

fn frame(
    ctx: &egui::Context,
    theme: Theme,
    state: ActionState,
    events: Vec<Event>,
    parent_enabled: bool,
) -> design::ActionResponse {
    let mut response = None;
    let _ = ctx.run(
        egui::RawInput {
            screen_rect: Some(egui::Rect::from_min_size(
                egui::Pos2::ZERO,
                egui::vec2(800.0, 600.0),
            )),
            events,
            focused: true,
            ..Default::default()
        },
        |ctx| {
            egui::CentralPanel::default().show(ctx, |ui| {
                ui.add_enabled_ui(parent_enabled, |ui| {
                    let before = ui.visuals().clone();
                    response = Some(design::action(
                        ui,
                        theme,
                        ActionKind::Primary,
                        "Apply changes",
                        state,
                    ));
                    assert_eq!(
                        *ui.visuals(),
                        before,
                        "Action leaked its style into siblings"
                    );
                });
            });
        },
    );
    response.unwrap()
}

fn context(theme: Theme) -> egui::Context {
    let ctx = egui::Context::default();
    design::install_fonts(&ctx);
    theme.apply(&ctx);
    ctx.options_mut(|options| options.max_passes = std::num::NonZeroUsize::new(1).unwrap());
    ctx
}

fn key(key: Key, pressed: bool) -> Event {
    Event::Key {
        key,
        physical_key: None,
        pressed,
        repeat: false,
        modifiers: Modifiers::NONE,
    }
}

#[test]
fn pointer_dispatch_is_gated_by_disabled_busy_and_parent_state() {
    for scheme in [Scheme::Light, Scheme::Dark] {
        for density in [Density::Comfortable, Density::Compact] {
            let theme = Theme {
                scheme,
                density,
                touch: false,
            };
            for (state, parent_enabled, expected) in [
                (ActionState::default(), true, true),
                (
                    ActionState {
                        disabled: true,
                        busy: false,
                    },
                    true,
                    false,
                ),
                (
                    ActionState {
                        disabled: false,
                        busy: true,
                    },
                    true,
                    false,
                ),
                (
                    ActionState {
                        disabled: true,
                        busy: true,
                    },
                    true,
                    false,
                ),
                (ActionState::default(), false, false),
            ] {
                let ctx = context(theme);
                let initial = frame(&ctx, theme, state, vec![], parent_enabled);
                let pos = initial.response.rect.center();
                for pressed in [true, false] {
                    let result = frame(
                        &ctx,
                        theme,
                        state,
                        vec![
                            Event::PointerMoved(pos),
                            Event::PointerButton {
                                pos,
                                button: egui::PointerButton::Primary,
                                pressed,
                                modifiers: Modifiers::NONE,
                            },
                        ],
                        parent_enabled,
                    );
                    assert_eq!(
                        result.activated(),
                        expected && !pressed,
                        "{scheme:?}/{density:?}/{state:?}"
                    );
                }
                assert!(!frame(&ctx, theme, state, vec![], parent_enabled).activated());
            }
        }
    }
}

#[test]
fn keyboard_dispatch_and_busy_focus_survive_state_transition_without_layout_shift() {
    for key_code in [Key::Enter, Key::Space] {
        let theme = Theme::default();
        let ctx = context(theme);
        let ready = ActionState::default();
        let busy = ActionState {
            busy: true,
            disabled: false,
        };
        let initial = frame(&ctx, theme, ready, vec![], true);
        initial.response.request_focus();
        let focused = frame(&ctx, theme, ready, vec![], true);
        assert!(focused.response.has_focus());
        assert!(frame(&ctx, theme, ready, vec![key(key_code, true)], true).activated());
        assert!(!frame(&ctx, theme, ready, vec![key(key_code, false)], true).activated());
        let pending = frame(&ctx, theme, busy, vec![], true);
        assert_eq!(
            pending.response.rect, initial.response.rect,
            "Busy changed action geometry"
        );
        assert!(pending.response.has_focus(), "Busy removed keyboard focus");
        assert!(!frame(&ctx, theme, busy, vec![key(key_code, true)], true).activated());
        assert!(!frame(&ctx, theme, busy, vec![key(key_code, false)], true).activated());
        assert!(frame(&ctx, theme, ready, vec![key(key_code, true)], true).activated());
    }
}

#[test]
fn font_setup_preserves_fallbacks_without_accumulating_duplicate_entries() {
    let mut definitions = egui::FontDefinitions::default();
    let original = definitions.families[&egui::FontFamily::Proportional].clone();
    design::add_fonts(&mut definitions);
    let families = definitions.families.clone();
    design::add_fonts(&mut definitions);
    assert_eq!(definitions.families, families);
    let regular = &definitions.families[&egui::FontFamily::Proportional];
    for fallback in original {
        assert!(regular.contains(&fallback));
    }
}

#[test]
fn theme_application_preserves_custom_layout_and_readable_native_text() {
    for scheme in [Scheme::Light, Scheme::Dark] {
        let theme = Theme {
            scheme,
            density: Density::Compact,
            touch: true,
        };
        let mut style = egui::Style::default();
        style.spacing.slider_width = 317.0;
        theme.map_style(&mut style);
        assert_eq!(style.spacing.slider_width, 317.0);
        assert_eq!(style.spacing.interact_size.y, 44.0);
        for widget in [
            style.visuals.widgets.inactive,
            style.visuals.widgets.hovered,
            style.visuals.widgets.active,
        ] {
            let luminance = |color: egui::Color32| {
                let linear = |value: u8| {
                    let value = f64::from(value) / 255.0;
                    if value <= 0.04045 {
                        value / 12.92
                    } else {
                        ((value + 0.055) / 1.055).powf(2.4)
                    }
                };
                0.2126 * linear(color.r()) + 0.7152 * linear(color.g()) + 0.0722 * linear(color.b())
            };
            let background = luminance(widget.bg_fill);
            let foreground = luminance(widget.fg_stroke.color);
            let contrast =
                (foreground.max(background) + 0.05) / (foreground.min(background) + 0.05);
            assert!(
                contrast >= 4.5,
                "{scheme:?}: native text contrast {contrast}"
            );
        }
    }
}
