/* Run with node tests/browser.cjs. See README for browser/dependency configuration. */
const fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = path.resolve(__dirname,'..');
const playwrightPath = process.env.PLAYWRIGHT_MODULE || 'playwright';
const {chromium} = require(playwrightPath);
const base = 'file://'+path.join(ROOT,'index.html');
const results = [], errors=[], snapshots=process.argv.includes('--capture') ? [] : JSON.parse(fs.readFileSync(path.join(ROOT,'references/manifest.json'),'utf8'));
const record = (name, detail='') => results.push({name,passed:true,detail});
(async()=>{
 const browser = await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 const remote=[];
 page.on('request',req=>{if(/^https?:/.test(req.url()))remote.push(req.url());});
 async function visit(section,theme='light',width=1440,density='comfortable'){
  await page.setViewportSize({width,height:1100});
  await page.goto(base+'?theme='+theme+'&density='+density+'#'+section);
  await page.evaluate(()=>document.fonts.ready);
 }
 for (const width of [320,390,768,1024,1440]) for(const theme of ['light','dark']) for(const section of ['overview','components','reading','workspace','rules']){
  await visit(section,theme,width);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  assert(!overflow,'Document overflow: '+[width,theme,section].join('/'));
  assert.equal(await page.locator('h1:visible').count(),1);
  record('Reflow '+width+'/'+theme+'/'+section);
 }
 await visit('components');
 assert(await page.evaluate(()=>[...document.fonts].every(f=>f.status==='loaded')));
 record('Bundled fonts loaded');
 await page.locator('#project-name').fill('');
 await page.locator('#example-form button[type="submit"]').click();
 assert.equal(await page.locator('#project-name').getAttribute('aria-invalid'),'true');
 assert(await page.locator('#project-name').evaluate(e=>e===document.activeElement));
 await page.locator('#project-name').fill('Revisão do laboratório');
 await page.locator('#example-form button[type="submit"]').click();
 assert.equal(await page.locator('#project-name').getAttribute('aria-invalid'),'false');
 record('Form error, focus, correction');
 await page.locator('#component-search').fill('nonexistent-match');
 assert(await page.locator('#search-empty').isVisible());
 await page.locator('#clear-search').click();
 assert.equal(await page.locator('#reference-table tbody tr:visible').count(),3);
 await page.locator('#sort-title').click();
 assert((await page.locator('#reference-table tbody tr').first().innerText()).includes('Antenna'));
 record('Search, empty, clear, and sorting');
 const opener=page.locator('[data-open="example-dialog"]');
 await opener.click();
 assert(await page.locator('#example-dialog').isVisible());
 assert(await page.locator('#example-dialog').evaluate(e=>e.contains(document.activeElement)));
 for(let i=0;i<8;i++)await page.keyboard.press('Tab');
 assert(await page.locator('#example-dialog').evaluate(e=>e.contains(document.activeElement)));
 await page.keyboard.press('Escape');
 assert(await opener.evaluate(e=>e===document.activeElement));
 record('Modal focus containment, Escape, restoration');
 await visit('reading');
 await page.locator('#tab-article').focus();await page.keyboard.press('ArrowRight');
 assert.equal(await page.locator('#tab-sources').getAttribute('aria-selected'),'true');
 assert(await page.locator('#panel-sources').isVisible());
 await page.keyboard.press('End');
 assert.equal(await page.locator('#tab-history').getAttribute('aria-selected'),'true');
 await page.keyboard.press('Home');
 await page.locator('.citation').click();
 assert(await page.locator('#source-drawer').isVisible());
 await page.keyboard.press('Escape');
 assert(await page.locator('.citation').evaluate(e=>e===document.activeElement));
 record('Tabs keyboard and source drawer');
 await visit('workspace','dark',1440,'compact');
 assert.equal(await page.locator('#start-job').evaluate(e=>Math.round(e.getBoundingClientRect().height)),32);
 await page.locator('#start-job').click();
 await page.waitForFunction(()=>document.getElementById('job-panel').dataset.state==='running');
 assert(await page.locator('#start-job').isDisabled());
 assert(await page.locator('#start-job').evaluate(e=>{ const probe=document.createElement('span'); probe.style.backgroundColor='var(--tl-disabled-bg)'; document.body.append(probe); const expected=getComputedStyle(probe).backgroundColor; probe.remove(); return getComputedStyle(e).backgroundColor===expected; }));
 await page.locator('#cancel-job').click();
 assert.equal(await page.locator('#job-panel').getAttribute('data-state'),'cancel_requested');
 await page.waitForFunction(()=>document.getElementById('job-panel').dataset.state==='cancelled');
 record('Job cancellation waits for acknowledgement');
 await page.locator('#job-outcome').selectOption('failed');await page.locator('#start-job').click();
 await page.waitForFunction(()=>document.getElementById('job-panel').dataset.state==='failed');
 assert((await page.locator('#job-detail').innerText()).includes('Partial output'));
 record('Job failure preserves partial-output explanation');
 await page.locator('#job-outcome').selectOption('unknown');await page.locator('#start-job').click();
 await page.waitForFunction(()=>document.getElementById('job-panel').dataset.state==='unknown');
 assert(await page.locator('#start-job').isDisabled());
 assert(!(await page.locator('#job-progress').isVisible()));
 await page.locator('#reconnect-job').click();
 assert.equal(await page.locator('#job-panel').getAttribute('data-state'),'completed');
 record('Lost connection and reconciliation');
 await page.locator('#job-outcome').selectOption('completed');await page.locator('#start-job').click();
 await page.waitForFunction(()=>document.getElementById('job-panel').dataset.state==='completed');
 assert.equal(await page.locator('#job-progress').getAttribute('value'),'100');
 record('Successful simulated job');
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export-buffer').click()]);
 assert.equal(fs.statSync(await download.path()).size,128);
 record('Sample export is exactly 128 bytes');
 await page.locator('#theme-toggle').click();await page.reload();
 assert.equal(await page.locator('html').getAttribute('data-theme'),'dark'); // URL override wins over saved preference.
 record('Explicit theme URL is deterministic');
 await visit('workspace','light',390,'compact');
 assert(await page.locator('#start-job').evaluate(e=>e.getBoundingClientRect().height>=44));
 await page.locator('#nav-open').click();await page.locator('#nav-dialog a[href="#reading"]').click();
 await page.locator('#reading-title').waitFor({state:'visible'});
 assert(await page.locator('#reading-title').isVisible());
 record('Narrow targets and mobile navigation');
 await visit('components');
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await page.locator('.spinner').evaluate(e=>getComputedStyle(e).animationName),'none');
 record('Reduced motion removes animation');
 let axeSummary={available:false};
 if(process.env.AXE_MODULE){
  const axe=require(process.env.AXE_MODULE);const violations=[];
  for(const theme of ['light','dark'])for(const section of ['overview','components','reading','workspace','rules']){
   await visit(section,theme);await page.addScriptTag({content:axe.source});
   const scan=await page.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));
   violations.push(...scan.violations.map(v=>({section,theme,id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));
  }
  axeSummary={available:true,version:axe.version,violations};
  assert.equal(violations.length,0,JSON.stringify(violations,null,2));
  record('axe checks across five pages and two themes');
 }
 if(process.argv.includes('--capture')){
  for(const theme of ['light','dark'])for(const section of ['overview','components','reading','workspace']){
   await visit(section,theme,1440,section==='workspace'?'compact':'comfortable');
   if(section==='workspace'){await page.locator('#start-job').click();await page.waitForFunction(()=>document.getElementById('job-progress').value>=40);await page.evaluate(()=>{document.getElementById('job-state').textContent='Reading sample';});}
   const name=section+'-'+theme+'-1440.png';
   await page.evaluate(()=>document.activeElement.blur());
   await page.screenshot({path:path.join(ROOT,'references',name),fullPage:section==='components'});
   snapshots.push({file:name,width:1440,height:1100,theme,density:section==='workspace'?'compact':'comfortable',fullPage:section==='components'});
  }
  for(const section of ['reading','workspace']){
   await visit(section,'light',390);
   const name=section+'-light-390.png';await page.evaluate(()=>document.activeElement.blur());
   await page.screenshot({path:path.join(ROOT,'references',name),fullPage:true});
   snapshots.push({file:name,width:390,height:1100,theme:'light',density:'comfortable',fullPage:true});
  }
  await visit('reading','dark');
  await page.locator('.citation').click();
  await page.screenshot({path:path.join(ROOT,'references/source-drawer-dark-1440.png')});
  snapshots.push({file:'source-drawer-dark-1440.png',width:1440,height:1100,theme:'dark',density:'comfortable'});
 }
 assert.equal(errors.length,0,JSON.stringify(errors));
 assert.equal(remote.length,0,'Reference made remote requests');
 record('No JavaScript errors or network requests');
 const report={version:'1.0.0',browser:await browser.version(),playwright:require(path.join(playwrightPath,'package.json')).version,date:'2026-10-29',results,axe:axeSummary,snapshots,limitations:['No native application builds','No assistive-technology manual test','Not a product accessibility certification']};
 fs.writeFileSync(path.join(ROOT,'validation/browser.json'),JSON.stringify(report,null,2)+'\n');
 if(process.argv.includes('--capture')) fs.writeFileSync(path.join(ROOT,'references/manifest.json'),JSON.stringify(snapshots,null,2)+'\n');
 console.log(JSON.stringify({passed:results.length,browser:report.browser,axe:axeSummary.available,screenshots:snapshots.length},null,2));
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
