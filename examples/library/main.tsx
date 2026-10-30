import { StrictMode, useEffect, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Button, Link, TextField, Select, Checkbox, RadioGroup, Radio, Switch,
  Tabs, StatusBadge, Callout, Dialog, Drawer, Navigation, Toast,
  Disclosure, Progress, EmptyState, CodeBlock, Table, ThemeProvider, useTheme,
} from '../../web/src';

// Decorative fixture artwork from the designer reference, not replacement controls.
const artwork: Record<string, ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  book: <path d="M12 5v16M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2z" />,
  chip: <><rect x="6" y="6" width="12" height="12" rx="1" /><path d="M3 8h3M3 12h3M3 16h3M18 8h3M18 12h3M18 16h3M8 3v3M12 3v3M16 3v3M8 18v3M12 18v3M16 18v3M10 10h4v4h-4z" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v1" /></>,
  warning: <path d="m12 3 10 18H2zM12 9v5m0 3v1" />,
  error: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m-6 0 6-6" /></>,
  search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1" /></>,
  sliders: <><path d="M4 6h6m4 0h6M4 12h10m4 0h2M4 18h2m4 0h10" /><circle cx="12" cy="6" r="2" /><circle cx="16" cy="12" r="2" /><circle cx="8" cy="18" r="2" /></>,
};
function Icon({ name }: { name: string }) {
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">{artwork[name]}</svg>;
}

const references = [
  { title: 'Capture setup', type: 'Lab note', status: 'Draft', tone: 'neutral', sources: 2 },
  { title: 'Receiver calibration', type: 'Procedure', status: 'Needs review', tone: 'warning', sources: 4 },
  { title: 'Antenna feed assembly', type: 'Reference', status: 'Published', tone: 'info', sources: 3 },
] as const;
const captureMetadata = 'capture_id:  example-0042\nobservation: repeating burst\nsource:      original recording\nreview:      pending';
type Page = 'components' | 'reading' | 'extended';
function currentPage(): Page {
  const hash = window.location.hash.slice(1);
  if (hash === 'reading' || hash === 'observation' || hash === 'evidence' || hash === 'next-step') return 'reading';
  return hash === 'extended' ? 'extended' : 'components';
}

function App() {
  const { theme, resolvedTheme, density, setTheme, setDensity, reset } = useTheme();
  const [page, setPage] = useState<Page>(currentPage);
  const [dialog, setDialog] = useState<'save' | 'delete' | null>(() => new URLSearchParams(window.location.search).get('dialog') === 'open' ? 'save' : null);
  const [drawer, setDrawer] = useState(false);
  const [inspector, setInspector] = useState(false);
  const [toast, setToast] = useState('');
  const [lastResult, setLastResult] = useState('No action performed.');
  const [projectName, setProjectName] = useState('Antenna capture notes');
  const [projectError, setProjectError] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'none' | 'ascending' | 'descending'>('none');
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [manualTab, setManualTab] = useState('summary');
  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash !== '#main') setPage(currentPage());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  function notify(message: string) { setLastResult(message); setToast(message); }
  function navigate(next: Page) {
    setPage(next);
    window.requestAnimationFrame(() => document.getElementById(`${next}-title`)?.focus());
  }
  const filtered = references.filter(row => `${row.title} ${row.type}`.toLowerCase().includes(query.toLowerCase()));
  if (sort !== 'none') filtered.sort((a, b) => (sort === 'ascending' ? 1 : -1) * a.title.localeCompare(b.title));
  const sourceContent = <>
    <StatusBadge>Synthetic reference</StatusBadge>
    <p className="muted" style={{ marginTop: 24 }}>A source panel keeps the relevant evidence beside the reading task.</p>
    <h3>Referenced passage</h3>
    <blockquote style={{ margin: 0, borderLeft: '3px solid var(--tl-text-link)', paddingLeft: 20, lineHeight: 1.75 }}>“The recording contains a repeating burst. Receiver settings and acquisition time are preserved with the capture.”</blockquote>
    <p className="small muted" style={{ marginTop: 16 }}>Illustrative text authored for this design system.</p>
    <Disclosure summary="Technical details" style={{ marginTop: 24 }}><p className="small">Source ID</p><code>example:source-0042</code><p className="small" style={{ marginTop: 16 }}>Availability: bundled fixture<br />Review: not independently reviewed</p></Disclosure>
  </>;

  return <>
    <Link className="skip" href="#main">Skip to content</Link>
    <div className="shell">
      <aside className="rail showcase-navigation" aria-label="Design system" data-parity="navigation" data-reference=".rail">
        <Navigation label="Main" menuLabel="Open navigation"
          brand={<><img className="brand" src="../../assets/marks/signature-paper.svg" alt="Teske's Lab" /><div className="edition">DESIGN SYSTEM / 1.0</div></>}
          groups={[{ label: 'Reference', items: [
            { href: '../../index.html#overview', label: <><Icon name="grid" />Foundations</> },
            { href: '#components', current: page === 'components', label: <><Icon name="sliders" />Components</> },
            { href: '#reading', current: page === 'reading', label: <><Icon name="book" />Reading pattern</> },
            { href: '../../index.html#workspace', label: <><Icon name="chip" />Technical workspace</> },
            { href: '../../index.html#rules', label: <><Icon name="check" />Build &amp; validate</> },
          ] }]}
          onNavigate={item => { if (item.href === '#components' || item.href === '#reading') navigate(item.href.slice(1) as Page); }} />
        <div className="rail-bottom"><div className="rail-line" /><p>Clear information.<br />Precise controls.<br />Room to investigate.</p><p className="small">29 OCT 2026</p></div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="context">TESKE'S LAB <span aria-hidden="true">/</span> <span id="current-context">{page === 'components' ? 'Components' : page === 'reading' ? 'Reading pattern' : 'Extended controls'}</span></div>
          <div className="toolbar">
            <Select id="density" label="Density" aria-label="Control density" value={density} onChange={event => setDensity(event.target.value as 'comfortable' | 'compact')}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></Select>
            <Button id="theme-toggle" aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} theme`} leadingIcon={<Icon name="sun" />} onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}><span id="theme-label">{resolvedTheme === 'light' ? 'Light' : 'Dark'}</span></Button>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <section className="page" id="page-components" hidden={page !== 'components'} aria-labelledby="components-title">
            <div className="page-intro"><div><div className="eyebrow">The reusable core</div><h1 id="components-title" tabIndex={-1}>Components with a contract.</h1><p className="lede">Appearance, interaction, and feedback belong together. Change the theme or density to inspect the same controls.</p></div><StatusBadge tone="info">Interactive reference</StatusBadge></div>
            <div className="component-grid">
              <section className="spec-block" data-parity="actions" data-reference="#page-components .spec-block:nth-child(1)"><h2>Actions &amp; states</h2>
                <div className="state-matrix">
                  <div className="state"><Button variant="primary" onClick={() => notify('Example action completed.')}>Save changes</Button><span>Default</span></div>
                  <div className="state"><Button variant="primary" data-demo-state="hover" onClick={() => notify('Hover specimen activated.')}>Save changes</Button><span>Hover specimen</span></div>
                  <div className="state"><Button variant="primary" data-demo-state="focus" onClick={() => notify('Focus specimen activated.')}>Save changes</Button><span>Focus specimen</span></div>
                  <div className="state"><Button variant="primary" data-demo-state="pressed" onClick={() => notify('Pressed specimen activated.')}>Save changes</Button><span>Pressed specimen</span></div>
                  <div className="state"><Button disabled>Save changes</Button><span>Disabled</span></div>
                  <div className="state"><Button busy onClick={() => notify('Busy button dispatched unexpectedly.')}>Saving…</Button><span>Busy specimen</span></div>
                </div>
                <p className="note">Busy keeps its accessible name and position. Guard activation as well as styling.</p>
                <div className="button-row" style={{ marginTop: 24 }}><Button onClick={() => notify('Example secondary action completed.')}>Secondary</Button><Button variant="quiet" onClick={() => notify('Example details opened.')}>Quiet action</Button><Button variant="danger" onClick={() => setDialog('delete')}>Delete example</Button></div>
              </section>
              <section className="spec-block" data-parity="fields" data-reference="#page-components .spec-block:nth-child(2)"><h2>Fields &amp; validation</h2>
                <form id="example-form" noValidate className="field-stack" onSubmit={event => { event.preventDefault(); const invalid = !projectName.trim(); setProjectError(invalid); if (invalid) document.getElementById('project-name')?.focus(); else notify('Example saved.'); }}>
                  <TextField id="project-name" label="Project name" value={projectName} onChange={event => setProjectName(event.target.value)} helperText="Use a name people can recognize." errorText={projectError ? 'Enter a project name before saving.' : undefined} required />
                  <TextField id="invalid-example" label="Sample rate" value="fast" readOnly errorText="Example error: enter a number and unit, such as 2 MS/s." />
                  <Checkbox label="Include source references" defaultChecked />
                  <div><Button variant="primary" type="submit">Save example</Button></div>
                </form>
              </section>
              <section className="spec-block" data-parity="feedback" data-reference="#page-components .spec-block:nth-child(3)"><h2>Status &amp; feedback</h2>
                <div className="status-list"><StatusBadge tone="success" icon={<Icon name="check" />}>Completed</StatusBadge><StatusBadge tone="warning" icon={<Icon name="warning" />}>Needs review</StatusBadge><StatusBadge tone="danger" icon={<Icon name="error" />}>Failed</StatusBadge><StatusBadge tone="info" icon={<Icon name="info" />}>Queued</StatusBadge><StatusBadge>Unknown</StatusBadge></div>
                <div className="callout-stack"><Callout tone="warning" title="Source needs review" icon={<Icon name="warning" />}><p>This statement has a source, but has not been checked by a reviewer.</p></Callout><Callout tone="danger" title="Could not save changes" icon={<Icon name="error" />}><p>Your input is still here. Check the connection and try again.</p></Callout></div>
              </section>
              <section className="spec-block" data-parity="disclosure" data-reference="#page-components .spec-block:nth-child(4)"><h2>Disclosure &amp; overlays</h2>
                <div className="button-row"><Button onClick={() => setDrawer(true)}>Inspect source</Button><Button onClick={() => setDialog('save')}>Open dialog</Button></div>
                <Disclosure summary="Technical details" style={{ marginTop: 16 }}><p className="small muted">IDs and diagnostic values stay available without occupying the main reading path.</p><code>example:source-0042</code></Disclosure>
                <p className="note">Dialog and drawer: focus inside, Escape closes, focus returns to the opener.</p>
                <div className="progress-head" style={{ marginTop: 28 }}><span>Example operation</span><span className="mono">64%</span></div><Progress value={64} max={100} label="Example operation progress" />
              </section>
              <section className="spec-block full-span" data-parity="table" data-reference="#page-components .spec-block:nth-child(5)"><h2>Search, data &amp; an honest empty state</h2>
                <div style={{ maxWidth: 360, marginBottom: 24 }}><TextField id="component-search" label="Find a reference" type="search" placeholder="Search by title or type" value={query} onChange={event => setQuery(event.target.value)} /></div>
                <p id="result-count" className="small muted" role="status">{`${filtered.length} reference${filtered.length === 1 ? '' : 's'}`}</p>
                <div hidden={filtered.length === 0}>
                  <Table id="reference-table" label="Search results"><thead><tr><th aria-sort={sort}><button id="sort-title" type="button" onClick={() => setSort(sort === 'ascending' ? 'descending' : 'ascending')}>Title <span aria-hidden="true">{sort === 'none' ? '↕' : sort === 'ascending' ? '↑' : '↓'}</span></button></th><th>Type</th><th>Status</th><th className="numeric">Sources</th></tr></thead><tbody>{filtered.map(row => <tr key={row.title}><td><Button variant="quiet" onClick={() => setDrawer(true)}>{row.title}</Button></td><td>{row.type}</td><td><StatusBadge tone={row.tone}>{row.status}</StatusBadge></td><td className="numeric">{row.sources}</td></tr>)}</tbody></Table>
                </div>
                <div id="search-empty" hidden={filtered.length !== 0} data-parity="empty" data-reference="#search-empty"><EmptyState title="No matching references" icon={<Icon name="search" />} action={<Button id="clear-search" onClick={() => { setQuery(''); document.getElementById('component-search')?.focus(); }}>Clear search</Button>}>Try a broader title or clear the search.</EmptyState></div>
              </section>
            </div>
          </section>
          <section className="page" id="page-reading" hidden={page !== 'reading'} aria-labelledby="reading-title">
            <div className="breadcrumbs">Librarian <span aria-hidden="true">/</span> Research methods <span aria-hidden="true">/</span> Capture notes</div>
            <header className="reading-header"><div className="eyebrow">Reading pattern / sample article</div><h1 id="reading-title" tabIndex={-1}>From signal capture<br />to a useful lab note.</h1><p className="summary">Record what you observed, keep the original evidence, and make the next investigation easier to start.</p><div className="metadata"><StatusBadge>Draft example</StatusBadge><span>29 October 2026</span><span>Research methods</span><span>Illustrative content</span></div></header>
            <div data-parity="reading-tabs" data-reference="#page-reading .tl-tabs">
              <Tabs label="Article views" items={[
                { id: 'article', label: 'Article', panel: <>
                  <Disclosure className="inline-toc" summary="On this page"><p><Link href="#observation">Start with the observation</Link><br /><Link href="#evidence">Keep the evidence close</Link><br /><Link href="#next-step">Leave a useful next step</Link></p></Disclosure>
                  <div className="article-layout"><article className="prose">
                    <h2 id="observation">Start with the observation</h2><p>A useful note tells the next reader what happened, under which conditions, and where the evidence lives. Keep the observation separate from the explanation you are testing.</p>
                    <p>For this sample, the capture contains a repeating burst. The note records the receiver settings and a timestamp, while the original recording remains attached as a source.<Button className="citation" onClick={() => setDrawer(true)} aria-label="Inspect source 1">[1]</Button></p>
                    <Callout title="Evidence is available. Interpretation is provisional." icon={<Icon name="info" />}><p>A linked source establishes provenance. Review status is a separate field.</p></Callout>
                    <h2 id="evidence">Keep the evidence close</h2><p>Use a concise summary for orientation, then let readers inspect the exact passage or artifact when they need it.</p>
                    <div data-parity="code" data-reference="#panel-article pre"><CodeBlock label="Example capture metadata">{captureMetadata}</CodeBlock></div>
                    <h2 id="next-step">Leave a useful next step</h2><p>State what remains uncertain and what would resolve it. Preserve the previous note when new evidence changes the conclusion.</p>
                    <div className="related"><div className="eyebrow" style={{ marginBottom: 12 }}>Related knowledge</div><Link href="#components">Writing clear status messages</Link><p>Related by method: both distinguish observed state from interpretation.</p></div>
                  </article><aside className="toc" aria-label="On this page"><strong>On this page</strong><Link href="#observation">The observation</Link><Link href="#evidence">The evidence</Link><Link href="#next-step">The next step</Link><hr /><span className="muted">Reading measure<br />Up to 740 px</span></aside></div>
                </> },
                { id: 'sources', label: <>Sources <span className="small">2</span></>, panel: <><h2>Sources</h2><p className="muted">Synthetic references for this design example.</p><div className="spec-block"><h3>Capture record</h3><p>Original recording metadata with acquisition context.</p><Button onClick={() => setDrawer(true)}>Inspect passage</Button></div><div className="spec-block"><h3>Investigation note</h3><p>A separate note that records the unresolved interpretation.</p><Button onClick={() => setDrawer(true)}>Inspect source example</Button></div></> },
                { id: 'history', label: 'History', panel: <><h2>Revision history</h2><p className="muted">Example entries. No real reviewer attribution.</p><Table label="Revision history"><thead><tr><th>Revision</th><th>Change</th><th>State</th></tr></thead><tbody><tr><td className="mono">r2</td><td>Clarified uncertainty and next step</td><td>Current draft</td></tr><tr><td className="mono">r1</td><td>Added observation and capture reference</td><td>Previous draft</td></tr></tbody></Table></> },
              ]} />
            </div>
          </section>
          <section className="page" id="page-extended" hidden={page !== 'extended'} aria-labelledby="extended-title">
            <div className="page-intro"><div><div className="eyebrow">Additional library contracts</div><h1 id="extended-title" tabIndex={-1}>Extended controls.</h1><p className="lede">Radio groups and switches are not illustrated in the designer gallery. These specimens exercise their public React contracts separately from the visual parity specimens.</p></div></div>
            <div className="component-grid">
              <section className="spec-block"><h2>Radio &amp; switch</h2><div className="field-stack">
                <RadioGroup label="Capture format" helperText="Choose one format for the next capture."><Radio name="capture-format" value="raw" label="Raw recording" defaultChecked /><Radio name="capture-format" value="processed" label="Processed samples" /><Radio name="capture-format" value="unavailable" label="Unavailable format" disabled /></RadioGroup>
                <Switch id="live-updates" label="Live updates" helperText="Apply incoming updates immediately." checked={liveUpdates} onChange={event => setLiveUpdates(event.target.checked)} />
                <Checkbox label="All sources" indeterminate /><Checkbox label="Locked reference" checked disabled />
              </div></section>
              <section className="spec-block"><h2>Theme &amp; density</h2><div className="field-stack">
                <Select id="theme-preference" label="Theme preference" value={theme} onChange={event => setTheme(event.target.value as 'system' | 'light' | 'dark')}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></Select>
                <p className="small muted">Resolved theme: {resolvedTheme}. Density: {density}. Choices persist locally when browser storage is available.</p><div><Button onClick={reset}>Reset appearance</Button></div>
                <TextField label="Read-only identifier" value="example:source-0042" readOnly /><TextField label="Unavailable field" value="Disconnected" disabled />
              </div></section>
              <section className="spec-block full-span"><h2>Manual tabs</h2><Tabs label="Manual activation example" activation="manual" value={manualTab} onValueChange={setManualTab} items={[{ id: 'summary', label: 'Summary', panel: <p>Summary is selected. Arrow keys move focus; Enter or Space activates a tab.</p> }, { id: 'diagnostics', label: 'Diagnostics', panel: <CodeBlock label="Example diagnostic values">{'source: example-0042\nstate: available'}</CodeBlock> }, { id: 'unavailable', label: 'Unavailable', disabled: true, panel: <p>Unavailable content.</p> }]} /></section>
              <section className="spec-block"><h2>Inspector &amp; notifications</h2><div className="button-row"><Button onClick={() => setInspector(true)}>Open nonmodal inspector</Button><Button id="show-toast" onClick={() => notify('Example action completed.')}>Show notification</Button><Button id="open-dialog" onClick={() => setDialog('save')}>Open confirmation</Button></div><p className="note">Notifications last eight seconds and pause on hover or focus. The result below remains after dismissal. The nonmodal inspector does not trap focus.</p><p id="last-result" role="status">{lastResult}</p></section>
              <section className="spec-block"><h2>Additional feedback</h2><div className="callout-stack"><Callout tone="success" title="References included" icon={<Icon name="check" />}><p>The saved note includes its source references.</p></Callout><Callout title="Inspect the source" icon={<Icon name="info" />} action={<Button onClick={() => setDrawer(true)}>Inspect source</Button>}><p>Review the evidence before changing its status.</p></Callout></div><div className="progress-head" style={{ marginTop: 28 }}><span>Waiting for measured progress</span></div><Progress label="Waiting for measured progress" /></section>
              <section className="spec-block full-span"><h2>Links</h2><div className="button-row"><Link variant="primary" href="../../index.html#components">Explore components</Link><Link variant="quiet" href="../../index.html#workspace">See it at work</Link><Link href="../../index.html#reading">Read the designer reference</Link></div></section>
            </div>
          </section>
          <footer className="status-foot"><span>React specimens import the public library entry. No remote assets or services.</span><div><Link href="#components" onClick={() => navigate('components')}>Components</Link>{' · '}<Link href="#reading" onClick={() => navigate('reading')}>Reading</Link>{' · '}<Link href="#extended" onClick={() => navigate('extended')}>Extended controls</Link>{' · '}<Link href={`../../index.html#${page === 'extended' ? 'components' : page}`}>Designer reference</Link></div></footer>
        </main>
      </div>
    </div>
    <Dialog open={dialog === 'save'} title="Save this example?" closeLabel="Close dialog" onRequestClose={() => setDialog(null)} actions={<><Button autoFocus onClick={() => setDialog(null)}>Cancel</Button><Button variant="primary" onClick={() => { setDialog(null); notify('Example saved.'); }}>Save example</Button></>}><p>This demonstrates a normal confirmation. No project data will be changed.</p></Dialog>
    <Dialog open={dialog === 'delete'} title="Delete the example note?" description="This demonstration shows a destructive action. A real dialog must name the item and explain whether it can be restored." onRequestClose={() => setDialog(null)} actions={<><Button autoFocus onClick={() => setDialog(null)}>Keep note</Button><Button variant="danger" onClick={() => { setDialog(null); notify('Example note deleted.'); }}>Delete example note</Button></>} />
    <Drawer modal open={drawer} title="Capture record" eyebrow="Source / example 01" closeLabel="Close source" onRequestClose={() => setDrawer(false)}>{sourceContent}</Drawer>
    <Drawer modal={false} open={inspector} title="Capture record" eyebrow="Source / example 01" closeLabel="Close inspector" onRequestClose={() => setInspector(false)}>{sourceContent}</Drawer>
    <Toast open={toast !== ''} message={toast} duration={8000} onDismiss={() => setToast('')} />
  </>;
}

// Deterministic comparison URLs seed the same preferences consumed by ThemeProvider.
// This runs once, so subsequent theme/density controls remain fully interactive.
const fixtureParameters = new URLSearchParams(window.location.search);
try {
  const theme = fixtureParameters.get('theme');
  const density = fixtureParameters.get('density');
  if (theme === 'light' || theme === 'dark' || theme === 'system') localStorage.setItem('tl-theme', theme);
  if (density === 'comfortable' || density === 'compact') localStorage.setItem('tl-density', density);
} catch {
  // The provider still works in memory when browser storage is unavailable.
}

const root = document.getElementById('root');
if (!root) throw new Error('The showcase requires a root element.');
createRoot(root).render(<StrictMode><ThemeProvider><App /></ThemeProvider></StrictMode>);
