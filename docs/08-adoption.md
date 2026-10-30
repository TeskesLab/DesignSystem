# Adoption and migration

## What is preserved

The identity package's exact brand primitives, IBM Plex Sans/Mono files, outlined signatures, brand role distinctions, and character placement intent.

## What v1 adds or changes

| Existing material | System decision |
| --- | --- |
| Brand colors used directly | Introduce semantic roles; keep primitive values |
| Teal as a general link value | Light text-link becomes #006B72 for contrast on all approved surfaces; primary fill remains #00767D |
| Librarian light theme only | Add explicit dark mapping and paired status colors |
| Small metadata down to 11-12 px | General metadata baseline 13 px; 12 px for short section labels |
| App-specific spacing/layout values | Shared scale and density; product geometry remains local |
| Decorative divider reused for fields | Separate border-subtle from control-border |
| Different interpretations of states | Common button, form, overlay, feedback, and job contracts |

The slightly darker link role is intentional. Automated checks found that the original Teal did not reach 4.5:1 on selected and sunken light surfaces. This is an operational extension of the palette, not a replacement brand color.

## Sequence

1. Inventory consumer frameworks, build tooling, existing components, routes, and jobs.
2. Build and validate the shared web library independently, including its tokens, themes, and accessible component contracts.
3. Pin the library and integrate one Librarian reading/search/source flow.
4. Integrate one hardware read/inspection/job flow, using a simulated or safe test backend first.
5. Compare screenshots and interaction behavior; fix contracts if both consumers expose a mismatch.
6. Roll through remaining screens in small PRs; remove old tokens only after references are gone.
7. Integrate the shared Go/Fyne or Rust/egui library before adding consumer-specific styling. Qt/Android starter integration remains platform-specific.

Do not begin with a global CSS replacement. That can silently change status meaning, hit targets, and existing component assumptions.

## React web package

The repository root is the `@teskeslab/design-system` package. It targets React 19 and supplies TypeScript declarations and ES modules. Install a published version or a local release tarball, with React and React DOM supplied by the application. A source checkout runs `npm run build` during package preparation; the offline `index.html` gallery remains independent of npm and the package build. See [manual publication](13-npm-release.md).

Import the shared styles once at the application entry point, in this order:

```tsx
import '@teskeslab/design-system/tokens.css';
import '@teskeslab/design-system/components.css';
import '@teskeslab/design-system/library.css';
```

The component stylesheet includes a document baseline and locally hosted IBM Plex fonts, so review its global rules before integrating it into an existing application. The bundled font paths resolve relative to the stylesheet. Set `data-theme="light"` or `"dark"` and `data-density="comfortable"` or `"compact"` on the document element (or a containing element) to select the token values.

For persisted light, dark, and system preferences and density settings, use the [theme provider](11-theme.md).

```tsx
import { useState } from 'react';
import { Button, Checkbox, Radio, RadioGroup, Select, TextField } from '@teskeslab/design-system';

function Settings() {
  const [name, setName] = useState('');
  const [notify, setNotify] = useState(false);
  return <form onSubmit={event => { event.preventDefault(); /* save settings */ }}>
    <TextField label="Name" value={name} onChange={event => setName(event.target.value)}
      helperText="Shown to collaborators." required />
    <Select label="Language" name="language" defaultValue="en">
      <option value="en">English</option><option value="pt">Português</option>
    </Select>
    <Checkbox label="Send notifications" checked={notify}
      onChange={event => setNotify(event.target.checked)} />
    <RadioGroup label="Visibility">
      <Radio name="visibility" value="private" label="Private" defaultChecked />
      <Radio name="visibility" value="shared" label="Shared" />
    </RadioGroup>
    <Button type="submit" variant="primary">Save settings</Button>
  </form>;
}
```

`TextField` and `Select` associate their labels, helper and error text automatically; pass `errorText` after validation and retain the user's value. `Checkbox` supports aggregate `indeterminate` state. `Switch` is for immediate settings; form-saved preferences should use `Checkbox`. Radios sharing a `name` use native keyboard behavior. All controls accept their native element props; provide stable explicit IDs when other application elements need to reference them. `Link` is a real anchor, optionally styled with a button `variant`. Buttons default to `type="button"`; use `type="submit"` explicitly for form submission. For a busy button, pass `busy` and an operation label such as “Saving…”, and guard the form submission and backend as well as the button against duplicate dispatch.

The package also exports navigation, tabs, status, callout, overlay, and content components. Follow their component contracts in [02-components.md](02-components.md). The [live showcase and verification guide](12-library-verification.md) lists public API coverage and checks. Business-state validation, job handling and destination routing remain application responsibilities.

## Consumer mapping worksheet

| Current element | System role/component | Product-specific behavior | Tests | Migration issue |
| --- | --- | --- | --- | --- |
| Example: source panel | C14 Drawer | Source ID / immutable revision | Focus, revision correctness | DS-004 |
| Example: read job | C16 Job | Device protocol and cancellation | Unknown status / partial output | DS-005 |

Fill this from the selected consumer's source before migration. The library targets React 19, as used by Librarian; product routes and job APIs still require integration-specific inspection.

## Rollback

Pin the previous system version and retain the previous theme adapter until the first migrated flow is accepted. Keep business-state changes out of a purely visual migration where possible. Any schema change needs its own reversible migration plan. Do not roll back a failed job by replaying a hardware command.
