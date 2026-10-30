# Teske's Lab Design System 1.0.0

React 19, Go/Fyne, and Rust/egui and GPUI Kit libraries share semantic light/dark tokens and local IBM Plex fonts for Teske's Lab research tools and technical workspaces. The web package includes ES modules and TypeScript declarations.

## Install

After the first npm release:

```sh
npm install @teskeslab/design-system
```

Use React 19 and React DOM 19 in the application. Load the styles once, in this order:

```tsx
import '@teskeslab/design-system/tokens.css';
import '@teskeslab/design-system/components.css';
import '@teskeslab/design-system/library.css';
import { Button, ThemeProvider } from '@teskeslab/design-system';

export function App() {
  return <ThemeProvider><Button variant="primary">Save changes</Button></ThemeProvider>;
}
```

Styles include a document-wide baseline. Use one `ThemeProvider` per document; application data, routing, and backend jobs stay in the consumer.

See [component usage](docs/08-adoption.md), [theme preferences](docs/11-theme.md), and [verified coverage and limits](docs/12-library-verification.md).

## Repository preview

In a [source checkout](https://github.com/TeskesLab/DesignSystem):

    npm ci
    npm run build:showcase
    npm run preview

Open <http://127.0.0.1:4173/examples/library/> for the React showcase or `/index.html#components` for the designer reference. Sample data is synthetic; no hardware is connected.

See the [npm release guide](docs/13-npm-release.md) for manual bootstrap and approved tag releases.

## Native libraries

- [Go / Fyne 2.8.2](docs/14-go-library.md): theme, bundled fonts, guarded actions, status labels, and native showcases in `go/`.
- [Rust / egui 0.33 and GPUI Kit 0.8.1](docs/15-rust-library.md): additive `egui` and `gpui-kit` features select the `egui` and `gpui` adapters; the default is dependency-free `no_std` tokens/fonts. Desktop examples use `egui-showcase` and `gpui-showcase`.

Both support light/dark and comfortable/compact preferences. Use local module/path dependencies until native releases are published. See [generation](docs/10-token-schema.md) and [validation](tests/README.md); consumer migration remains separate.

See the [Cargo release guide](docs/16-cargo-release.md) for crate publication.

## License

Code is licensed under [Apache-2.0](LICENSE). Lab-owned design assets and documentation are licensed under [CC BY-SA 4.0](LICENSE-CC-BY-SA-4.0.txt). IBM Plex fonts retain their [SIL Open Font License](assets/fonts/OFL-IBM-Plex.txt). See [provenance](PROVENANCE.md) for details.
