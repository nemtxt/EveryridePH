/* Everyride landing page (v35): hero prompt, rates, FAQ, gallery. Hands the trip to booking.html. */
(() => {
  'use strict';
  const { $, $$, esc, money, RATES, EXTRAS, ONE_WAY, PLACES, CITIES, PHOTOS, VERSION, resetTrip, prefill } = ER;

  /* hero prompt: prefill a trip from a sentence (keyword matching, not AI), then open the booking page */
  const start = text => { resetTrip(); if (text) prefill(text); location.href = 'booking.html'; };
  $('#ask-form').addEventListener('submit', e => { e.preventDefault(); start($('#ask-input').value.trim()); });
  $$('[data-starter]').forEach(b => b.addEventListener('click', () => start(b.dataset.starter)));

  const FAQ = [
    ['Where can I pick up the Xpander?', () => PLACES.map(([g, , l]) => `${g}: ${l.map(x => x[1]).join(', ')}.`).join(' ')],
    ['How is the price worked out?', () => `Whole days are charged per 24 hours (${money(RATES.metro)} in Metro Manila, ${money(RATES.outside)} outside). 12-hour rentals are 65% of the day rate. Book 3 days and the 4th is free. Add-ons and a different return location are added on top.`],
    ['Is this a real booking?', () => 'Not yet. This is a frontend demo: nothing is charged or reserved, and bookings are saved only in this browser. A sample ₱5,000 refundable deposit is not included in estimates.'],
    ['How do I check my booking?', () => 'Tap Track booking at the top and enter your EVR reference, or pick it from the list saved on this device.']
  ];
  $('#ver').textContent = `Direct ${VERSION}`;
  const names = CITIES.map(c => c.l.split(' / ')[0]);
  $('#rates-grid').innerHTML = `
    <div class="price-hero">
      <div><b>${money(RATES.metro)}</b><span>Metro Manila<br>per 24 hours</span></div>
      <div><b>${money(RATES.outside)}</b><span>Outside Metro Manila<br>per 24 hours</span></div>
    </div>
    <p class="price-deal">Book 3 days, get 1 free.</p>
    <ul class="price-extras" aria-label="Extras">
      <li>Child seat <b>${money(EXTRAS.seat.day)}/day</b></li><li>Additional driver <b>${money(EXTRAS.driver.day)}/day</b></li>
      <li>Return elsewhere <b>${money(ONE_WAY)}</b></li><li>12-hour rental <b>65% of day rate</b></li>
    </ul>`;
  $('#faq-list').innerHTML = FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a())}</p></details>`).join('');
  /* places: one switch, one row of city pills (was 12 stacked cards) */
  const pg = $('#places-grid');
  pg.innerHTML = `<div class="zone-tabs" role="tablist" aria-label="Pickup area">${PLACES.map(([g], i) => `<button type="button" role="tab" id="zt-${i}" aria-selected="${i === 0}" aria-controls="zone-panel" data-z="${i}">${esc(g)}</button>`).join('')}</div><div class="city-pills" id="zone-panel" role="tabpanel"></div>`;
  const showZone = i => {
    $$('.zone-tabs button', pg).forEach(t => t.setAttribute('aria-selected', t.dataset.z == i));
    const panel = $('#zone-panel'); panel.setAttribute('aria-labelledby', 'zt-' + i);
    panel.innerHTML = PLACES[i][2].map(([v, l], k) => `<a class="city-pill" style="--i:${k}" href="booking.html?to=${encodeURIComponent(v)}">${esc(l)}</a>`).join('');
  };
  pg.addEventListener('click', e => { const t = e.target.closest('[data-z]'); if (t) showZone(+t.dataset.z); });
  showZone(0);
  $('#fleet-grid').innerHTML = PHOTOS.map(([src, label]) => `<button type="button" data-zoom="${src}" data-label="${label}" aria-label="Enlarge ${label} photo"><img src="${src}" alt="" loading="lazy"><span>${label}</span></button>`).join('');

  const lb = $('#lightbox');
  document.addEventListener('click', e => {
    const z = e.target.closest('[data-zoom]'); if (z) { $('img', lb).src = z.dataset.zoom; $('img', lb).alt = `Xpander GLS: ${z.dataset.label}`; lb.showModal(); return; }
    if (e.target === lb) lb.close();
    const sc = e.target.closest('[data-scroll]'); if (sc) document.getElementById(sc.dataset.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  const onScroll = () => document.body.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .12 });
    reveals.forEach(r => io.observe(r));
  } else reveals.forEach(r => r.classList.add('in'));
  const img = $('.hero-media img');
  if (img && !matchMedia('(prefers-reduced-motion: reduce)').matches) $('.hero').addEventListener('pointermove', e => {
    img.style.transform = `translate(${(e.clientX / innerWidth - .5) * -16}px,${(e.clientY / innerHeight - .5) * -10}px) scale(1.06)`;
  });
})();
