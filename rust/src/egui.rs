//! Native egui 0.33 styling and small, composable semantic helpers.
//!
//! Standard egui controls retain their own input, focus and accessibility
//! implementation. Application state, jobs, dialogs and navigation stay with
//! the application. No font installation or theme rebuilding happens per frame.
use std::sync::LazyLock;

use egui::{Color32, FontFamily, FontId, Response, RichText, Stroke, Ui};

use crate::{Density, Metrics, Role, Scheme, color, dimensions, fonts, tokens::*};

const REGULAR: &str = "teskeslab-plex-sans-regular";
const SEMIBOLD: &str = "teskeslab-plex-sans-semibold";
const MONO: &str = "teskeslab-plex-mono-regular";

/// Real Plex Sans 600, not egui's synthetic `RichText::strong` emphasis.
pub fn strong_family() -> FontFamily {
    static FAMILY: LazyLock<FontFamily> = LazyLock::new(|| FontFamily::Name(SEMIBOLD.into()));
    FAMILY.clone()
}

/// Add Plex ahead of existing fonts, retaining application glyph fallbacks.
/// Safe to call again: font family lists never accumulate duplicate entries.
pub fn add_fonts(definitions: &mut egui::FontDefinitions) {
    for (name, bytes) in [
        (REGULAR, fonts::SANS_REGULAR),
        (SEMIBOLD, fonts::SANS_SEMIBOLD),
        (MONO, fonts::MONO_REGULAR),
    ] {
        definitions
            .font_data
            .insert(name.into(), egui::FontData::from_static(bytes).into());
    }
    for (family, name) in [
        (FontFamily::Proportional, REGULAR),
        (FontFamily::Monospace, MONO),
    ] {
        let list = definitions.families.entry(family).or_default();
        list.retain(|entry| entry != name);
        list.insert(0, name.into());
    }
    let mut strong = definitions.families[&FontFamily::Proportional].clone();
    strong.retain(|entry| entry != SEMIBOLD);
    strong.insert(0, SEMIBOLD.into());
    definitions.families.insert(strong_family(), strong);
}

/// Install Plex with egui's built-in fallback fonts. Call during initialization.
/// Use `add_fonts` instead if your application has its own fallback fonts.
pub fn install_fonts(ctx: &egui::Context) {
    let mut definitions = egui::FontDefinitions::default();
    add_fonts(&mut definitions);
    ctx.set_fonts(definitions);
}

pub fn color32(scheme: Scheme, role: Role) -> Color32 {
    let value = color(scheme, role);
    Color32::from_rgba_unmultiplied(value.r, value.g, value.b, value.a)
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct Theme {
    pub scheme: Scheme,
    pub density: Density,
    /// Touch always uses comfortable minimum targets, even in compact mode.
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

    pub fn color(self, role: Role) -> Color32 {
        color32(self.scheme, role)
    }

    /// Build toolkit defaults with the canonical semantic mapping.
    /// Consumers may further adjust the returned style before installing it.
    pub fn style(self) -> egui::Style {
        let mut style = egui::Style::default();
        self.map_style(&mut style);
        style
    }

    /// Map design-system fields without replacing unrelated application style.
    pub fn map_style(self, style: &mut egui::Style) {
        let c = |role| self.color(role);
        let metrics = self.metrics();
        style.spacing.item_spacing = egui::vec2(SPACE_2, SPACE_2);
        style.spacing.button_padding =
            egui::vec2(metrics.control_padding_x, metrics.control_padding_y);
        style.spacing.interact_size = egui::vec2(metrics.control_height, metrics.control_height);
        style.spacing.window_margin = egui::Margin::same(SPACE_4 as i8);
        style.spacing.menu_margin = egui::Margin::same(SPACE_2 as i8);
        style.spacing.indent = SPACE_6;
        style.animation_time = MOTION_FAST / 1000.0;
        for (text_style, size, family) in [
            (egui::TextStyle::Heading, TYPE_SECTION, strong_family()),
            (egui::TextStyle::Body, TYPE_BODY, FontFamily::Proportional),
            (egui::TextStyle::Button, TYPE_UI, strong_family()),
            (egui::TextStyle::Small, TYPE_META, FontFamily::Proportional),
            (egui::TextStyle::Monospace, TYPE_UI, FontFamily::Monospace),
        ] {
            style
                .text_styles
                .insert(text_style, FontId::new(size, family));
        }
        let visuals = &mut style.visuals;
        visuals.dark_mode = self.scheme == Scheme::Dark;
        // Keep per-state foreground colors effective on native controls.
        visuals.override_text_color = None;
        visuals.weak_text_color = Some(c(Role::TextSecondary));
        visuals.panel_fill = c(Role::SurfacePage);
        visuals.window_fill = c(Role::SurfaceRaised);
        visuals.window_stroke = Stroke::new(BORDER_WIDTH, c(Role::BorderSubtle));
        visuals.window_corner_radius = egui::CornerRadius::same(RADIUS_PANEL as u8);
        visuals.menu_corner_radius = egui::CornerRadius::same(RADIUS_PANEL as u8);
        visuals.faint_bg_color = c(Role::SurfaceSunken);
        visuals.extreme_bg_color = c(Role::SurfaceSunken);
        visuals.text_edit_bg_color = Some(c(Role::SurfaceRaised));
        visuals.code_bg_color = c(Role::CodeBg);
        visuals.hyperlink_color = c(Role::TextLink);
        visuals.warn_fg_color = c(Role::StatusWarningText);
        visuals.error_fg_color = c(Role::StatusDangerText);
        visuals.selection.bg_fill = c(Role::SurfaceSelected);
        visuals.selection.stroke = Stroke::new(BORDER_WIDTH, c(Role::TextPrimary));
        visuals.text_cursor.stroke = Stroke::new(FOCUS_WIDTH, c(Role::TextPrimary));
        visuals.widgets.noninteractive =
            self.widget_visuals(Role::SurfaceRaised, Role::TextPrimary, Role::BorderSubtle);
        visuals.widgets.inactive =
            self.widget_visuals(Role::SurfaceRaised, Role::TextPrimary, Role::ControlBorder);
        visuals.widgets.hovered =
            self.widget_visuals(Role::SurfaceHover, Role::TextPrimary, Role::ControlBorder);
        visuals.widgets.active =
            self.widget_visuals(Role::SurfaceSelected, Role::TextPrimary, Role::FocusRing);
        visuals.widgets.active.bg_stroke.width = FOCUS_WIDTH;
        visuals.widgets.open = self.widget_visuals(
            Role::SurfaceSelected,
            Role::TextPrimary,
            Role::ControlBorder,
        );
    }

    /// Apply an explicit scheme/density. Does not reload fonts or change zoom.
    /// The application owns system-theme preference resolution.
    pub fn apply(self, ctx: &egui::Context) {
        let theme = match self.scheme {
            Scheme::Light => egui::Theme::Light,
            Scheme::Dark => egui::Theme::Dark,
        };
        ctx.set_theme(theme);
        let mut style = (*ctx.style_of(theme)).clone();
        self.map_style(&mut style);
        ctx.set_style_of(theme, style);
    }

    fn widget_visuals(
        self,
        background: Role,
        foreground: Role,
        border: Role,
    ) -> egui::style::WidgetVisuals {
        egui::style::WidgetVisuals {
            bg_fill: self.color(background),
            weak_bg_fill: self.color(background),
            bg_stroke: Stroke::new(BORDER_WIDTH, self.color(border)),
            corner_radius: egui::CornerRadius::same(RADIUS_CONTROL as u8),
            fg_stroke: Stroke::new(BORDER_WIDTH, self.color(foreground)),
            expansion: 0.0,
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ActionKind {
    Primary,
    Secondary,
    Quiet,
    Danger,
}

/// Busy actions remain keyboard-focusable but cannot dispatch.
#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct ActionState {
    pub disabled: bool,
    pub busy: bool,
}

impl ActionState {
    pub const fn can_activate(self) -> bool {
        !self.disabled && !self.busy
    }
}

pub struct ActionResponse {
    /// Native response for focus, hover, accessibility and layout integration.
    pub response: Response,
    state: ActionState,
}

impl ActionResponse {
    /// Guard dispatch in addition to the native widget's input gate.
    pub fn activated(&self) -> bool {
        self.state.can_activate() && self.response.enabled() && self.response.clicked()
    }
}

/// Native button with semantic state colors and an explicit dispatch guard.
///
/// Keep `label` stable while busy, and show the operation's state in adjacent
/// persistent text. A busy underline appears without changing the button size.
/// This helper does not start jobs or bind a global Enter shortcut.
pub fn action(
    ui: &mut Ui,
    theme: Theme,
    kind: ActionKind,
    label: &str,
    state: ActionState,
) -> ActionResponse {
    let (normal, hover, pressed, text) = match kind {
        ActionKind::Primary => (
            Role::ActionPrimaryBg,
            Role::ActionPrimaryHover,
            Role::ActionPrimaryPressed,
            Role::ActionPrimaryText,
        ),
        ActionKind::Danger => (
            Role::ActionDangerBg,
            Role::ActionDangerHover,
            Role::ActionDangerPressed,
            Role::ActionDangerText,
        ),
        ActionKind::Secondary => (
            Role::SurfaceRaised,
            Role::SurfaceHover,
            Role::SurfaceSelected,
            Role::TextPrimary,
        ),
        ActionKind::Quiet => (
            Role::SurfaceRaised,
            Role::SurfaceHover,
            Role::SurfaceSelected,
            Role::TextLink,
        ),
    };
    // Temporarily replace only small Copy visuals, not the complete Style or
    // font map per button. Other widgets keep their original colors.
    let previous_widgets = ui.visuals().widgets.clone();
    let previous_override = ui.visuals().override_text_color;
    let previous_alpha = ui.visuals().disabled_alpha;
    let unavailable = !state.can_activate() || !ui.is_enabled();
    {
        let visuals = ui.visuals_mut();
        visuals.override_text_color = None;
        if unavailable {
            let disabled =
                theme.widget_visuals(Role::DisabledBg, Role::TextDisabled, Role::DisabledBg);
            visuals.widgets.inactive = disabled;
            visuals.widgets.hovered = disabled;
            visuals.widgets.active = disabled;
            visuals.widgets.noninteractive = disabled;
            visuals.disabled_alpha = 1.0;
        } else {
            let filled = matches!(kind, ActionKind::Primary | ActionKind::Danger);
            visuals.widgets.inactive = theme.widget_visuals(
                normal,
                text,
                if filled { normal } else { Role::ControlBorder },
            );
            visuals.widgets.hovered = theme.widget_visuals(
                hover,
                text,
                if filled { hover } else { Role::ControlBorder },
            );
            visuals.widgets.active = theme.widget_visuals(
                pressed,
                text,
                if filled { pressed } else { Role::ControlBorder },
            );
            if kind == ActionKind::Quiet {
                visuals.widgets.inactive.bg_fill = Color32::TRANSPARENT;
                visuals.widgets.inactive.weak_bg_fill = Color32::TRANSPARENT;
                visuals.widgets.inactive.bg_stroke = Stroke::NONE;
                visuals.widgets.hovered.bg_stroke = Stroke::NONE;
                visuals.widgets.active.bg_stroke = Stroke::NONE;
            }
        }
    }
    let mut button =
        egui::Button::new(label).min_size(egui::Vec2::splat(theme.metrics().control_height));
    if state.busy {
        button = button.sense(egui::Sense::focusable_noninteractive());
    }
    let response = ui.add_enabled(!state.disabled, button);
    {
        let visuals = ui.visuals_mut();
        visuals.widgets = previous_widgets;
        visuals.override_text_color = previous_override;
        visuals.disabled_alpha = previous_alpha;
    }
    if response.has_focus() {
        ui.painter().rect_stroke(
            response.rect.expand(FOCUS_OFFSET),
            RADIUS_CONTROL,
            Stroke::new(FOCUS_WIDTH, theme.color(Role::FocusRing)),
            egui::StrokeKind::Outside,
        );
    }
    if state.busy {
        let y = response.rect.bottom() - SPACE_1;
        ui.painter().line_segment(
            [
                egui::pos2(response.rect.left() + SPACE_2, y),
                egui::pos2(response.rect.right() - SPACE_2, y),
            ],
            Stroke::new(BORDER_WIDTH, theme.color(Role::TextDisabled)),
        );
    }
    ActionResponse { response, state }
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
    /// Paired background/foreground roles; never use a status background alone.
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

/// Noninteractive status label. Text is mandatory: meaning is not color-only.
/// Dynamic announcements, if needed, belong to the host accessibility layer.
pub fn badge(ui: &mut Ui, theme: Theme, status: Status, text: &str) -> Response {
    let (background, foreground) = status.roles();
    egui::Frame::new()
        .fill(theme.color(background))
        .corner_radius(3) // Reference badge geometry, not the generic pill radius.
        .inner_margin(egui::Margin::symmetric(SPACE_2 as i8, SPACE_1 as i8))
        .show(ui, |ui| {
            ui.label(
                RichText::new(text)
                    .font(FontId::new(TYPE_META, FontFamily::Proportional))
                    .color(theme.color(foreground)),
            )
        })
        .inner
}

/// Persistent, wrapping information/error text; does not steal focus or
/// manufacture an accessibility alert on each immediate-mode frame.
pub fn callout(ui: &mut Ui, theme: Theme, status: Status, title: &str, body: &str) -> Response {
    let (background, foreground) = status.roles();
    let response = egui::Frame::new()
        .fill(theme.color(background))
        .inner_margin(egui::Margin::symmetric(SPACE_5 as i8, SPACE_4 as i8))
        .show(ui, |ui| {
            ui.label(
                RichText::new(title)
                    .font(FontId::new(TYPE_UI, strong_family()))
                    .color(theme.color(foreground)),
            );
            ui.add(
                egui::Label::new(
                    RichText::new(body)
                        .size(TYPE_UI)
                        .color(theme.color(foreground)),
                )
                .wrap(),
            );
        })
        .response;
    // Match the reference's 3px leading accent without outlining the whole panel.
    let x = response.rect.left() + 1.5;
    ui.painter().line_segment(
        [
            egui::pos2(x, response.rect.top()),
            egui::pos2(x, response.rect.bottom()),
        ],
        Stroke::new(3.0_f32, theme.color(foreground)),
    );
    response
}
