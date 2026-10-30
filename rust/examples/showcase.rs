//! Interactive: cargo run --example showcase --features egui-showcase
//! Automated native rendering/input: add `-- --smoke /tmp/teskeslab-rust`.
use std::path::PathBuf;

use eframe::egui;
use teskeslab_design_system::egui::{self as design, ActionKind, ActionState, Status, Theme};
use teskeslab_design_system::{Density, Scheme, tokens::*};

struct Smoke {
    directory: PathBuf,
    variant: usize,
    step: usize,
}

struct Showcase {
    theme: Theme,
    counter: usize,
    query: String,
    checked: bool,
    busy: bool,
    smoke: Option<Smoke>,
    targets: [egui::Rect; 3],
}

impl Showcase {
    fn new(cc: &eframe::CreationContext<'_>, directory: Option<PathBuf>) -> Self {
        design::install_fonts(&cc.egui_ctx);
        let theme = Theme::default();
        theme.apply(&cc.egui_ctx);
        if directory.is_some() {
            // One deterministic update per integration frame, including startup.
            cc.egui_ctx.options_mut(|options| {
                options.max_passes = std::num::NonZeroUsize::new(1).unwrap()
            });
        }
        Self {
            theme,
            counter: 0,
            query: "firmware-release.bin".into(),
            checked: true,
            busy: false,
            smoke: directory.map(|directory| Smoke {
                directory,
                variant: 0,
                step: 0,
            }),
            targets: [egui::Rect::NOTHING; 3],
        }
    }

    fn capture(&mut self, ctx: &egui::Context) {
        let Some(smoke) = &mut self.smoke else { return };
        let screenshot = ctx.input(|input| {
            input.events.iter().find_map(|event| {
                if let egui::Event::Screenshot { image, .. } = event {
                    Some(image.clone())
                } else {
                    None
                }
            })
        });
        if let Some(image) = screenshot {
            let scheme = if smoke.variant < 2 { "light" } else { "dark" };
            let density = if smoke.variant % 2 == 0 {
                "comfortable"
            } else {
                "compact"
            };
            let path = smoke.directory.join(format!("{scheme}-{density}.png"));
            let bytes: Vec<u8> = image
                .pixels
                .iter()
                .flat_map(|pixel| pixel.to_array())
                .collect();
            image::save_buffer(
                &path,
                &bytes,
                image.size[0] as u32,
                image.size[1] as u32,
                image::ColorType::Rgba8,
            )
            .unwrap_or_else(|error| panic!("Cannot save {}: {error}", path.display()));
            println!(
                "{}: pointer + keyboard = {}; disabled/busy dispatches = 0",
                path.display(),
                self.counter
            );
            smoke.variant += 1;
            if smoke.variant == 4 {
                ctx.send_viewport_cmd(egui::ViewportCommand::Close);
                return;
            }
            smoke.step = 0;
            self.counter = 0;
            self.theme.scheme = if smoke.variant < 2 {
                Scheme::Light
            } else {
                Scheme::Dark
            };
            self.theme.density = if smoke.variant % 2 == 0 {
                Density::Comfortable
            } else {
                Density::Compact
            };
            self.theme.apply(ctx);
        }
    }
}

impl eframe::App for Showcase {
    fn raw_input_hook(&mut self, _ctx: &egui::Context, input: &mut egui::RawInput) {
        let Some(smoke) = &self.smoke else { return };
        input.focused = true;
        let target = match smoke.step {
            1 | 2 => Some(0),
            3 | 4 => Some(1),
            5 | 6 => Some(2),
            _ => None,
        };
        if let Some(index) = target {
            let pos = self.targets[index].center();
            input.events.push(egui::Event::PointerMoved(pos));
            input.events.push(egui::Event::PointerButton {
                pos,
                button: egui::PointerButton::Primary,
                pressed: smoke.step % 2 == 1,
                modifiers: egui::Modifiers::NONE,
            });
        }
        if smoke.step == 8 || smoke.step == 9 {
            input.events.push(egui::Event::Key {
                key: egui::Key::Enter,
                physical_key: None,
                pressed: smoke.step == 8,
                repeat: false,
                modifiers: egui::Modifiers::NONE,
            });
        }
    }

    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        self.capture(ctx);
        let previous_theme = self.theme;
        egui::TopBottomPanel::top("preferences").show(ctx, |ui| {
            ui.horizontal_wrapped(|ui| {
                ui.label("Theme");
                ui.selectable_value(&mut self.theme.scheme, Scheme::Light, "Light");
                ui.selectable_value(&mut self.theme.scheme, Scheme::Dark, "Dark");
                ui.separator();
                ui.label("Density");
                ui.selectable_value(&mut self.theme.density, Density::Comfortable, "Comfortable");
                ui.selectable_value(&mut self.theme.density, Density::Compact, "Compact");
                ui.checkbox(&mut self.theme.touch, "Touch targets");
            });
        });
        if previous_theme != self.theme {
            self.theme.apply(ctx);
        }
        let mut primary_id = None;
        egui::CentralPanel::default().show(ctx, |ui| {
            egui::ScrollArea::vertical().show(ui, |ui| {
                ui.label(egui::RichText::new("Teske's Lab · Native Rust").font(egui::FontId::new(TYPE_TITLE, design::strong_family())));
                ui.label("Canonical tokens and IBM Plex, rendered by egui 0.33. No simulated business jobs.");
                ui.add_space(SPACE_3);
                ui.heading("Actions and native input");
                ui.horizontal_wrapped(|ui| {
                    let action = design::action(ui, self.theme, ActionKind::Primary, "Increment counter", ActionState::default());
                    self.targets[0] = action.response.rect;
                    primary_id = Some(action.response.id);
                    if action.activated() { self.counter += 1; }
                    let disabled = design::action(ui, self.theme, ActionKind::Secondary, "Disabled action", ActionState { disabled: true, busy: false });
                    self.targets[1] = disabled.response.rect;
                    if disabled.activated() { panic!("Disabled action dispatched"); }
                    let busy = design::action(ui, self.theme, ActionKind::Primary, "Busy action", ActionState { disabled: false, busy: true });
                    self.targets[2] = busy.response.rect;
                    if busy.activated() { panic!("Busy action dispatched"); }
                });
                ui.label(format!("Counter: {} — activate with pointer, Tab then Enter or Space.", self.counter));
                ui.horizontal_wrapped(|ui| {
                    if design::action(ui, self.theme, ActionKind::Secondary, "Reset counter", ActionState::default()).activated() { self.counter = 0; }
                    if design::action(ui, self.theme, ActionKind::Quiet, "Toggle local busy state", ActionState::default()).activated() { self.busy = !self.busy; }
                    if design::action(ui, self.theme, ActionKind::Danger, "Clear local text", ActionState { disabled: false, busy: self.busy }).activated() { self.query.clear(); }
                });
                ui.label(if self.busy { "Local state: busy. Clear local text is guarded; no job is running." } else { "Local state: ready. Clear affects only the editable text below." });
                ui.add_space(SPACE_2);
                ui.horizontal(|ui| {
                    let label = ui.label("Artifact name");
                    ui.add(egui::TextEdit::singleline(&mut self.query).desired_width(320.0)).labelled_by(label.id);
                });
                ui.checkbox(&mut self.checked, "Keep local preference enabled");
                egui::ComboBox::from_label("Native selection")
                    .selected_text(if self.checked { "Enabled" } else { "Disabled" })
                    .show_ui(ui, |ui| {
                        ui.selectable_value(&mut self.checked, true, "Enabled");
                        ui.selectable_value(&mut self.checked, false, "Disabled");
                    });
                ui.add_space(SPACE_3);
                ui.heading("Independent status dimensions");
                ui.horizontal_wrapped(|ui| {
                    for (status, label) in [(Status::Success, "Verified"), (Status::Warning, "Stale"), (Status::Danger, "Unavailable"), (Status::Info, "Draft"), (Status::Neutral, "Not checked")] {
                        design::badge(ui, self.theme, status, label);
                    }
                });
                design::callout(ui, self.theme, Status::Info, "Native controls, shared meaning", "Statuses above are static component samples, not assertions about an artifact. Long explanations wrap; errors stay visible and do not take focus.");
                ui.add_space(SPACE_3);
                ui.heading("Typography and inspectable values");
                ui.label(egui::RichText::new("IBM Plex Sans Regular 400 and genuine SemiBold 600").family(design::strong_family()));
                ui.add(egui::Label::new(egui::RichText::new("sha256: 0123456789abcdef  ·  offset: 0x00001000").monospace().color(self.theme.color(teskeslab_design_system::Role::CodeText))).selectable(true));
                ui.label("No italic or monospace-bold face is bundled. Glyph fallbacks remain available.");
                egui::CollapsingHeader::new("Layout metrics and native limitations").show(ui, |ui| {
                    let metrics = self.theme.metrics();
                    ui.label(format!("Control minimum: {} pt; data-row target: {} pt", metrics.control_height, metrics.row_height));
                    ui.label("Rows use metrics explicitly. Font scaling can increase dimensions. Accessibility support depends on the host integration and OS.");
                });
            });
        });
        if let Some(smoke) = &mut self.smoke {
            if smoke.variant == 4 {
                return;
            }
            match smoke.step {
                2 | 4 | 6 | 7 => assert_eq!(
                    self.counter, 1,
                    "Pointer action or disabled/busy gate failed"
                ),
                9 => {
                    assert_eq!(self.counter, 2, "Keyboard activation failed");
                    ctx.send_viewport_cmd(egui::ViewportCommand::Screenshot(
                        egui::UserData::default(),
                    ));
                }
                _ => {}
            }
            if smoke.step == 7 {
                ctx.memory_mut(|memory| {
                    memory.request_focus(primary_id.expect("Primary button missing"))
                });
            }
            smoke.step += 1;
            assert!(
                smoke.step < 120,
                "Native screenshot response did not arrive"
            );
            ctx.request_repaint();
        }
    }
}

fn main() -> eframe::Result {
    let mut args = std::env::args_os().skip(1);
    let directory = match args.next() {
        None => None,
        Some(flag) if flag == "--smoke" => {
            let path = PathBuf::from(args.next().expect("--smoke requires an output directory"));
            assert!(
                args.next().is_none(),
                "Unexpected argument after output directory"
            );
            std::fs::create_dir_all(&path).expect("Cannot create screenshot output directory");
            Some(path)
        }
        _ => panic!("Usage: showcase [--smoke OUTPUT_DIRECTORY]"),
    };
    eframe::run_native(
        "Teske's Lab Rust design system",
        eframe::NativeOptions {
            viewport: egui::ViewportBuilder::default().with_inner_size([1060.0, 940.0]),
            ..Default::default()
        },
        Box::new(move |cc| Ok(Box::new(Showcase::new(cc, directory)))),
    )
}
