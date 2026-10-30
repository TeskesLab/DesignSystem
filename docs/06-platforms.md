# Platform implementation

The token contract is shared. Rendering and accessibility are implemented in each toolkit. Use the product's pinned versions; do not upgrade dependencies solely because documentation has a newer release.

## Web

Load tokens.css, then components.css, then application layout styles. Scope a theme with data-theme="light" or "dark", and density with data-density="comfortable" or "compact". Preference order: user override, operating-system preference, light fallback. The reference persists a choice locally; production settings need a visible way to return to System.

Use semantic HTML. Wrap the baseline in existing framework components when practical; do not require React or replace a working component library. Preserve native behavior when skinning. Framework event handlers must guard disabled/busy state, not only set a class.

Use dialog.showModal for modal surfaces if supported by the target browser matrix; otherwise use the existing tested dialog primitive. A nonmodal inspector is a region, not aria-modal. Avoid duplicate dialog systems.

The reference is deliberately small and offline. Product concerns such as routing, server validation, authorization, pagination, asset bundling, CSP, and telemetry remain in the application.

## Qt Widgets

Use QPalette for application defaults and generated QSS for opt-in components. Register the bundled TTFs through QFontDatabase; assign the real available weights. Keep measurements in logical pixels and honor high-DPI scaling.

The generated light.qss/dark.qss are starter mappings for controls under QWidget#TLRoot. Set a primary or danger button property with setProperty("tlRole", "primary") or "danger". Styling is not behavior. Refresh style when dynamic properties change. Do not paste web CSS variables into QSS.

Prefer standard widgets: QPushButton, QLineEdit, QComboBox, QCheckBox, QTabWidget, QDialog, QTableView with a model, QProgressBar, and QSplitter. Use setAccessibleName/Description when the standard label relationship is insufficient. A custom hex widget must explicitly support keyboard navigation, focus indication, selection, and accessible descriptions.

Do not populate large data tables or hex buffers with thousands of child widgets. Keep backend operations off the UI thread; publish state updates through the application's thread-safe signal/slot architecture. Cancellation requests go to the worker; a closed dialog does not terminate it.

The QSS starter intentionally leaves combo popup styling, native menus, scrollbars, window chrome, and complex item delegates for product integration. Validate disabled, focus, selected/inactive window, and high contrast in the actual OS.

## Go / Fyne

The reusable module in `go/` implements Fyne **2.8.2** themes, bundled fonts, minimum-target layouts, guarded native actions, and paired status labels. Install `NewTheme` for the requested toolkit variant or `NewFixedTheme` for an explicit preference; do not copy a palette into each consumer.

Use standard Fyne widgets, forms, containers, tables and dialogs. The action helper retains native input and rendering with an added separated focus ring. Keep work off the UI goroutine and publish actual results with `fyne.Do`. See [Go setup, mapping, state contracts and showcases](14-go-library.md), including font fallbacks and native geometry limits.

## Rust / egui and GPUI Kit

The reusable crate in `rust/` offers **egui 0.33.x** and **GPUI Kit 0.8.1** through additive `egui` and `gpui-kit` features. Enable either or both; the default feature set is empty, providing dependency-free `no_std` tokens and font bytes. Public adapters are `teskeslab_design_system::egui` and `teskeslab_design_system::gpui`; there is no `native` alias.

Install fonts once and apply theme preferences when they change, not every frame. Use each toolkit's native controls; the consumer owns durable state, routing and jobs. Both adapters share canonical scheme/density/touch inputs and generated assets. See [Rust feature selection, setup and desktop examples](15-rust-library.md). GPUI Kit adds its own platform build/runtime prerequisites; egui-only and token-only consumers do not enable it.

## Android

Generated values/colors.xml and values-night/colors.xml expose semantic colors with tl_ prefixes. Compose consumers can map these resources to their theme, or generate Color values from resolved.json.

Use dp for layout, sp for text, and >=48 dp interaction bounds. Keep native selection controls and semantics. Do not disable minimum target behavior to achieve web compact density. Test font scaling, TalkBack, rotation, keyboard, and narrow screens.

Bundle TTFs as font resources, with explicit weight mapping. Map primary/onPrimary, background/onBackground, surface/onSurface, error/onError and custom status roles as pairs. Do not assume Material defaults already match the system.

When a device theme overrides brand colors, treat that as a separate, intentional theme mode. Branded mode uses these exact mappings. Use ViewModel/state flows for durable presentation state and the product's job infrastructure for work that survives a screen.

## Units and validation

The common geometry is a design intention in logical units. CSS px, Qt/Fyne logical sizes, egui points, GPUI logical pixels, and Android dp/sp are not physical pixels and must not be blindly treated as equal under text scaling.

Go/Fyne and Rust/egui have native rendering and interaction checks; Rust/GPUI Kit adds a separate toolkit path, while Qt and Android remain starter assets. Every consumer still needs its own platform build, keyboard/assistive-technology, theme, scaling and screenshot checks. Native toolkit behavior and geometry are not a claim of browser pixel identity or accessibility certification.
