/* Compare actual React output with the designer's independent HTML reference. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createHash } = require('node:crypto');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { PNG } = require('pngjs');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'validation/library');
fs.mkdirSync(output, { recursive: true });
const results = [], errors = [];
const properties = ['color', 'backgroundColor', 'borderTopColor', 'borderTopWidth', 'borderRadius', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'minHeight', 'gap'];
const pairs = [
  ...['primary', 'hover', 'focus', 'pressed', 'disabled', 'busy'].map((name, i) => [name, `.state:nth-child(${i + 1}) .tl-button`, `[data-parity="actions"] .state:nth-child(${i + 1}) .tl-button`]),
  ['field', '#project-name', '#project-name'],
  ['invalid', '#invalid-example', '#invalid-example'],
  ['checkbox', '#example-form .check-row', '#example-form .check-row'],
  ['badge', '#page-components .tl-badge.success', '[data-parity="feedback"] .tl-badge.success'],
  ['callout', '#page-components .tl-callout.warning', '[data-parity="feedback"] .tl-callout.warning'],
  ['disclosure', '#page-components details summary', '[data-parity="disclosure"] details summary'],
  ['progress', '#page-components progress', '[data-parity="disclosure"] progress'],
  ...['actions', 'fields', 'feedback', 'disclosure', 'table'].map((name, i) => [`${name}-block`, `#page-components .spec-block:nth-child(${i + 1})`, `[data-parity="${name}"]`]),
];
async function styles(locator) {
  return locator.evaluate((element, keys) => {
    const css = getComputedStyle(element);
    return Object.fromEntries(keys.map(key => [key, css[key]]));
  }, properties);
}
function difference(a, b) {
  const x = PNG.sync.read(a), y = PNG.sync.read(b);
  if (x.width !== y.width || x.height !== y.height) return { dimensions: [x.width, x.height, y.width, y.height], ratio: 1 };
  let changed = 0;
  for (let i = 0; i < x.data.length; i += 4) {
    if ([0, 1, 2].some(c => Math.abs(x.data[i + c] - y.data[i + c]) > 24)) changed++;
  }
  return { dimensions: [x.width, x.height], ratio: changed / (x.width * x.height) };
}
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
    const reference = await context.newPage(), library = await context.newPage();
    for (const page of [reference, library]) page.on('pageerror', error => errors.push(error.message));
    const referenceURL = pathToFileURL(path.join(root, 'index.html')).href;
    const libraryURL = pathToFileURL(path.join(root, 'examples/library/index.html')).href;
    for (const width of [390, 1440]) for (const theme of ['light', 'dark']) for (const density of ['comfortable', 'compact']) {
      const key = `${width}-${theme}-${density}`;
      for (const page of [reference, library]) await page.setViewportSize({ width, height: 1100 });
      await reference.goto(`${referenceURL}?theme=${theme}&density=${density}#components`);
      await library.goto(`${libraryURL}?theme=${theme}&density=${density}`);
      await library.waitForSelector('[data-parity="actions"]');
      for (const page of [reference, library]) {
        await page.evaluate(() => document.fonts.ready);
        await page.addStyleTag({ content: '*{caret-color:transparent!important}.spinner{animation:none!important}' });
      }
      await library.waitForFunction(({ theme, density }) => document.documentElement.dataset.theme === theme && document.documentElement.dataset.density === density, { theme, density });
      assert.equal(await library.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${key}: overflow`);
      for (const [name, refSelector, libSelector] of pairs) {
        const a = reference.locator(refSelector).first(), b = library.locator(libSelector).first();
        assert.deepEqual(await styles(b), await styles(a), `${key}/${name}: style mismatch`);
        results.push({ check: `${key}/${name}/styles`, passed: true });
        if (['primary', 'disabled', 'badge', 'callout'].includes(name) || name.endsWith('-block')) {
          const refPNG = await a.screenshot({ animations: 'disabled' }), libPNG = await b.screenshot({ animations: 'disabled' });
          const diff = difference(refPNG, libPNG);
          fs.writeFileSync(path.join(output, `${key}-${name}-reference.png`), refPNG);
          fs.writeFileSync(path.join(output, `${key}-${name}-react.png`), libPNG);
          results.push({ check: `${key}/${name}/pixels`, passed: diff.ratio === 0, ...diff });
        }
      }
      await library.evaluate(() => scrollTo(0, 0));
      await library.screenshot({ path: path.join(output, `${key}.png`), fullPage: true });
    }
    // Overlay dimensions and typography use the contract's comfortable density.
    for (const width of [390, 1440]) for (const theme of ['light', 'dark']) {
      const key = `${width}-${theme}`;
      for (const page of [reference, library]) await page.setViewportSize({ width, height: 1100 });
      await reference.goto(`${referenceURL}?theme=${theme}&density=comfortable#components`);
      await library.goto(`${libraryURL}?theme=${theme}&density=comfortable`);
      for (const page of [reference, library]) await page.evaluate(() => document.fonts.ready);
      for (const [name, refTrigger, libTrigger, refTarget, libTarget] of [
        ['dialog', '[data-open=example-dialog]', 'Open dialog', '#example-dialog', 'dialog[open]'],
        ['drawer', '[data-open=source-drawer]', 'Inspect source', '#source-drawer', 'dialog[open]'],
      ]) {
        await reference.locator(refTrigger).first().click();
        await library.getByRole('button', { name: libTrigger, exact: true }).click();
        const a = reference.locator(refTarget), b = library.locator(libTarget);
        await b.waitFor();
        for (const suffix of ['', ' h2', ' .dialog-head .icon-only']) {
          const x = reference.locator(refTarget + suffix), y = library.locator(libTarget + suffix);
          assert.deepEqual(await styles(y), await styles(x), `${key}/${name}${suffix}`);
        }
        const x = await a.boundingBox(), y = await b.boundingBox();
        assert(Math.abs(x.width - y.width) < 1 && Math.abs(x.height - y.height) < 1, `${key}/${name} geometry`);
        await b.screenshot({ path: path.join(output, `${key}-${name}.png`) });
        await reference.keyboard.press('Escape');
        await library.keyboard.press('Escape');
        results.push({ check: `${key}/${name}/geometry-and-styles`, passed: true });
      }
      await reference.locator('.state .tl-button').first().click();
      await library.locator('.state .tl-button').first().click();
      assert.deepEqual(await styles(library.locator('.tl-toast')), await styles(reference.locator('.tl-toast')));
      await library.locator('.tl-toast').screenshot({ path: path.join(output, `${key}-toast.png`) });
      results.push({ check: `${key}/toast/styles`, passed: true });
      await reference.goto(`${referenceURL}?theme=${theme}&density=comfortable#reading`);
      await library.goto(`${libraryURL}?theme=${theme}&density=comfortable#reading`);
      await library.locator('#page-reading').waitFor({ state: 'visible' });
      for (const selector of ['#page-reading .tl-tabs', '#page-reading [role=tab]', '#page-reading pre', '#page-reading code']) {
        assert.deepEqual(await styles(library.locator(selector).first()), await styles(reference.locator(selector).first()), `${key}/${selector}`);
      }
      await library.getByRole('tab', { name: 'Article', exact: true }).focus();
      await library.keyboard.press('ArrowRight');
      assert.equal(await library.getByRole('tab', { name: 'Sources 2', exact: true }).getAttribute('aria-selected'), 'true');
      results.push({ check: `${key}/tabs-and-code/styles-and-keyboard`, passed: true });
    }
    await library.setViewportSize({ width: 1440, height: 1100 });
    await library.goto(`${libraryURL}?theme=light&density=comfortable`);
    await library.locator('#project-name').fill('');
    await library.locator('#example-form button[type=submit]').click();
    assert.equal(await library.locator('#project-name').getAttribute('aria-invalid'), 'true');
    assert(await library.locator('#project-name').evaluate(e => e === document.activeElement));
    await library.locator('#project-name').fill('Revisão do laboratório');
    await library.locator('#example-form button[type=submit]').click();
    assert.notEqual(await library.locator('#project-name').getAttribute('aria-invalid'), 'true');
    results.push({ check: 'form validation, focus and correction', passed: true });
    const open = library.getByRole('button', { name: 'Open dialog', exact: true });
    await open.click();
    const dialog = library.locator('dialog[open]');
    await dialog.waitFor();
    for (let i = 0; i < 8; i++) await library.keyboard.press('Tab');
    assert(await dialog.evaluate(e => e.contains(document.activeElement)), 'Modal must contain focus');
    await library.keyboard.press('Escape');
    assert(await open.evaluate(e => e === document.activeElement), 'Modal must restore focus');
    results.push({ check: 'modal focus containment, Escape and restoration', passed: true });
    await library.locator('#component-search').fill('no-such-reference');
    assert(await library.locator('#search-empty').isVisible());
    await library.locator('#clear-search').click();
    assert.equal(await library.locator('#reference-table tbody tr').count(), 3);
    results.push({ check: 'search empty state and recovery', passed: true });
    await library.locator('[aria-busy=true]').evaluate(e => e.click());
    assert.notEqual(await library.locator('#last-result').textContent(), 'Busy button dispatched unexpectedly.');
    results.push({ check: 'busy activation suppression', passed: true });
    // Initial mount must remain open under React StrictMode's effect replay.
    await library.goto(`${libraryURL}?theme=light&density=compact&dialog=open`);
    await library.locator('dialog[open]').waitFor();
    assert.equal(await library.locator('dialog[open] .tl-button').first().evaluate(e => getComputedStyle(e).minHeight), '44px');
    await library.keyboard.press('Escape');
    await library.locator('dialog[open]').waitFor({ state: 'hidden' });
    results.push({ check: 'initial StrictMode dialog and comfortable modal density', passed: true });
    await library.goto(`${libraryURL}?theme=light#extended`);
    const manual = library.getByRole('tablist', { name: 'Manual activation example' });
    await manual.getByRole('tab', { name: 'Summary' }).focus();
    await library.keyboard.press('ArrowRight');
    assert.equal(await manual.getByRole('tab', { name: 'Summary' }).getAttribute('aria-selected'), 'true');
    await library.keyboard.press('Enter');
    assert.equal(await manual.getByRole('tab', { name: 'Diagnostics' }).getAttribute('aria-selected'), 'true');
    results.push({ check: 'manual tab focus and activation', passed: true });
    const inspector = library.getByRole('button', { name: 'Open nonmodal inspector' });
    await inspector.click();
    await library.getByRole('button', { name: 'Close inspector' }).click();
    assert(await inspector.evaluate(e => e === document.activeElement));
    results.push({ check: 'nonmodal drawer focus restoration', passed: true });
    await library.locator('#live-updates').focus();
    const checked = await library.locator('#live-updates').isChecked();
    await library.keyboard.press('Space');
    assert.equal(await library.locator('#live-updates').isChecked(), !checked);
    results.push({ check: 'switch keyboard activation', passed: true });
    await library.clock.install();
    await library.locator('#show-toast').click();
    await library.locator('.tl-toast').hover();
    await library.clock.runFor(9000);
    assert(await library.locator('.tl-toast').isVisible(), 'Hovered toast must persist');
    await library.mouse.move(0, 0);
    await library.clock.runFor(8001);
    assert.equal(await library.locator('.tl-toast').count(), 0, 'Toast must expire after hover ends');
    await library.locator('#show-toast').click();
    await library.clock.runFor(7000);
    assert(await library.locator('.tl-toast').isVisible(), 'Reopened toast must get full duration');
    await library.clock.runFor(1100);
    assert.equal(await library.locator('.tl-toast').count(), 0);
    results.push({ check: 'toast pause, expiry and reopen', passed: true });
    await library.emulateMedia({ colorScheme: 'light' });
    await library.locator('#theme-preference').selectOption('dark');
    await library.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    await library.goto(`${libraryURL}#extended`);
    await library.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    await library.getByRole('button', { name: 'Reset appearance' }).click();
    await library.waitForFunction(() => document.documentElement.dataset.theme === 'light');
    await library.emulateMedia({ colorScheme: 'dark' });
    await library.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    results.push({ check: 'theme persistence, reset and live system preference', passed: true });
    await library.setViewportSize({ width: 390, height: 844 });
    await library.getByRole('button', { name: 'Open navigation' }).click();
    await library.locator('dialog[open]').getByRole('link', { name: 'Components', exact: true }).click();
    await library.locator('dialog[open]').waitFor({ state: 'hidden' });
    await library.waitForFunction(() => document.activeElement?.id === 'components-title');
    results.push({ check: 'mobile menu close and destination focus', passed: true });
    for (const width of [320, 768, 1024]) for (const theme of ['light', 'dark']) for (const section of ['components', 'reading', 'extended']) {
      await library.setViewportSize({ width, height: 1100 });
      await library.goto(`${libraryURL}?theme=${theme}&density=compact#${section}`);
      await library.locator(`#page-${section}`).waitFor({ state: 'visible' });
      await library.evaluate(() => document.fonts.ready);
      assert.equal(await library.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${width}/${theme}/${section} reflow`);
      results.push({ check: `${width}/${theme}/${section}/reflow`, passed: true });
    }
    await library.setViewportSize({ width: 1440, height: 1100 });
    for (const theme of ['light', 'dark']) for (const section of ['components', 'reading', 'extended']) {
      await library.goto(`${libraryURL}?theme=${theme}&density=comfortable#${section}`);
      await library.locator(`#page-${section}`).waitFor({ state: 'visible' });
      await library.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      const scan = await library.evaluate(async () => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }));
      fs.writeFileSync(path.join(output, `${theme}-${section}-accessibility.json`), JSON.stringify(scan.violations, null, 2));
      assert.deepEqual(scan.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), [], `${theme}/${section} accessibility`);
      results.push({ check: `${theme}/${section}/automated-accessibility`, passed: true });
      await library.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      assert.equal(await library.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${theme}/${section} text resize`);
      results.push({ check: `${theme}/${section}/200-percent-text-reflow`, passed: true });
    }
    assert.deepEqual(errors, [], 'Browser errors');
    const sourceFiles = ['index.html', 'web/components.css', 'web/gallery.css', 'web/tokens.css', 'web/library.css', 'web/src/index.ts', 'web/src/controls.tsx', 'web/src/content.tsx', 'web/src/overlays.tsx', 'web/src/theme.tsx', 'examples/library/main.tsx', 'examples/library/showcase.css', 'package-lock.json'];
    const hashes = Object.fromEntries(sourceFiles.map(file => [file, createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')]));
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ browser: browser.version(), generatedAt: new Date().toISOString(), hashes, results, errors, limits: ['Component crops, not full-page pixel identity', 'Radio and switch have contracts but no designer specimens', 'No screen-reader certification or consumer integration'] }, null, 2) + '\n');
    const failed = results.filter(result => !result.passed);
    assert.equal(failed.length, 0, `Visual mismatches: ${JSON.stringify(failed)}`);
    fs.rmSync(path.join(output, 'failure.json'), { force: true });
    console.log(`${results.length} library parity and interaction checks passed. Evidence: validation/library/`);
  } finally { await browser.close(); }
})().catch(error => { fs.writeFileSync(path.join(output, 'failure.json'), JSON.stringify({ error: error.message, results, errors }, null, 2)); console.error(error); process.exitCode = 1; });
