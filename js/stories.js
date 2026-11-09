/* Everyride v43: "Every journey, every story" carousel. Endless loop (cards are cloned on both sides),
   progress dots drive the autoplay, swipe + arrow keys, no pause button. */
(() => {
  'use strict';
  const sec = document.getElementById('stories');
  const track = document.getElementById('st-track');
  const dotsBox = document.getElementById('st-dots');
  if (!sec || !track || !dotsBox) return;

  const originals = [...track.querySelectorAll('.st-card')];
  const n = originals.length;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* [clones][originals][clones]: we always rest on the middle set, so both sides are always filled */
  const clone = c => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); k.querySelectorAll('a').forEach(a => a.tabIndex = -1); return k; };
  track.prepend(...originals.map(clone));
  track.append(...originals.map(clone));
  const cards = [...track.querySelectorAll('.st-card')];

  let pos = n, userPaused = reduce, inView = false, hovering = false, focusing = false, settling = 0, idle = 0, raf = 0;

  const dots = originals.map((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'st-dot';
    b.setAttribute('aria-label', `Show slide ${i + 1} of ${n}`);
    b.innerHTML = '<i></i>';
    b.addEventListener('click', () => go(n + i));
    dotsBox.append(b);
    return b;
  });

  const offsetFor = i => cards[i].offsetLeft - (track.clientWidth - cards[i].offsetWidth) / 2;

  function hold() { sec.classList.toggle('st-hold', userPaused || !inView || hovering || focusing || document.hidden); }

  function mark(p, replay) {
    const changed = p !== pos;
    pos = p;
    const di = p % n;
    cards.forEach((c, k) => c.classList.toggle('on', k === p));
    dots.forEach((d, k) => { d.classList.toggle('on', k === di); d.setAttribute('aria-current', k === di ? 'true' : 'false'); });
    if (changed || replay) { const f = dots[di].firstElementChild; f.style.animation = 'none'; void f.offsetWidth; f.style.animation = ''; }
  }

  /* jump (invisibly) back to the same card in the middle set once scrolling has stopped */
  function recentre() {
    if (pos >= n && pos < 2 * n) return;
    const p = pos < n ? pos + n : pos - n;
    track.style.scrollSnapType = 'none';
    track.scrollLeft = offsetFor(p);
    mark(p, false);
    requestAnimationFrame(() => { track.style.scrollSnapType = ''; });
  }

  function go(p, smooth = true) {
    const soft = smooth && !reduce;
    clearTimeout(settling);
    settling = setTimeout(() => { settling = 0; recentre(); }, soft ? 750 : 60);
    mark(p, true);
    track.scrollTo({ left: offsetFor(p), behavior: soft ? 'smooth' : 'auto' });
  }

  /* keep the dots in step with manual swipes, then re-centre when the swipe stops */
  function syncFromScroll() {
    raf = 0;
    if (settling) return;
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0, bestD = Infinity;
    cards.forEach((c, k) => { const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bestD) { bestD = d; best = k; } });
    if (best !== pos) mark(best, false);
  }
  track.addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(syncFromScroll);
    clearTimeout(idle);
    idle = setTimeout(() => { if (!settling) recentre(); }, 160);
  }, { passive: true });

  /* the active dot's fill finishing = time for the next slide */
  dotsBox.addEventListener('animationend', e => { if (!userPaused && e.target === dots[pos % n].firstElementChild) go(pos + 1); });

  track.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(pos + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(pos - 1); }
  });
  sec.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hovering = true; hold(); } });
  sec.addEventListener('pointerleave', () => { hovering = false; hold(); });
  sec.addEventListener('focusin', () => { focusing = true; hold(); });
  sec.addEventListener('focusout', () => { focusing = false; hold(); });
  document.addEventListener('visibilitychange', hold);
  new IntersectionObserver(([en]) => { inView = en.isIntersecting; hold(); }, { threshold: 0.4 }).observe(sec);
  addEventListener('resize', () => go(pos, false));

  sec.classList.add('st-ready');
  sec.classList.toggle('st-static', reduce);
  hold();
  track.style.scrollSnapType = 'none';
  track.scrollLeft = offsetFor(n);
  requestAnimationFrame(() => { track.style.scrollSnapType = ''; });
  mark(n, true);
})();
