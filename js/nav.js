/* Everyride v41: header + full-screen menu (Apple / Tesla style). Shared by every page. */
(() => {
  'use strict';
  const btn = document.getElementById('menu-btn');
  const menu = document.getElementById('menu');
  if (!btn || !menu) return;
  const root = document.documentElement;
  const desktop = matchMedia('(min-width: 861px)');
  let lastFocus = null;

  const isOpen = () => menu.classList.contains('open');

  function set(open) {
    if (open === isOpen()) return;
    menu.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    root.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) { menu.removeAttribute('inert'); lastFocus = document.activeElement; menu.querySelector('a')?.focus({ preventScroll: true }); }
    else { menu.setAttribute('inert', ''); if (lastFocus && lastFocus.focus) btn.focus({ preventScroll: true }); }
  }

  btn.addEventListener('click', () => set(!isOpen()));
  menu.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a) return;
    /* same-page anchors: close first, then let the browser scroll */
    set(false);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen()) set(false);
    if (e.key === 'Tab' && isOpen()) {
      /* keep focus inside the open menu (button + menu links) */
      const items = [btn, ...menu.querySelectorAll('a')];
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  desktop.addEventListener('change', e => { if (e.matches) set(false); });
  addEventListener('pageshow', () => set(false));

  /* mark the page we are on */
  const here = document.body.dataset.view;
  document.querySelectorAll('[data-page]').forEach(a => { if (a.dataset.page === here) a.setAttribute('aria-current', 'page'); });

  /* header turns solid once the page scrolls (home page uses body.scrolled from home.js; do it here for all pages) */
  const onScroll = () => document.body.classList.toggle('scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* shorter placeholder on phones so it is never cut off */
  const ask = document.getElementById('ask-input');
  if (ask) {
    const mq = matchMedia('(max-width: 720px)');
    const long = ask.getAttribute('placeholder');
    const fit = () => ask.setAttribute('placeholder', mq.matches ? 'Where to? e.g. Baguio' : long);
    fit(); mq.addEventListener('change', fit);
  }
})();
