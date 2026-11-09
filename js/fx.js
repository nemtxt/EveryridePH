/* Everyride v36 motion + live preview. Optional: delete this file and its <script> tags to go back to v35. */
(() => {
  'use strict';
  const { $, $$, esc, money, ymd, plus, pad, today, D, H, RATES } = ER;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* stagger index for revealed children */
  $$('.reveal').forEach(sec => $$('.how li,.rate,.place,.fleet-grid button,.faq details', sec).forEach((el, i) => el.style.setProperty('--i', i % 8)));
  new MutationObserver(() => $$('.reveal:not([data-st])').forEach(sec => { sec.dataset.st = 1; $$('.rate,.place,.fleet-grid button,.faq details', sec).forEach((el, i) => el.style.setProperty('--i', i % 8)); })).observe(document.body, { childList: true, subtree: true });

  /* booking: tell the CSS which way the step is moving */
  const ORDER = ['dates', 'car', 'details', 'pass'];
  let last = ORDER.indexOf((location.hash.replace(/^#\/?/, '').split('/')[0]) || 'dates');
  addEventListener('hashchange', () => {
    const i = ORDER.indexOf(location.hash.replace(/^#\/?/, '').split('/')[0]);
    if (i >= 0) { document.body.dataset.dir = i < last ? 'back' : 'fwd'; last = i; }
  });

  /* gallery: fade between photos */
  const gm = $('#g-main');
  if (gm) new MutationObserver(m => m.forEach(r => { if (r.attributeName === 'src' && !gm.dataset.busy) { gm.classList.add('swap'); setTimeout(() => gm.classList.remove('swap'), 30); } })).observe(gm, { attributes: true });

  /* confetti when a booking pass appears */
  function confetti() {
    if (calm) return;
    const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c);
    const x = c.getContext('2d'), w = c.width = innerWidth, h = c.height = innerHeight, cols = ['#c9f03a', '#f7c52b', '#1d7a3f', '#14402b', '#ffffff'];
    const ps = Array.from({ length: 90 }, () => ({ x: w / 2, y: h * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 12 - 3, s: 5 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[Math.random() * cols.length | 0] }));
    let t0;
    (function f(t) {
      t0 = t0 || t; x.clearRect(0, 0, w, h);
      ps.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.r += p.vr; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.globalAlpha = Math.max(0, 1 - (t - t0) / 2200); x.fillRect(-p.s / 2, -p.s / 3, p.s, p.s / 1.6); x.restore(); });
      if (t - t0 < 2200) requestAnimationFrame(f); else c.remove();
    })(performance.now());
  }
  const pw = $('#pass-wrap');
  if (pw) new MutationObserver(() => { if ($('.ticket:not(.is-cancelled)', pw) && !pw.dataset.fired) { pw.dataset.fired = 1; setTimeout(confetti, 350); } if (!pw.children.length) delete pw.dataset.fired; }).observe(pw, { childList: true });

  /* landing page only */
  const input = $('#ask-input');
  if (!input) return;

  const go = $('.prompt-go');
  input.addEventListener('input', () => go.classList.toggle('ready', input.value.trim().length > 2));

  /* count-up for prices when the rates scroll into view */
  const io = 'IntersectionObserver' in window && !calm && new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return; io.unobserve(en.target);
    const el = en.target, m = el.textContent.match(/^(\+?₱)([\d,]+)$/); if (!m) return;
    const end = +m[2].replace(/,/g, ''), t0 = performance.now();
    (function f(t) { const p = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - p, 3); el.textContent = m[1] + Math.round(end * e).toLocaleString('en-PH'); if (p < 1) requestAnimationFrame(f); })(t0);
  }), { threshold: .6 });
  if (io) setTimeout(() => $$('.rate b').forEach(b => io.observe(b)), 0);

  /* phone call-to-action once the hero is out of view */
  const cta = document.createElement('a'); cta.className = 'sticky-cta'; cta.href = 'booking.html'; cta.textContent = `Book the Xpander · from ${money(RATES.metro)}`; document.body.appendChild(cta);
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => cta.classList.toggle('on', !e.isIntersecting), { threshold: 0 }).observe($('.hero'));
})();
