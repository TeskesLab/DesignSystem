//! Run interactively, or use `--smoke [OUTPUT_DIRECTORY]` for eight bounded
//! real offscreen renders, native input checks and PNG evidence. Smoke requires
//! Linux Vulkan/WGPU or macOS Metal; it fails rather than substituting a renderer.
extern crate gpui_kit as gpui;

use gpui_kit::{
    App, AppContext, Bounds, Context, Entity, Render, SharedString, Window, WindowBounds,
    WindowOptions,
    component::{checkbox::Checkbox, input::InputState},
    div,
    prelude::*,
    px, size,
};
use teskeslab_design_system::{
    Density, Role, Scheme,
    gpui::{self as design, ActionKind, ActionState, Status, Theme},
};

struct Showcase {
    theme: Theme,
    name: Entity<InputState>,
    saved: Option<SharedString>,
    saves: usize,
}

impl Showcase {
    fn new(theme: Theme, window: &mut Window, cx: &mut Context<Self>) -> Self {
        Self {
            theme,
            name: cx.new(|cx| InputState::new(window, cx).placeholder("Name this local profile")),
            saved: None,
            saves: 0,
        }
    }
}

impl Render for Showcase {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let theme = self.theme;
        let saved = self.saved.as_ref().map_or_else(
            || SharedString::from("No local profile saved. Nothing is sent over the network."),
            |name| SharedString::from(format!("Saved locally in this window: {name}")),
        );
        div().size_full().tab_group().flex().flex_col().gap_4().p_6()
            .bg(theme.color(Role::SurfacePage)).text_color(theme.color(Role::TextPrimary))
            .font_family("IBM Plex Sans")
            .child(div().text_size(px(26.)).font_weight(gpui_kit::FontWeight::SEMIBOLD)
                .child("Teske's Lab / GPUI Kit"))
            .child("Native controls, canonical paired tokens and bundled IBM Plex. Tab to navigate; Enter or Space activates buttons.")
            .child(div().flex().gap_4()
                .child(theme.control(Checkbox::new("dark").label("Dark scheme")
                    .checked(theme.scheme == Scheme::Dark)
                    .on_change(cx.listener(|this, checked, _, cx| {
                        this.theme.scheme = if *checked { Scheme::Dark } else { Scheme::Light };
                        this.theme.apply(cx);
                        cx.notify();
                    }))))
                .child(theme.control(Checkbox::new("compact").label("Compact density")
                    .checked(theme.density == Density::Compact)
                    .on_change(cx.listener(|this, checked, _, cx| {
                        this.theme.density = if *checked { Density::Compact } else { Density::Comfortable };
                        cx.notify();
                    }))))
                .child(theme.control(Checkbox::new("touch").label("Touch targets")
                    .checked(theme.touch)
                    .on_change(cx.listener(|this, checked, _, cx| {
                        this.theme.touch = *checked;
                        cx.notify();
                    })))))
            .child(div().text_color(theme.color(Role::TextSecondary)).child(format!(
                "Minimum control: {} px; row: {} px. Touch overrides compact density.",
                theme.metrics().control_height, theme.metrics().row_height)))
            .child(div().flex().flex_col().gap_2().child("Profile name")
                .child(design::input(theme, &self.name).id("profile-name")
                    .aria_label("Profile name").w(px(420.))))
            .child(div().flex().gap_2()
                .child(design::action("save", theme, ActionKind::Primary, "Save locally", ActionState::default(), cx.listener(|this, _, _, cx| {
                    this.saved = Some(this.name.read(cx).value());
                    this.saves += 1;
                    cx.notify();
                })))
                .child(design::action("clear", theme, ActionKind::Secondary, "Clear saved profile", ActionState::default(), cx.listener(|this, _, _, cx| {
                    this.saved = None;
                    cx.notify();
                })))
                .child(design::action("disabled", theme, ActionKind::Danger, "Unavailable action", ActionState { disabled: true, busy: false }, cx.listener(|this, _, _, cx| { this.saves += 100; cx.notify(); })))
                .child(design::action("busy", theme, ActionKind::Quiet, "Busy appearance", ActionState { disabled: false, busy: true }, cx.listener(|this, _, _, cx| { this.saves += 100; cx.notify(); }))))
            .child(div().text_color(theme.color(Role::TextSecondary))
                .child("Busy appearance is an inert state specimen, not a background job. Its tab stop remains available."))
            .child(design::status("save-status", theme,
                if self.saved.is_some() { Status::Success } else { Status::Neutral }, saved))
            .child(div().flex().gap_2()
                .child(design::status("warning", theme, Status::Warning, "Window-local data is lost when this window closes."))
                .child(design::status("error", theme, Status::Danger, "Error palette specimen: no operation has failed.")))
            .child(theme.row(div()).flex().items_center().p_2()
                .bg(theme.color(Role::CodeBg)).text_color(theme.color(Role::CodeText))
                .font_family("IBM Plex Mono").child("features = [\"gpui-kit\"]  // egui may also be enabled"))
    }
}

fn options(show: bool) -> WindowOptions {
    WindowOptions {
        window_bounds: Some(WindowBounds::Windowed(Bounds {
            origin: Default::default(),
            size: size(px(1120.), px(820.)),
        })),
        titlebar: Some(gpui_kit::TitlebarOptions {
            title: Some("Teske's Lab — GPUI Kit".into()),
            ..Default::default()
        }),
        show,
        focus: show,
        ..Default::default()
    }
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn smoke(directory: &std::path::Path) -> gpui_kit::Result<()> {
    use gpui_kit::{HeadlessAppContext, assets::Assets, test::TestWindowExt};
    use std::sync::Arc;

    std::fs::create_dir_all(directory)?;
    let mut cx = HeadlessAppContext::with_platform(
        gpui_kit::platform::current_platform(true).text_system(),
        Arc::new(Assets),
        gpui_kit::platform::current_headless_renderer,
    );
    cx.update(|cx| design::init(cx, Theme::default()))?;
    let (handle, view) = cx.update(|cx| {
        gpui_kit::open_window(options(false), cx, |window, cx| {
            cx.new(|cx| Showcase::new(Theme::default(), window, cx))
        })
    })?;

    // Exercise actual input and application state, not direct callback invocation.
    cx.update_window(handle, |_, window, cx| {
        window.render_frame(cx);
        window.click("profile-name", cx);
        window.input("Plex native profile", cx);
        assert_eq!(
            window.find("profile-name").value(),
            Some("Plex native profile")
        );
        window.click("save", cx);
        assert_eq!(view.read(cx).saves, 1);
        assert_eq!(view.read(cx).saved.as_deref(), Some("Plex native profile"));
        window.click("disabled", cx);
        window.click("busy", cx);
        assert_eq!(view.read(cx).saves, 1);
        // Pointer activation need not claim keyboard focus. Start traversal from
        // the native input owner, then activate the button through its key binding.
        window.click("profile-name", cx);
        window.press("tab", cx);
        assert_eq!(window.find("save").focused(), Some(true));
        window.press("enter", cx);
        assert_eq!(view.read(cx).saves, 2);
        window.press("tab", cx);
        assert_eq!(window.find("clear").focused(), Some(true));
        window.press("tab", cx);
        assert_eq!(window.find("busy").focused(), Some(true));
        window.press("enter", cx);
        window.press("space", cx);
        assert_eq!(view.read(cx).saves, 2);
    })?;

    for scheme in [Scheme::Light, Scheme::Dark] {
        for density in [Density::Comfortable, Density::Compact] {
            for touch in [false, true] {
                let theme = Theme {
                    scheme,
                    density,
                    touch,
                };
                cx.update_window(handle, |_, window, cx| {
                    // Toggle actual native controls, retaining all application state.
                    if view.read(cx).theme.scheme != scheme {
                        window.click("dark", cx);
                    }
                    if view.read(cx).theme.density != density {
                        window.click("compact", cx);
                    }
                    if view.read(cx).theme.touch != touch {
                        window.click("touch", cx);
                    }
                    window.render_frame(cx);
                    assert_eq!(view.read(cx).theme, theme);
                    for id in [
                        "save",
                        "clear",
                        "disabled",
                        "busy",
                        "profile-name",
                        "dark",
                        "compact",
                        "touch",
                    ] {
                        assert!(
                            window.find(id).bounds().size.height
                                >= px(theme.metrics().control_height),
                            "{id}: minimum target"
                        );
                    }
                    assert_eq!(view.read(cx).saved.as_deref(), Some("Plex native profile"));
                })?;
                // Headless time is explicit: settle native checkmark springs
                // before capturing, rather than recording their first frame.
                cx.advance_clock(std::time::Duration::from_secs(1));
                cx.update_window(handle, |_, window, cx| window.render_frame(cx))?;
                let path = directory.join(format!("gpui-{scheme:?}-{density:?}-touch-{touch}.png"));
                cx.capture_screenshot(handle)?.save(&path)?;
                println!("{}", path.display());
            }
        }
    }
    println!("GPUI smoke: native text, actions, focus, state and eight rendered PNGs completed.");
    Ok(())
}

#[cfg(not(any(target_os = "linux", target_os = "macos")))]
fn smoke(_: &std::path::Path) -> gpui_kit::Result<()> {
    Err(std::io::Error::new(
        std::io::ErrorKind::Unsupported,
        "GPUI Kit 0.8.1 offscreen screenshots require Linux WGPU or macOS Metal",
    )
    .into())
}

fn main() -> gpui_kit::Result<()> {
    let mut args = std::env::args_os().skip(1);
    if let Some(arg) = args.next() {
        if arg != "--smoke" {
            return Err(std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                "usage: gpui_showcase [--smoke [OUTPUT_DIRECTORY]]",
            )
            .into());
        }
        let directory = args
            .next()
            .map(std::path::PathBuf::from)
            .unwrap_or_else(|| std::path::PathBuf::from("target/gpui-smoke"));
        if args.next().is_some() {
            return Err(std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                "unexpected extra argument",
            )
            .into());
        }
        return smoke(&directory);
    }
    gpui_kit::application()
        .with_assets(gpui_kit::assets::Assets)
        .run(|cx: &mut App| {
            design::init(cx, Theme::default()).expect("register bundled Plex fonts");
            gpui_kit::open_window(options(true), cx, |window, cx| {
                cx.new(|cx| Showcase::new(Theme::default(), window, cx))
            })
            .expect("open GPUI showcase window");
            cx.on_window_closed(|cx, _window_id| {
                if cx.windows().is_empty() {
                    cx.quit();
                }
            })
            .detach();
            cx.activate(true);
        });
    Ok(())
}
