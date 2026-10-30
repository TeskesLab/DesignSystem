# Ownership, releases, and exceptions

## Source of truth

Keep tokens, component contracts, generated exports, reference screens, and tests in one versioned repository. Tokens are edited only in tokens/source.json. Generated outputs are checked in so consumers can pin an immutable release without a build tool.

Name: Teske's Lab Design System. Version: 1.0.0. Public prefix: tl / TL. The React package is `@teskeslab/design-system`; the public source repository is [GitHub](https://github.com/TeskesLab/DesignSystem). Follow the [manual npm release procedure](13-npm-release.md). Package metadata does not imply that a version has been published.

## Release rules

- Patch: correction preserving token names, component APIs, and behavior contracts.
- Minor: additive token/component/pattern with defaults that preserve consumers.
- Major: removal/rename, changed semantic meaning, required API change, or behavior change that forces consumer work.
- Color changes can be breaking even when names remain. Assess screenshots and contrast; document the migration.
- Deprecate before removing when possible. Maintain aliases for at least one minor adoption cycle unless an urgent defect requires faster change.

Each release includes CHANGELOG.md, complete generated exports, updated reference images, actual validation results, migration guidance, and a consumer impact list.

## Propose a change

Describe a concrete user problem, existing behavior, proposed behavior, affected components/tokens/platforms, alternatives considered, and validation. Show before/after screens when layout or visual hierarchy changes. Reuse a pattern when it fits; do not force unrelated workflows into it.

Required review roles: design/UX reviewer and an implementer of the affected platform. The owner assigns actual people in the repository. This handoff does not invent reviewer identities or imply approval.

## Exception record

    component_or_screen:
    system_version:
    exception:
    user_reason:
    platform_constraint:
    owner:
    validation:
    revisit_when:

Examples: a touch-first device needs 48 dp targets; a specialized hex view needs a locally scrolling fixed-width data grid; a safety-critical operation needs persistent confirmation context. “The screenshot was easier this way” is not sufficient.

## Contribution checks

Do not add tokens named after one page when an existing semantic role fits. Do not rename a token to hide a behavior change. Product-specific tokens remain in the product namespace until a second valid use case establishes a shared role.

Reference images must match the committed code and documented viewport/theme/density. Never replace baselines merely to make a regression check green. Review the underlying change first.
