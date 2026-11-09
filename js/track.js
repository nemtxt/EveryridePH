/* Everyride tracking page (v35): reference box in the middle, the request details below it.
   Bookings are read from this browser only (demo). Deep link: track.html?ref=EVR-... */
(() => {
  'use strict';
  const { $, esc, money, fmtDay, fmtFull, PLACE_LABEL, STAGES, VERSION, bookings, findBooking, stageIndex, ticketHTML, bindActions } = ER;
  const place = v => esc(PLACE_LABEL[v] || v || '');
  const badge = b => b.status === 'cancelled' ? '<em class="badge bad">Cancelled</em>' : `<em class="badge">${STAGES[stageIndex(b)][1]}</em>`;
  const dur = b => {
    if (b.trip.duration === 'half') return '12 hours';
    const n = Math.max(1, Math.round((new Date(b.trip.returnDate) - new Date(b.trip.pickupDate)) / 864e5));
    return `${n} ${n === 1 ? 'day' : 'days'}`;
  };
  const extrasOf = b => [b.extras?.seat && 'Child seat', b.extras?.driver && 'Additional driver'].filter(Boolean).join(', ') || 'None';

  function detailHTML(b) {
    const p = b.price || {}, cancelled = b.status === 'cancelled';
    const lines = [[b.trip.duration === 'half' ? '12-hour rental' : 'Rental', p.base], ...(p.additions || []).map(a => [a.name, a.amount]), ...(p.oneWay ? [['Different return location', p.oneWay]] : [])];
    const link = `${location.origin}${location.pathname}?ref=${encodeURIComponent(b.id)}`;
    return `
      <div class="tk-head"><div><small>Your request</small><h2>${esc(b.id)}</h2></div>${badge(b)}</div>
      ${ticketHTML(b)}
      <div class="tk-grid">
        <section class="tk-card" aria-label="Trip">
          <h3>Trip</h3>
          <dl>
            <div><dt>Pick-up</dt><dd>${esc(fmtFull(new Date(b.trip.pickupDate)))}<span>${place(b.trip.pickupLocation)}</span></dd></div>
            <div><dt>Return</dt><dd>${esc(fmtFull(new Date(b.trip.returnDate)))}<span>${place(b.trip.returnLocation)}</span></dd></div>
            <div><dt>Duration</dt><dd>${dur(b)}</dd></div>
            <div><dt>Add-ons</dt><dd>${esc(extrasOf(b))}</dd></div>
          </dl>
        </section>
        <section class="tk-card" aria-label="Price">
          <h3>Estimated price</h3>
          <ul class="tk-lines">${lines.map(([l, a]) => `<li class="${a < 0 ? 'promo' : ''}"><span>${esc(l)}</span><b>${money(a || 0)}</b></li>`).join('')}</ul>
          <div class="tk-total"><span>Estimated total</span><strong>${money(Number(p.total || 0))}</strong></div>
          <p class="fine">Sample ₱5,000 refundable deposit not included. Demo pricing.</p>
        </section>
        <section class="tk-card" aria-label="Driver">
          <h3>Driver</h3>
          <dl>
            <div><dt>Name</dt><dd>${esc(b.guest?.name || '')}</dd></div>
            <div><dt>Email</dt><dd>${esc(b.guest?.email || '')}</dd></div>
            <div><dt>Mobile</dt><dd>${esc(b.guest?.phone || '')}</dd></div>
            <div><dt>Requested</dt><dd>${esc(b.createdAt ? fmtFull(new Date(b.createdAt)) : '')}</dd></div>
          </dl>
        </section>
      </div>
      <div class="pass-actions">
        <button type="button" class="cta" data-copy="${esc(b.id)}" data-msg="Reference copied.">Copy reference</button>
        <button type="button" class="ghost" data-copy="${esc(link)}" data-msg="Link copied.">Copy link</button>
        ${cancelled ? '' : `<button type="button" class="ghost" data-ics="${esc(b.id)}">Add to calendar</button>`}
        <a class="ghost" href="booking.html">Book another</a>
        ${cancelled ? '' : `<button type="button" class="link danger" data-cancel="${esc(b.id)}">Cancel booking</button>`}
      </div>
      <p class="fine center">Demo only. Status updates are simulated in this browser and no real approval or payment happens.</p>`;
  }
  function listHTML(list) {
    return `<h2 class="tk-sub">Saved on this device</h2><ul class="tk-list">${list.map(b => `<li><button type="button" data-open="${esc(b.id)}">
      <span><b>${esc(b.id)}</b><small>${esc(fmtDay(new Date(b.trip.pickupDate)))} → ${esc(fmtDay(new Date(b.trip.returnDate)))} · ${place(b.trip.pickupLocation)}</small></span>${badge(b)}</button></li>`).join('')}</ul>`;
  }

  function show(ref, push = true) {
    const out = $('#tk-result'), input = $('#tk-ref'), hint = $('#tk-hint');
    ref = (ref || '').trim();
    input.value = ref; input.removeAttribute('aria-invalid');
    if (push) history.replaceState(null, '', ref ? `?ref=${encodeURIComponent(ref)}` : location.pathname);
    if (!ref) {
      hint.textContent = 'Your reference starts with EVR and is on your confirmation pass.'; hint.classList.remove('bad');
      const list = bookings();
      out.innerHTML = list.length ? listHTML(list) : '<p class="tk-empty">No bookings saved on this device yet. <a href="booking.html">Book the Xpander</a></p>';
      return;
    }
    const b = findBooking(ref);
    if (!b) {
      input.setAttribute('aria-invalid', 'true'); hint.classList.add('bad');
      hint.textContent = 'No booking found for that reference in this browser. Check it for typos.';
      out.innerHTML = '';
      return;
    }
    hint.textContent = 'Found your request.'; hint.classList.remove('bad');
    out.innerHTML = detailHTML(b);
    out.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  $('#ver').textContent = `Direct ${VERSION}`;
  $('#tk-form').addEventListener('submit', e => { e.preventDefault(); show($('#tk-ref').value); });
  $('#tk-ref').addEventListener('input', () => { $('#tk-ref').removeAttribute('aria-invalid'); $('#tk-hint').classList.remove('bad'); });
  document.addEventListener('click', e => { const o = e.target.closest('[data-open]'); if (o) show(o.dataset.open); });
  bindActions(id => show(id, false));
  window.addEventListener('storage', e => { if (e.key === ER.KEY) show($('#tk-ref').value, false); });
  show(new URLSearchParams(location.search).get('ref'), false);
})();
