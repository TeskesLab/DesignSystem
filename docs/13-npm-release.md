# Manual npm release

Package: `@teskeslab/design-system`. The initial npm version is `1.0.0`.
The `teskeslab` npm scope was created by the project owner. The publishing account
must have permission to publish packages in that organization.

Publication is manual. No CI workflow, registry token, or automatic publish hook
is configured. Preparing a tarball does not publish it. Keep npm credentials out
of this repository.

## Prepare and check

Use a reviewed source revision, Node.js 24, Python 3, and Chromium. Keep development
dependencies installed while preparing the package. The `prepare` lifecycle builds
ES modules and declarations; registry consumers receive the built files and do not
need Python, TypeScript, or tsup.

```sh
npm ci
# If no compatible Chromium is installed:
node node_modules/playwright/cli.js install chromium
npm run release:check
npm pack
```

For an existing browser, use `CHROMIUM_PATH=/path/to/chromium npm run release:check`.
The check command runs TypeScript, token checks, the React showcase build, visual
parity and interaction checks, reflow, and automated accessibility scans. Inspect
`validation/library/report.json` and its images; manual accessibility and product
integration limits remain as documented in [verification](12-library-verification.md).

`npm pack` builds the library and creates `teskeslab-design-system-1.0.0.tgz`.
Its allowlist includes built modules/declarations, styles, bundled fonts and OFL,
README, documentation, changelog, provenance, and both project license texts.
Source, tests, the showcase bundle, reports, Git metadata, and the designer ZIP are
not part of the npm artifact. React and React DOM are peer dependencies;
`tabbable` is a runtime dependency.

Before release, install that tarball into a separate React 19 application and
exercise an import, the three stylesheet subpaths, and bundled font loading.
Use the tarball, not a symlink to this checkout, so missing exports or files are
visible. The initial prepared artifact was checked this way, including public
ESM imports, TypeScript resolution, server rendering, CSS, fonts, and licenses.

Inspect the exact artifact without publishing:

```sh
npm publish ./teskeslab-design-system-1.0.0.tgz --dry-run --registry=https://registry.npmjs.org/
sha256sum ./teskeslab-design-system-1.0.0.tgz
```

Record the source commit, check results, tarball checksum, and version. Commit
source changes before the final release check and pack. Do not rebuild or replace
the verified tarball between review and publication. Package name, version, public
access, `latest` tag, and npmjs registry are set in `package.json`.

## Publish only when approved

Log in interactively with an authorized npm account and use 2FA:

```sh
npm login --registry=https://registry.npmjs.org/
npm whoami --registry=https://registry.npmjs.org/
npm publish ./teskeslab-design-system-1.0.0.tgz --access public --registry=https://registry.npmjs.org/
```

Publish the checked tarball instead of the working directory. npm does not rerun
this repository's release checks when publishing a tarball. Do not put an OTP or
access token in documentation, a command history, or a tracked file.

Then inspect the published metadata:

```sh
npm view @teskeslab/design-system@1.0.0 version dist.integrity dist.tarball --registry=https://registry.npmjs.org/
```

Install the published version in a clean consumer for a final registry smoke check.
A published name/version cannot be reused; corrections require a new version.
For later releases, update the manifest and lockfile version together, update the
changelog, and use the matching tarball filename in the commands above. Follow
[versioning rules](07-governance.md). Commit, tag, push, and publication are separate
operations; none is implied by running the preparation commands.

## Authentication boundary

The public repository is [GitHub](https://github.com/TeskesLab/DesignSystem).
Publication remains manual; a public repository alone does not configure trusted publishing
or authorize CI releases. Manual 2FA publication avoids adding a publishing token
to CI. If automated publication is adopted later, choose its authentication method explicitly.

Official references: [public scoped packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/),
[lifecycle scripts](https://docs.npmjs.com/cli/v11/using-npm/scripts/),
and [trusted publishing](https://docs.npmjs.com/trusted-publishers/).
