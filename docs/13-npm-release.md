# npm releases

Package: `@teskeslab/design-system`. Bootstrap the initial `1.0.0` publication
manually with an account authorized for the `teskeslab` npm organization, then use
the tag-triggered GitHub workflow `.github/workflows/publish-npm.yml` for later
versions. Preparing a tarball does not publish it. These instructions do not
assert that any version has been published or that cloud execution has succeeded.
Keep npm credentials out of this repository and out of CI.

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

## Bootstrap: manual first publication

Complete the checks above before the initial publication. If `1.0.0` is already
published, do not run this publication again: proceed to trusted-publisher setup
and bump the version before the first automated release. Published versions cannot
be reused, even after unpublishing.

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

## Configure trusted publishing

After the manual first publication, configure the package's GitHub Actions trusted
publisher in npm package settings with these exact values:

| Setting | Value |
| --- | --- |
| Organization or user | `TeskesLab` |
| Repository | `DesignSystem` |
| Workflow filename | `publish-npm.yml` (filename only) |
| Environment name | `release` |
| Allowed actions | Allow direct publishing with `npm publish` |

The workflow uses direct publication, not staged publication. New npm trust
configurations allow staging by default; explicitly enable direct publishing.
A newly created configuration must complete its first successful publish within
**2 days**, or it expires. Delete and recreate an expired configuration; plan the
first version bump and approval before setting it up. Do not use an already
published version to validate trust.

The shared GitHub environment `release` must require release approval and permit
the **tag** patterns `npm/v*` and `rust/v*` in its deployment policies. A
`main`-only branch rule does not permit these tag jobs. Confirm the existing
environment settings rather than assuming that creating the environment enables
tags. No long-lived `NPM_TOKEN` or `NODE_AUTH_TOKEN` CI secret is needed: only the
publishing job receives `id-token: write` and obtains short-lived OIDC credentials.

## Subsequent releases through Gitea

Gitea is the source of truth and mirrors branches and tags to
[GitHub `TeskesLab/DesignSystem`](https://github.com/TeskesLab/DesignSystem).
Do not push directly to GitHub.

1. Update `package.json` and `package-lock.json` to the same new, unpublished
   version and update the changelog. If `1.0.0` was published manually, the first
   automated release needs a version bump; `npm/v1.0.0` cannot republish it.
2. Review and commit the workflow and release changes, push the branch to Gitea,
   and wait for the mirror to synchronize them to GitHub. Ensure trusted
   publishing and the environment's tag rules are ready before creating a tag.
3. The maintainer creates a signed, immutable tag `npm/v<version>` on the reviewed
   release commit, then pushes that tag to Gitea for mirroring. The part after
   `npm/v` must exactly equal the manifest version, not merely a compatible
   version. Never move or reuse a release tag.
4. The tag triggers `publish-npm.yml`. Its read-only checks/build job runs before
   the environment-gated publishing job. Inspect the completed release checks and
   the tagged revision before approving the pending `release` deployment.
   Approval authorizes registry publication; it is not a substitute for tests.
5. The publishing job uses the exact tagged commit and OIDC. An existing registry
   version is an error, not an automatic skip. After publication, inspect npm
   metadata and smoke-test the exact version in a clean consumer as above.

Fix source or version mistakes in a new reviewed commit and a new version/tag;
do not rewrite a tag to rerun different source. The workflow and this guide do
not create tags, configure registry trust, or authorize publication by themselves.

Official references: [public scoped packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/),
[lifecycle scripts](https://docs.npmjs.com/cli/v11/using-npm/scripts/),
and [trusted publishing](https://docs.npmjs.com/trusted-publishers/).
