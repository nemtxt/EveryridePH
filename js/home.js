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
  $('#rates-grid').innerHTML = [
    [money(RATES.metro), 'per 24h', 'Pickup in Metro Manila'], [money(RATES.outside), 'per 24h', 'Pickup outside Metro Manila'],
    ['Book 3, get 1 free', '', 'Every 4th day is free on 1+ day rentals'], ['65%', 'of the day rate', '12-hour rentals, rounded to ₱50'],
    [money(EXTRAS.seat.day), 'per day', 'Child seat'], [money(EXTRAS.driver.day), 'per day', 'Additional driver'], ['+' + money(ONE_WAY), 'one time', 'Return somewhere else']
  ].map(([a, b, c]) => `<div class="rate"><b>${esc(a)}</b><span>${esc(b)}</span><p>${esc(c)}</p></div>`).join('');
  $('#faq-list').innerHTML = FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a())}</p></details>`).join('');
  $('#places-grid').innerHTML = PLACES.map(([g, z, list]) => `<h3 class="places-h">${esc(g)} <b>${money(RATES[z])} / 24h</b></h3><div class="places">${list.map(([v, l]) => `<a class="place" href="booking.html?to=${encodeURIComponent(v)}"><span><b>${esc(l)}</b><small>Book from here</small></span><svg aria-hidden="true"><use href="#i-arrow"/></svg></a>`).join('')}</div>`).join('');
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
