/* Everyride booking flow (v35): dates (calendar) → your Xpander → details → confirmation pass.
   Routes by hash: #dates (default), #car, #details, #pass/<ref>. Tracking lives on track.html. */
(() => {
  'use strict';
  const { $, $$, esc, money, fmtDay, fmtTime, fmtFull, fmtLong, at, plus, pad, ymd, local, hourLabel, today, H, D, BUFFER,
    PLACES, PLACE_LABEL, TIMES, PHOTOS, STAGES, VERSION, state, saveDraft, resetTrip, bookings, saveBookings,
    trip, validate, quote, isFree, nextSlot, toast, findBooking, ticketHTML, bindActions, applyUrl } = ER;

  /* ---------- STEP 1 · dates ---------- */
  const MAX_DAYS = 30;
  applyUrl();                                                  // ?to=&from=&days= from landing-page links
  const firstOf = d => new Date(d.getFullYear(), d.getMonth(), 1);
  let calMonth = firstOf(at(state.pDate));                     // month shown in the calendar
  let phase = 'pickup';                                        // next calendar click sets 'pickup' or 'return'
  let datesNote = '';
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
  const groups = (first) => first + PLACES.map(([g, , list]) => `<optgroup label="${g}">${list.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</optgroup>`).join('');

  function buildDates() {
    $('#pickup').innerHTML = groups('<option value="" disabled>Select location</option>');
    $('#return').innerHTML = groups('<option value="">Same as pickup location</option>');
    $('#p-time').innerHTML = TIMES.map(t => `<option value="${t}">${hourLabel(+t.slice(0, 2))}</option>`).join('');
    $('#pickup').addEventListener('change', e => { state.place = e.target.value; if (state.returnPlace === state.place) state.returnPlace = ''; datesNote = ''; saveDraft(); renderDates(); });
    $('#return').addEventListener('change', e => { state.returnPlace = e.target.value === state.place ? '' : e.target.value; saveDraft(); renderDates(); });
    $('#p-time').addEventListener('change', e => { state.time = e.target.value; datesNote = ''; saveDraft(); renderDates(); });
    $$('[data-mode]').forEach(b => b.addEventListener('click', () => {
      state.mode = b.dataset.mode; phase = 'pickup';
      state.rDate = state.mode === 'half' ? '' : plus(state.pDate, 1);
      datesNote = ''; saveDraft(); renderDates();
    }));
    $('#cal-prev').addEventListener('click', () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1); renderCal(); });
    $('#cal-next').addEventListener('click', () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1); renderCal(); });
    const days = $('#cal-days');
    days.addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (b && !b.disabled) pickDay(b.dataset.d); });
    days.addEventListener('keydown', e => {                      // arrow keys move through the calendar
      const cur = e.target.closest('[data-d]'); const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (!cur || !step) return; e.preventDefault();
      const target = plus(cur.dataset.d, step); if (target < ymd(today)) return;
      const t = at(target); if (t.getMonth() !== calMonth.getMonth() || t.getFullYear() !== calMonth.getFullYear()) { calMonth = firstOf(t); renderCal(); }
      $(`[data-d="${target}"]`, days)?.focus();
    });
    const paint = d => $$('.day', days).forEach(x => x.classList.toggle('hov', !!d && x.dataset.d > state.pDate && x.dataset.d <= d && !x.disabled));
    days.addEventListener('mouseover', e => { const b = e.target.closest('[data-d]'); paint(phase === 'return' && state.mode === 'days' && b && !b.disabled ? b.dataset.d : ''); });
    days.addEventListener('mouseleave', () => paint(''));
    $('#to-car').addEventListener('click', () => {
      const err = validate();
      if (err) { datesNote = err; renderDates(); (!state.place ? $('#pickup') : $('#cal-days')).focus?.(); return; }
      go('car');
    });
  }
  function pickDay(d) {
    datesNote = '';
    if (state.mode === 'half') { state.pDate = d; state.rDate = ''; phase = 'pickup'; }
    else if (phase === 'pickup' || d <= state.pDate) { state.pDate = d; state.rDate = ''; phase = 'return'; }
    else { state.rDate = d; phase = 'pickup'; }
    saveDraft(); renderDates(); $(`[data-d="${d}"]`, $('#cal-days'))?.focus();
  }
  function renderCal() {
    const y = calMonth.getFullYear(), m = calMonth.getMonth(), first = new Date(y, m, 1).getDay(), count = new Date(y, m + 1, 0).getDate();
    const t0 = ymd(today), start = state.pDate, end = state.mode === 'days' ? state.rDate : '';
    const limit = phase === 'return' && start ? plus(start, MAX_DAYS) : '';
    let html = '<span></span>'.repeat(first);
    for (let n = 1; n <= count; n++) {
      const d = `${y}-${pad(m + 1)}-${pad(n)}`;
      const past = d < t0, far = limit && d > limit;
      const cls = ['day', d === t0 && 'today', d === start && 'start', d === end && 'end', start && end && d > start && d < end && 'mid'].filter(Boolean).join(' ');
      html += `<button type="button" class="${cls}" data-d="${d}" ${past || far ? 'disabled' : ''} ${d === t0 ? 'aria-current="date"' : ''} aria-label="${esc(fmtLong(at(d)))}${d === start ? ', pickup' : d === end ? ', return' : ''}">${n}</button>`;
    }
    $('#cal-days').innerHTML = html;
    $('#cal-month').textContent = monthName.format(calMonth);
    $('#cal-prev').disabled = calMonth <= thisMonth;
    $('#cal-next').disabled = calMonth >= new Date(today.getFullYear(), today.getMonth() + 12, 1);
    $('#cal-title').textContent = state.mode === 'half' ? 'Choose your pickup date' : phase === 'return' ? 'Choose your return date' : 'Choose your pickup date';
  }
  function renderDates() {
    $('#pickup').value = state.place; $('#return').value = state.returnPlace;
    $$('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === state.mode));
    // hours that already passed are not offered for a same-day pick-up
    $$('option', $('#p-time')).forEach(o => { o.disabled = state.pDate === ymd(today) && new Date(`${state.pDate}T${o.value}:00`).getTime() < Date.now() + 5 * 60000; });
    const sel = $('#p-time').selectedOptions[0];
    if (!$(`#p-time option[value="${state.time}"]`) || $(`#p-time option[value="${state.time}"]`).disabled) { const ok = $('#p-time option:not([disabled])'); if (ok) { state.time = ok.value; saveDraft(); } }
    $('#p-time').value = state.time;
    renderCal();
    const half = state.mode === 'half', from = new Date(`${state.pDate}T${state.time}:00`);
    $('#s-pick').textContent = fmtLong(at(state.pDate));
    $('#s-ret').textContent = half ? `${fmtLong(new Date(from.getTime() + 12 * H))}, ${fmtTime(new Date(from.getTime() + 12 * H))}` : state.rDate ? `${fmtLong(at(state.rDate))}, ${fmtTime(from)}` : 'Select a return date';
    $('#s-ret').classList.toggle('muted', !half && !state.rDate);
    const days = ER.daysBetween(state.pDate, state.rDate || state.pDate);
    $('#s-dur').textContent = half ? '12 hours' : state.rDate ? `${days} ${days === 1 ? 'day' : 'days'}` : '—';
    const t = trip(), ok = t && !validate();
    $('#s-est').textContent = ok ? `${money(quote(t, {}).total)}` : state.place ? '—' : 'Choose a pickup location';
    $('#s-note').textContent = half ? 'Half day is 12 hours from your pickup time. Select your pickup date on the calendar.' : 'Whole-day starts at 24 hours. Select pickup and return dates on the calendar.';
    $('#foot-est').innerHTML = ok ? `<b>${money(quote(t, {}).total)}</b> estimated · ${half ? '12 hours' : `${days} ${days === 1 ? 'day' : 'days'}`}` : 'Guest checkout available';
    $('#dates-error').textContent = datesNote; $('#dates-error').hidden = !datesNote;
    $('#pickup').classList.toggle('bad', !!datesNote && !state.place);
  }

  /* ---------- STEP 2 · your Xpander ---------- */
  function renderCar() {
    const t = trip(), q = quote(t), free = isFree(t.from, t.to);
    $('#trip-line').innerHTML = `
      <div><small>Pick-up</small><b>${fmtDay(t.from)}</b><span>${fmtTime(t.from)} · ${esc(PLACE_LABEL[t.place])}</span></div>
      <i aria-hidden="true"></i>
      <div><small>Return</small><b>${fmtDay(t.to)}</b><span>${fmtTime(t.to)} · ${esc(PLACE_LABEL[t.returnPlace])}</span></div>`;
    const avail = $('#avail');
    if (free) { avail.className = 'status ok'; avail.innerHTML = '<svg aria-hidden="true"><use href="#i-check"/></svg> Available for your dates'; }
    else {
      const next = nextSlot(t);
      avail.className = 'status no';
      avail.innerHTML = `Already booked for those dates.${next ? ` <button type="button" class="link" id="use-next">Next free pick-up: ${fmtFull(next)} →</button>` : ''}`;
      if (next) $('#use-next').onclick = () => {
        state.pDate = ymd(next); state.time = pad(next.getHours()) + ':00';
        if (state.mode === 'days') state.rDate = ymd(new Date(next.getTime() + (t.to - t.from)));
        saveDraft(); renderCar();
      };
    }
    $$('[data-extra]').forEach(i => { i.checked = !!state.extras[i.dataset.extra]; });
    $('#to-details').disabled = !free;
    renderPrice($('#price-review'), q);
  }
  let shownTotal = 0;
  function renderPrice(el, q) {
    el.innerHTML = `<ul>${q.lines.map(l => `<li class="${l.promo ? 'promo' : ''}"><span>${esc(l.label)}</span><b>${money(l.amount)}</b></li>`).join('')}</ul>
      <div class="total"><span>Estimated total</span><strong data-total="${q.total}">${money(shownTotal || q.total)}</strong></div>
      <p class="fine">Sample ₱5,000 refundable deposit not included. Demo pricing, to be confirmed by Everyride.</p>`;
    const strong = $('strong', el), from = shownTotal || q.total, to = q.total;
    shownTotal = to;
    if (from === to || matchMedia('(prefers-reduced-motion: reduce)').matches) { strong.textContent = money(to); return; }
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min(1, (now - t0) / 380), e = 1 - Math.pow(1 - p, 3);
      strong.textContent = money(Math.round(from + (to - from) * e));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ---------- STEP 3 · details ---------- */
  function renderDetails() {
    const t = trip(), q = quote(t);
    $('#summary-details').innerHTML = `<h3>Your trip</h3>
      <div class="mini"><img src="assets/xpander-real-front.webp" alt=""><div><b>Mitsubishi Xpander GLS</b><span>${fmtDay(t.from)} → ${fmtDay(t.to)}</span><span>${esc(PLACE_LABEL[t.place])}${t.returnPlace !== t.place ? ` → ${esc(PLACE_LABEL[t.returnPlace])}` : ''}</span></div></div>
      <div class="price" id="price-details"></div>`;
    shownTotal = q.total; renderPrice($('#price-details'), q);
    const f = $('#guest-form');
    f.name.value = state.guest.name; f.email.value = state.guest.email; f.phone.value = state.guest.phone; f.agree.checked = state.agree;
  }
  function setErr(name, msg) {
    const el = $(`#e-${name}`), inp = $(`#guest-form [name=${name}]`);
    if (el) { el.textContent = msg; el.hidden = false; }
    if (inp) inp.setAttribute('aria-invalid', 'true');
  }
  function clearErr(name) {
    $$(name ? `#e-${name}` : '.field-err', $('#guest-form')).forEach(el => { el.hidden = true; });
    $$(name ? `[name=${name}]` : '[aria-invalid]', $('#guest-form')).forEach(el => el.removeAttribute('aria-invalid'));
  }
  function submitGuest(e) {
    e.preventDefault();
    const f = e.target, g = { name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim() };
    Object.assign(state.guest, g); state.agree = f.agree.checked; saveDraft();
    const err = $('#form-error');
    const fail = (m, field) => { if (field) setErr(field, m); else { err.textContent = m; err.hidden = false; } return false; };
    clearErr(); err.hidden = true;
    let ok = true, first = '';
    const bad = (field, m) => { ok = false; first = first || field; setErr(field, m); };
    if (g.name.length < 2) bad('name', 'Please enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.email)) bad('email', 'Enter an email address in the correct format.');
    const digits = g.phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 13) bad('phone', 'Enter a mobile number with 10 to 13 digits.');
    if (!state.agree) bad('agree', 'Please accept the demo acknowledgement.');
    if (!ok) { f[first].focus(); return; }
    const issue = validate(); if (issue) return fail(issue);
    const t = trip();
    if (!isFree(t.from, t.to)) return fail('Those dates were just taken. Go back and choose another time.');
    err.hidden = true;
    const q = quote(t);
    const record = {
      id: `EVR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      carId: 'xpander',
      trip: { pickupDate: local(t.from), returnDate: local(t.to), pickupLocation: t.place, returnLocation: t.returnPlace, duration: t.mode === 'half' ? 'half' : 'full' },
      extras: { ...state.extras }, guest: g,
      price: { base: q.base, additions: q.lines.slice(1).filter(l => l.label !== 'Different return location').map(l => ({ name: l.label, amount: l.amount })), oneWay: q.oneWay, total: q.total },
      status: 'active', workflowStage: 'approval', createdAt: new Date().toISOString(), version: 5
    };
    const list = bookings(); list.unshift(record);
    if (!saveBookings(list)) return;
    state.extras = { seat: false, driver: false }; state.agree = false; saveDraft();
    go('pass', record.id);
  }

  /* ---------- STEP 4 · confirmation pass ---------- */
  function passHTML(b) {
    const cancelled = b.status === 'cancelled';
    return `
      <p class="pass-kicker">${cancelled ? 'Booking cancelled' : 'Request sent'}</p>
      <h2 id="pass-title">${cancelled ? 'This booking was cancelled.' : `You're all set, ${esc((b.guest?.name || '').split(' ')[0] || 'driver')}.`}</h2>
      ${ticketHTML(b)}
      <div class="pass-actions">
        <button type="button" class="cta" data-copy="${esc(b.id)}" data-msg="Reference copied.">Copy reference</button>
        <a class="ghost" href="track.html?ref=${encodeURIComponent(b.id)}">Track this booking</a>
        ${cancelled ? '' : `<button type="button" class="ghost" data-ics="${esc(b.id)}">Add to calendar</button>`}
        <button type="button" class="ghost" data-new>Book another</button>
      </div>
      ${cancelled ? '' : `<ol class="next-steps"><li><b>We review your request.</b><span>Status moves from Request sent to Approved in this demo.</span></li><li><b>Keep your reference.</b><span>Use ${esc(b.id)} on the Track page any time.</span></li><li><b>Pick up the Xpander.</b><span>At ${esc(PLACE_LABEL[b.trip.pickupLocation] || b.trip.pickupLocation)} on ${esc(fmtFull(new Date(b.trip.pickupDate)))}.</span></li></ol>`}
      <p class="fine center">Demo only. Status updates are simulated in this browser and no real approval or payment happens.</p>`;
  }
  function renderPass(ref) {
    const b = findBooking(ref);
    if (!b) { go('dates'); toast('We could not find that booking in this browser.'); return false; }
    $('#pass-wrap').innerHTML = passHTML(b);
    return true;
  }
  /* ---------- stepper + router ---------- */
  const STEPS = [['dates', 'Dates'], ['car', 'Your Xpander'], ['details', 'Details'], ['pass', 'Confirmation']];
  function parse() {
    const [v, ...rest] = location.hash.replace(/^#\/?/, '').split('/');
    return { view: STEPS.some(s => s[0] === v) ? v : 'dates', arg: decodeURIComponent(rest.join('/')) };
  }
  function go(v, arg) {
    const next = `#${v}${arg ? '/' + encodeURIComponent(arg) : ''}`;
    if (location.hash === next) render(); else location.hash = next;
  }
  function renderStepper(view) {
    const idx = STEPS.findIndex(s => s[0] === view), reach = validate() ? 0 : 2;
    $('#stepper').innerHTML = STEPS.map(([id, label], i) => {
      const done = view === 'pass' || i < idx, cur = i === idx && view !== 'pass', link = !cur && view !== 'pass' && i < idx;
      return `<li class="${done ? 'done' : ''}${cur ? ' now' : ''}"${cur ? ' aria-current="step"' : ''}>${link ? `<button type="button" data-go="${id}" aria-label="Back to ${label}">` : '<span>'}<i>${done ? '✓' : i + 1}</i><em class="lbl">${label}</em>${link ? '</button>' : '</span>'}</li>`;
    }).join('');
  }
  function render() {
    let { view, arg } = parse();
    if (view !== 'pass' && view !== 'dates' && validate()) { view = 'dates'; datesNote = validate(); }
    if (view === 'pass' && !renderPass(arg)) return;
    if (view === 'details' && !isFree(trip().from, trip().to)) view = 'car';
    if (view === 'dates') { calMonth = firstOf(at(state.pDate)); renderDates(); }
    if (view === 'car') renderCar();
    if (view === 'details') renderDetails();
    $$('[data-step]', $('#main')).forEach(s => { s.hidden = s.dataset.step !== view; });
    document.body.dataset.step = view;
    document.title = `${STEPS.find(s => s[0] === view)[1]} | Book the Xpander | Everyride`;
    renderStepper(view);
    window.scrollTo({ top: 0, behavior: 'instant' });
    const h = $(`[data-step="${view}"] h1, [data-step="${view}"] h2`);
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  /* ---------- events ---------- */
  function init() {
    $('#ver').textContent = `Direct ${VERSION}`;
    buildDates();
    $$('[data-extra]').forEach(i => i.addEventListener('change', () => { state.extras[i.dataset.extra] = i.checked; saveDraft(); renderCar(); }));
    $('#to-details').addEventListener('click', () => go('details'));
    $('#guest-form').addEventListener('submit', submitGuest);
    $('#guest-form').addEventListener('input', e => { if (e.target.name in state.guest) state.guest[e.target.name] = e.target.value; clearErr(e.target.name); });
    $('#g-thumbs').innerHTML = PHOTOS.map(([src, label], i) => `<button type="button" class="${i === 0 ? 'on' : ''}" data-photo="${i}" aria-label="${label} photo"><img src="${src}" alt="" loading="lazy"></button>`).join('');
    $('#g-thumbs').addEventListener('click', e => {
      const b = e.target.closest('[data-photo]'); if (!b) return;
      const [src, label] = PHOTOS[b.dataset.photo];
      $('#g-main').src = src; $('#g-main').alt = `Xpander GLS: ${label}`;
      $$('#g-thumbs button').forEach(x => x.classList.toggle('on', x === b));
    });
    bindActions();
    document.addEventListener('click', e => {
      const g = e.target.closest('[data-go]'); if (g) { go(g.dataset.go); return; }
      if (e.target.closest('[data-new]')) { resetTrip(); phase = 'pickup'; shownTotal = 0; go('dates'); }
    });
    window.addEventListener('hashchange', render);
    window.addEventListener('storage', e => { if (e.key === ER.KEY && parse().view === 'car') renderCar(); });
    render();
  }
  init();
})();
