//! GPUI Kit 0.8 styling over the generated tokens and bundled Plex fonts.
//!
//! Call [`init`] once before opening windows. Theme changes do not reload fonts.
//! Kit owns input, focus, accessibility and rendering; applications own state and
//! jobs. Density is explicit on controls: use [`Theme::control`], [`Theme::row`],
//! [`action`] and [`input`] rather than changing window scale or font size.
use std::borrow::Cow;

use gpui_kit::component::{
    Disableable, Theme as KitTheme, ThemeColor, ThemeMode,
    alert::Alert,
    button::{Button, ButtonVariants},
    input::{Input, InputState},
};
use gpui_kit::{App, ClickEvent, ElementId, Entity, Hsla, SharedString, Styled, Window, px};

use crate::{Density, Metrics, Role, Scheme, color, dimensions, fonts, tokens::*};

/// Register all bundled faces, retaining the platform's glyph fallback system.
/// Call once during startup, before constructing text-measuring controls.
pub fn install_fonts(cx: &mut App) -> gpui_kit::Result<()> {
    cx.text_system().add_fonts(vec![
        Cow::Borrowed(fonts::SANS_REGULAR),
        Cow::Borrowed(fonts::SANS_SEMIBOLD),
        Cow::Borrowed(fonts::MONO_REGULAR),
    ])
}

/// Initialize Kit's base/component layers, register Plex, then apply the theme.
/// Use this instead of separately calling `gpui_kit::init`.
pub fn init(cx: &mut App, theme: Theme) -> gpui_kit::Result<()> {
    gpui_kit::init(cx);
    install_fonts(cx)?;
    theme.apply(cx);
    Ok(())
}

pub fn hsla(scheme: Scheme, role: Role) -> Hsla {
    let c = color(scheme, role);
    gpui_kit::rgba(u32::from_be_bytes([c.r, c.g, c.b, c.a])).into()
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct Theme {
    pub scheme: Scheme,
    pub density: Density,
    /// Touch enforces comfortable targets even when density is compact.
    pub touch: bool,
}

impl Default for Theme {
    fn default() -> Self {
        Self {
            scheme: Scheme::Light,
            density: Density::Comfortable,
            touch: false,
        }
    }
}

impl Theme {
    pub const fn metrics(self) -> Metrics {
        dimensions(self.density, self.touch)
    }

    pub fn color(self, role: Role) -> Hsla {
        hsla(self.scheme, role)
    }

    /// Map paired colors, including distinct action and status palettes.
    /// Unrelated toolkit-specific colors retain the selected Kit scheme defaults.
    pub fn map_colors(self, colors: &mut ThemeColor) {
        let c = |role| self.color(role);
        colors.background = c(Role::SurfacePage);
        colors.foreground = c(Role::TextPrimary);
        colors.accordion = c(Role::SurfaceRaised);
        colors.accent = c(Role::SurfaceHover);
        colors.accent_foreground = c(Role::TextPrimary);
        colors.border = c(Role::BorderSubtle);
        colors.input = c(Role::ControlBorder);
        colors.ring = c(Role::FocusRing);
        colors.caret = c(Role::TextPrimary);
        colors.selection = c(Role::SurfaceSelected);
        colors.muted = c(Role::DisabledBg);
        colors.muted_foreground = c(Role::TextDisabled);
        colors.popover = c(Role::SurfaceRaised);
        colors.popover_foreground = c(Role::TextPrimary);
        colors.group_box = c(Role::SurfaceRaised);
        colors.group_box_foreground = c(Role::TextPrimary);
        colors.description_list_label = c(Role::SurfaceSunken);
        colors.description_list_label_foreground = c(Role::TextSecondary);
        colors.link = c(Role::TextLink);
        colors.link_hover = c(Role::TextLink);
        colors.link_active = c(Role::TextLink);
        colors.primary = c(Role::ActionPrimaryBg);
        colors.primary_hover = c(Role::ActionPrimaryHover);
        colors.primary_active = c(Role::ActionPrimaryPressed);
        colors.primary_foreground = c(Role::ActionPrimaryText);
        colors.button_primary = colors.primary;
        colors.button_primary_hover = colors.primary_hover;
        colors.button_primary_active = colors.primary_active;
        colors.button_primary_foreground = colors.primary_foreground;
        colors.button = c(Role::SurfaceRaised);
        colors.button_hover = c(Role::SurfaceHover);
        colors.button_active = c(Role::SurfaceSelected);
        colors.button_foreground = c(Role::TextPrimary);
        colors.secondary = colors.button;
        colors.secondary_hover = colors.button_hover;
        colors.secondary_active = colors.button_active;
        colors.secondary_foreground = colors.button_foreground;
        colors.button_secondary = colors.secondary;
        colors.button_secondary_hover = colors.secondary_hover;
        colors.button_secondary_active = colors.secondary_active;
        colors.button_secondary_foreground = colors.secondary_foreground;
        // Base projects `danger` into destructive actions. Status helpers set
        // their distinct paired status fill/text explicitly on native Alerts.
        colors.danger = c(Role::ActionDangerBg);
        colors.danger_hover = c(Role::ActionDangerHover);
        colors.danger_active = c(Role::ActionDangerPressed);
        colors.danger_foreground = c(Role::ActionDangerText);
        colors.button_danger = c(Role::ActionDangerBg);
        colors.button_danger_hover = c(Role::ActionDangerHover);
        colors.button_danger_active = c(Role::ActionDangerPressed);
        colors.button_danger_foreground = c(Role::ActionDangerText);
        colors.success = c(Role::StatusSuccessBg);
        colors.success_foreground = c(Role::StatusSuccessText);
        colors.info = c(Role::StatusInfoBg);
        colors.info_hover = colors.info;
        colors.info_active = colors.info;
        colors.info_foreground = c(Role::StatusInfoText);
        colors.warning = c(Role::StatusWarningBg);
        colors.warning_foreground = c(Role::StatusWarningText);
        colors.button_info = colors.info;
        colors.button_info_hover = colors.info;
        colors.button_info_active = colors.info;
        colors.button_info_foreground = colors.info_foreground;
        colors.button_success = colors.success;
        colors.button_success_hover = colors.success;
        colors.button_success_active = colors.success;
        colors.button_success_foreground = colors.success_foreground;
        colors.button_warning = colors.warning;
        colors.button_warning_hover = colors.warning;
        colors.button_warning_active = colors.warning;
        colors.button_warning_foreground = colors.warning_foreground;
        colors.list = c(Role::SurfaceRaised);
        colors.list_head = c(Role::SurfaceSunken);
        colors.list_even = c(Role::SurfaceSunken);
        colors.list_hover = c(Role::SurfaceHover);
        colors.list_active = c(Role::SurfaceSelected);
        colors.list_active_border = c(Role::FocusRing);
        colors.sidebar = c(Role::NavBg);
        colors.sidebar_foreground = c(Role::NavText);
        colors.sidebar_accent = c(Role::NavSelectedBg);
        colors.sidebar_accent_foreground = c(Role::NavSelectedText);
        colors.sidebar_primary = c(Role::NavSelectedBg);
        colors.sidebar_primary_foreground = c(Role::NavSelectedText);
        colors.sidebar_border = c(Role::BorderSubtle);
        colors.scrollbar = c(Role::SurfaceSunken);
        colors.scrollbar_thumb = c(Role::ControlBorder);
        colors.scrollbar_thumb_hover = c(Role::TextSecondary);
        colors.skeleton = c(Role::DisabledBg);
        colors.progress_bar = c(Role::ActionPrimaryBg);
        colors.slider_bar = c(Role::ActionPrimaryBg);
        colors.slider_thumb = c(Role::SurfaceRaised);
        colors.drag_border = c(Role::FocusRing);
        colors.drop_target = c(Role::SurfaceSelected);
        colors.chart_1 = c(Role::ChartA);
        colors.chart_2 = c(Role::ChartB);
        colors.chart_3 = c(Role::ChartC);
        colors.chart_grid = c(Role::BorderSubtle);
    }

    /// Update both component and base theme globals and refresh open windows.
    /// Resolve system appearance in the application, then pass an explicit scheme.
    pub fn apply(self, cx: &mut App) {
        let mode = match self.scheme {
            Scheme::Light => ThemeMode::Light,
            Scheme::Dark => ThemeMode::Dark,
        };
        // Changing mode reloads Kit's configuration, so canonical edits come after it.
        if KitTheme::global(cx).mode != mode {
            KitTheme::change(mode, None, cx);
        }
        KitTheme::update(cx, |theme| {
            self.map_colors(&mut theme.colors);
            theme.font_family = "IBM Plex Sans".into();
            theme.mono_font_family = "IBM Plex Mono".into();
            theme.font_size = px(TYPE_BODY);
            theme.mono_font_size = px(TYPE_UI);
            theme.radius = px(RADIUS_CONTROL);
            theme.radius_lg = px(RADIUS_PANEL);
        });
    }

    /// Apply real minimum hit-target geometry to a native styled control.
    /// Kit has no global density setting; apply this at each control boundary.
    pub fn control<T: Styled>(self, control: T) -> T {
        let m = self.metrics();
        control
            .min_h(px(m.control_height))
            .min_w(px(m.control_height))
            .px(px(m.control_padding_x))
            .py(px(m.control_padding_y))
            .text_size(px(TYPE_UI))
    }

    /// Apply row density without altering indicator sizes or window scaling.
    pub fn row<T: Styled>(self, row: T) -> T {
        row.min_h(px(self.metrics().row_height))
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ActionKind {
    Primary,
    Secondary,
    Quiet,
    Danger,
}

/// Busy controls keep their native tab stop; disabled controls do not.
#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct ActionState {
    pub disabled: bool,
    pub busy: bool,
}

impl ActionState {
    pub const fn can_activate(self) -> bool {
        !self.disabled && !self.busy
    }
    pub const fn tab_stop(self) -> bool {
        !self.disabled
    }
}

/// Native button with Kit's pointer/keyboard loading gates and a dispatch guard.
/// Keep labels stable while busy and show persistent adjacent status text.
/// The callback does not start a synthetic job or bind a global Enter shortcut.
pub fn action(
    id: impl Into<ElementId>,
    theme: Theme,
    kind: ActionKind,
    label: impl Into<SharedString>,
    state: ActionState,
    on_activate: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static,
) -> Button {
    let button = Button::new(id).label(label);
    let button = match kind {
        ActionKind::Primary => button.primary(),
        ActionKind::Secondary => button,
        ActionKind::Quiet => button.ghost().text_color(theme.color(Role::TextLink)),
        ActionKind::Danger => button.danger(),
    };
    let button = theme
        .control(button)
        .font_weight(gpui_kit::FontWeight::SEMIBOLD)
        .disabled(state.disabled)
        .loading(state.busy)
        .tab_stop(state.tab_stop());
    let button = if state.disabled {
        button
            .bg(theme.color(Role::DisabledBg))
            .text_color(theme.color(Role::TextDisabled))
    } else {
        button
    };
    button.on_click(move |event, window, cx| {
        if state.can_activate() {
            on_activate(event, window, cx);
        }
    })
}

/// A native single-line input with exact canonical surface and minimum targets.
/// InputState retains all editing, IME, clipboard, selection and focus behavior.
pub fn input(theme: Theme, state: &Entity<InputState>) -> Input {
    theme
        .control(Input::new(state))
        .bg(theme.color(Role::SurfaceRaised))
        .text_color(theme.color(Role::TextPrimary))
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Status {
    Success,
    Warning,
    Danger,
    Info,
    Neutral,
}

impl Status {
    pub const fn roles(self) -> (Role, Role) {
        match self {
            Self::Success => (Role::StatusSuccessBg, Role::StatusSuccessText),
            Self::Warning => (Role::StatusWarningBg, Role::StatusWarningText),
            Self::Danger => (Role::StatusDangerBg, Role::StatusDangerText),
            Self::Info => (Role::StatusInfoBg, Role::StatusInfoText),
            Self::Neutral => (Role::StatusNeutralBg, Role::StatusNeutralText),
        }
    }
}

/// Native accessible alert with exact paired fill/text and a non-color cue.
/// Use for meaningful state changes, not high-frequency live progress updates.
pub fn status(
    id: impl Into<ElementId>,
    theme: Theme,
    status: Status,
    message: impl Into<SharedString>,
) -> Alert {
    let id = id.into();
    let message = message.into();
    let alert = match status {
        Status::Success => Alert::success(id, message).title("Success"),
        Status::Warning => Alert::warning(id, message).title("Warning"),
        Status::Danger => Alert::error(id, message).title("Error"),
        Status::Info => Alert::info(id, message).title("Information"),
        Status::Neutral => Alert::info(id, message).title("Status"),
    };
    let (bg, fg) = status.roles();
    alert
        .bg(theme.color(bg))
        .text_color(theme.color(fg))
        .border_color(theme.color(fg))
}
