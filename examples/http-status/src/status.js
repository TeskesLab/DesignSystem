(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('.theme-toggle');
  /* LOCALIZATION */
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  const language = languages.map(value => value?.toLowerCase().split('-')[0])
    .find(value => value === 'pt' || value === 'en') || 'en';
  if (language === 'pt') {
    const code = document.querySelector('.status-number').textContent.match(/\d+/)[0];
    const status = translations.statuses[code];
    const text = (selector, value) => {
      const element = document.querySelector(selector);
      if (element) element.textContent = value;
    };
    root.lang = 'pt-BR';
    document.title = `${code} · ${status.name} — Teske’s Lab`;
    document.querySelector('meta[name="description"]').content = `${code} ${status.name} — Teske’s Lab.`;
    text('.skip', translations.skip);
    document.querySelector('.identity').setAttribute('aria-label', translations.homeLabel);
    text('.header-label', translations.slogan);
    text('.status-line span:last-child', status.name);
    // This HTML comes only from the bundled translation file, never from the request.
    document.querySelector('h1').innerHTML = status.headline;
    text('.description', status.description);
    document.querySelectorAll('.actions a').forEach(link => {
      const label = link.getAttribute('href') === '' ? translations.retry : translations.home;
      link.firstChild.textContent = label;
    });
    text('.footer-code', `${code} / ${status.name.toUpperCase()}`);
    text('.art-caption', status.board);
    text('.chip-label', status.board);
    text('.board-label text:first-child', translations.module);
    text('.preview-label', translations.preview);
    const tray = document.querySelector('.preview-bar');
    if (tray) {
      tray.setAttribute('aria-label', translations.previewLabel);
      document.querySelector('.page-picker').setAttribute('aria-label', translations.pagesLabel);
      document.querySelectorAll('.page-picker a').forEach(link => {
        link.setAttribute('aria-label', `${link.textContent} ${translations.statuses[link.textContent].name}`);
      });
      document.querySelector('.download').lastChild.textContent = translations.download;
    }
  }
  const setTheme = theme => {
    root.dataset.theme = theme;
    if (toggle) toggle.setAttribute('aria-label', language === 'pt'
      ? translations[theme === 'dark' ? 'light' : 'dark']
      : `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  };
  let saved;
  try { saved = localStorage.getItem('teske-status-theme'); } catch (_) {}
  setTheme(saved === 'dark' || saved === 'light' ? saved : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      setTheme(next);
      try { localStorage.setItem('teske-status-theme', next); } catch (_) {}
    });
  }
})();
