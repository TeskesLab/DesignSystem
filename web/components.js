/* Small reference behaviors. Framework adapters may implement the same contract. */
(function () {
  'use strict';
  const openers = new WeakMap();
  let toastTimer;
  function announce(message) {
    const region = document.getElementById('announcer');
    region.textContent = '';
    requestAnimationFrame(() => { region.textContent = message; });
  }
  function toast(message) {
    clearTimeout(toastTimer);
    document.getElementById('toast-message').textContent = message;
    document.getElementById('toast').hidden = false;
    announce(message);
    toastTimer = setTimeout(() => { document.getElementById('toast').hidden = true; }, 8000);
  }
  function openDialog(dialog, opener) {
    openers.set(dialog, opener || document.activeElement);
    dialog.showModal();
    const focusTarget = dialog.classList.contains('tl-drawer')
      ? dialog.querySelector('h2') : dialog.querySelector('[autofocus]');
    if (focusTarget) focusTarget.focus();
  }
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('close', () => {
      const opener = openers.get(dialog);
      if (opener && opener.isConnected) opener.focus();
    });
    dialog.querySelectorAll('[data-close]').forEach(button => {
      button.addEventListener('click', () => dialog.close());
    });
  });
  document.addEventListener('click', event => {
    const disabled = event.target.closest('[aria-disabled="true"]');
    if (disabled) { event.preventDefault(); return; }
    const opener = event.target.closest('[data-open]');
    if (opener) openDialog(document.getElementById(opener.dataset.open), opener);
    const notice = event.target.closest('[data-toast]');
    if (notice) toast(notice.dataset.toast);
  });
  document.getElementById('toast-close').addEventListener('click', () => {
    document.getElementById('toast').hidden = true;
  });
  document.querySelectorAll('[role="tablist"]').forEach(list => {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    function activate(tab, focus) {
      tabs.forEach(item => {
        const active = item === tab;
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
        document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
      });
      if (focus) tab.focus();
    }
    list.addEventListener('click', event => {
      const tab = event.target.closest('[role="tab"]');
      if (tab) activate(tab, false);
    });
    list.addEventListener('keydown', event => {
      const current = tabs.indexOf(document.activeElement);
      if (current < 0) return;
      let target = current;
      if (event.key === 'ArrowRight') target = (current + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') target = (current + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = tabs.length - 1;
      else return;
      event.preventDefault();
      // Automatic activation is appropriate here because panels are already local.
      activate(tabs[target], true);
    });
  });
  window.TL = { announce, toast, openDialog };
})();
