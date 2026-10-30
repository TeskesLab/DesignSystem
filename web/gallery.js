(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  function stored(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function persist(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  const preferred = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const chosenTheme = params.get('theme') || stored('tl-theme') || preferred;
  const chosenDensity = params.get('density') || stored('tl-density') || 'comfortable';
  const names = { overview:'Foundations', components:'Components', reading:'Reading pattern', workspace:'Technical workspace', rules:'Build & validate' };
  let currentPage = '';
  function route() {
    const requested = location.hash.slice(1) || 'overview';
    if (!names[requested]) {
      const target = $(requested);
      if (target) {
        const page = target.closest('.page');
        if (page) display(page.id.replace('page-', ''), false);
        requestAnimationFrame(() => target.scrollIntoView({block:'start'}));
      }
      return;
    }
    display(requested, true);
  }
  function display(name, focus) {
    document.querySelectorAll('.page').forEach(page => { page.hidden = page.id !== 'page-'+name; });
    document.querySelectorAll('.nav-links a').forEach(link => {
      if (link.hash === '#'+name) link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
    $('current-context').textContent = names[name];
    document.title = names[name] + ' · Teske’s Lab Design System';
    if (currentPage !== name && focus) {
      window.scrollTo(0,0);
      if (currentPage) $('page-'+name).querySelector('h1').focus({preventScroll:true});
    }
    currentPage = name;
  }
  function setTheme(mode) {
    root.dataset.theme = mode;
    $('theme-label').textContent = mode === 'light' ? 'Light' : 'Dark';
    $('theme-toggle').setAttribute('aria-label', 'Switch to '+(mode === 'light' ? 'dark' : 'light')+' theme');
    renderTokens();
  }
  function renderTokens() {
    const colors = window.TL_TOKENS.themes[root.dataset.theme];
    const rows = [
      ['surface-page','Main reading or work surface'],['surface-raised','Inputs, dialogs, and insets'],
      ['text-primary','Readable content'],['text-link','Links and selected tab labels'],
      ['control-border','Identifiable field boundaries'],['focus-ring','Keyboard focus'],
      ['status-warning-text','Warnings with a matching background']
    ];
    $('token-rows').replaceChildren(...rows.map(([name,usage]) => {
      const row = document.createElement('tr');
      const role = document.createElement('td'); const code = document.createElement('code'); code.textContent = name; role.append(code);
      const value = document.createElement('td'); const chip = document.createElement('span'); chip.className = 'token-chip'; chip.style.background = colors[name]; chip.setAttribute('aria-hidden','true'); value.append(chip, colors[name].toUpperCase());
      const use = document.createElement('td'); use.textContent = usage;
      row.append(role,value,use); return row;
    }));
  }
  setTheme(['light','dark'].includes(chosenTheme) ? chosenTheme : preferred);
  root.dataset.density = chosenDensity === 'compact' ? 'compact' : 'comfortable';
  $('density').value = root.dataset.density;
  $('theme-toggle').addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    setTheme(next); persist('tl-theme', next);
  });
  $('density').addEventListener('change', () => {
    root.dataset.density = $('density').value; persist('tl-density',$('density').value);
  });
  $('nav-open').addEventListener('click', () => TL.openDialog($('nav-dialog'), $('nav-open')));
  $('nav-dialog').querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      $('nav-dialog').close();
      setTimeout(() => $('page-'+link.hash.slice(1)).querySelector('h1').focus(),0);
    });
  });
  window.addEventListener('hashchange',route);
  route();
  [4,8,12,16,24,32,48,64].forEach(value => {
    const item = document.createElement('div'); item.className='space-unit';
    const bar = document.createElement('span'); bar.className='space-bar'; bar.style.height=value+'px';
    item.append(bar, String(value)); $('spacing-scale').append(item);
  });
  $('example-form').addEventListener('submit', event => {
    event.preventDefault();
    const valid = $('project-name').value.trim().length > 0;
    $('project-error').hidden = valid; $('project-name').setAttribute('aria-invalid',String(!valid));
    if (!valid) { $('project-name').focus(); TL.announce('Enter a project name before saving.'); }
    else TL.toast('Example saved. No project data was changed.');
  });
  for (const [button,dialog,message] of [
    ['confirm-example','example-dialog','Example saved. No project data was changed.'],
    ['confirm-delete','delete-dialog','Deletion preview completed. No note was removed.'],
    ['confirm-erase','erase-dialog','Erase preview completed. No hardware command was sent.']
  ]) $(button).addEventListener('click', () => { $(dialog).close(); TL.toast(message); });
  function filterReferences() {
    const query = $('component-search').value.trim().toLocaleLowerCase();
    let count = 0;
    $('reference-table').querySelectorAll('tbody tr').forEach(row => {
      row.hidden = !row.textContent.toLocaleLowerCase().includes(query);
      if (!row.hidden) count++;
    });
    $('reference-table').hidden = count === 0; $('search-empty').hidden = count !== 0;
    $('result-count').textContent = count+' reference'+(count === 1 ? '' : 's');
  }
  $('component-search').addEventListener('input',filterReferences);
  $('clear-search').addEventListener('click', () => { $('component-search').value=''; filterReferences(); $('component-search').focus(); });
  let ascending = true;
  $('sort-title').addEventListener('click', () => {
    const tbody = $('reference-table').querySelector('tbody');
    [...tbody.rows].sort((a,b) => a.cells[0].textContent.localeCompare(b.cells[0].textContent)*(ascending?1:-1)).forEach(row=>tbody.append(row));
    $('sort-title').parentElement.setAttribute('aria-sort',ascending?'ascending':'descending');
    TL.announce('Sorted by title, '+(ascending?'ascending':'descending'));
    ascending = !ascending;
  });
  const bytes = Uint8Array.from({length:128},(_,i) => i < 16 ? [84,69,83,75,69,83,32,76,65,66,32,68,69,77,79,0][i] : (i*37+19)%256);
  for (let offset=0;offset<bytes.length;offset+=16) {
    const row = bytes.slice(offset,offset+16);
    const address = document.createElement('span'); address.className='offset'; address.textContent=offset.toString(16).padStart(8,'0').toUpperCase();
    const ascii = document.createElement('span'); ascii.className='ascii'; ascii.textContent=Array.from(row,x=>x>=32&&x<127?String.fromCharCode(x):'.').join('');
    $('hex-content').append(address, '  '+Array.from(row,x=>x.toString(16).padStart(2,'0').toUpperCase()).join(' ')+'  ',ascii,'\n');
  }
  $('export-buffer').addEventListener('click', () => {
    const blob = new Blob([bytes],{type:'application/octet-stream'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href=url;a.download='teskes-lab-example-128bytes.bin';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000); TL.toast('Exported the 128-byte synthetic sample.');
  });
  let timer = null, state = 'idle', progress=0, jobNumber=0, started=0, outcome='completed';
  const terminal = new Set(['completed','cancelled','failed']);
  function updateJob(next, detail) {
    state=next; $('job-panel').dataset.state=state;
    const labels = {idle:'Ready to simulate',queued:'Queued',running:'Reading sample',cancel_requested:'Cancellation requested',cancelled:'Cancelled',completed:'Completed',failed:'Read failed',unknown:'Status unknown'};
    $('job-state').textContent = labels[state]; $('job-detail').textContent=detail;
    $('job-percent').textContent = state==='unknown' ? '—' : progress+'%';
    if (state==='unknown') { $('job-progress').hidden=true; } else { $('job-progress').hidden=false; $('job-progress').value=progress; }
    const busy = ['queued','running','cancel_requested','unknown'].includes(state);
    $('start-job').disabled=busy; $('job-outcome').disabled=busy;
    $('cancel-job').disabled=!['queued','running'].includes(state);
    $('reconnect-job').hidden=state!=='unknown';
    TL.announce(labels[state]+'. '+detail);
    if (terminal.has(state)) addHistory(labels[state]);
  }
  function addHistory(label) {
    const row=document.createElement('tr');
    const duration=((Date.now()-started)/1000).toFixed(1)+' s';
    ['Read sample','Socket A',label,duration].forEach((text,i) => { const td=document.createElement('td');td.textContent=text;if(i===3)td.className='numeric mono';row.append(td); });
    $('job-history').prepend(row);
  }
  function tick() {
    if (state !== 'running') return;
    progress+=10; $('job-progress').value=progress; $('job-percent').textContent=progress+'%';
    if (progress===60&&outcome!=='completed') {
      clearInterval(timer);
      if(outcome==='failed') updateJob('failed','Simulated read error. Partial output is not a complete backup. Start a new simulation to retry.');
      else updateJob('unknown','The simulated connection was lost. Reconcile before starting another operation.');
    } else if(progress>=100) {
      clearInterval(timer); updateJob('completed','Synthetic read finished. The sample export remains available.');
    }
  }
  $('start-job').addEventListener('click', () => {
    if(['queued','running','cancel_requested','unknown'].includes(state))return;
    clearInterval(timer); progress=0; started=Date.now(); outcome=$('job-outcome').value; jobNumber++;
    $('job-id').textContent='demo:'+String(jobNumber).padStart(4,'0');
    updateJob('queued','The synthetic operation is waiting to start.');
    timer=setTimeout(() => { if(state!=='queued')return; updateJob('running','Reading synthetic bytes. Cancellation is available.'); timer=setInterval(tick,400); },300);
  });
  $('cancel-job').addEventListener('click', () => {
    if(!['queued','running'].includes(state))return;
    clearInterval(timer); updateJob('cancel_requested','Waiting for the simulated worker to acknowledge cancellation.');
    timer=setTimeout(() => updateJob('cancelled','The simulated worker acknowledged cancellation. Partial data is not a complete backup.'),600);
  });
  $('reconnect-job').addEventListener('click', () => {
    progress=100; updateJob('completed','Reconciled demo result: the worker completed after the connection was lost.');
  });
  // The fixture deliberately performs no network, filesystem, or hardware operations.
})();
