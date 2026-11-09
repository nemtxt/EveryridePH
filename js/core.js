/* Everyride core (v35): constants, state, storage, pricing and text helpers shared by
   index.html (landing) and booking.html (booking flow). Exposes window.ER.
   Frontend demo only: nothing here is a real reservation, price authority or payment. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = 'everyride_demo_bookings_v1';   // same key/shape as the main prototype (v30+)
  const DRAFT = 'everyride_draft_v36';
  const VERSION = 'v41';
  const H = 3600e3, D = 24 * H, BUFFER = 3 * H;
  const RATES = { metro: 2500, outside: 3200 };
  const EXTRAS = { seat: { label: 'Child seat', day: 150 }, driver: { label: 'Additional driver', day: 180 } };
  const ONE_WAY = 950;
  const PLACES = [
    ['Metro Manila', 'metro', [['Quezon City', 'Quezon City'], ['Manila', 'City of Manila'], ['Makati', 'Makati'], ['Pasay', 'Pasay / Airport']]],
    ['Outside Metro Manila', 'outside', [['Antipolo', 'Antipolo'], ['Clark', 'Clark / Pampanga'], ['Tagaytay', 'Tagaytay'], ['Baguio', 'Baguio'], ['Batangas City', 'Batangas City'], ['San Juan, La Union', 'San Juan, La Union'], ['Vigan', 'Vigan, Ilocos Sur'], ['Cabatuan, Isabela', 'Cabatuan, Isabela']]]
  ];
  const PLACE_LABEL = Object.fromEntries(PLACES.flatMap(([, , list]) => list));
  const ZONE = Object.fromEntries(PLACES.flatMap(([, z, list]) => list.map(([v]) => [v, z])));
  const ZONE_NAME = { metro: 'Metro Manila', outside: 'Outside Metro Manila' };
  const CITIES = PLACES.flatMap(([g, z, list]) => list.map(([v, l]) => ({ v, l, z, g })));
  const TIMES = Array.from({ length: 16 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);
  const PHOTOS = [
    ['assets/xpander-real-front.webp', 'Front'], ['assets/xpander-real-angle.webp', 'Three-quarter'],
    ['assets/xpander-real-hero.webp', 'Street'], ['assets/xpander-real-driver.webp', 'Cockpit'],
    ['assets/xpander-real-passenger.webp', 'Passenger'], ['assets/xpander-real-seats.webp', 'Seats']
  ];
  const STAGES = [['approval', 'Request sent'], ['approved', 'Approved'], ['on-road', 'On the road'], ['complete', 'Completed']];

  /* ---------- formatting ---------- */
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const local = d => `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const money = n => `${n < 0 ? '−' : ''}₱${Math.abs(n).toLocaleString('en-PH')}`;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDay = d => new Intl.DateTimeFormat('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }).format(d);
  const fmtTime = d => new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' }).format(d);
  const fmtFull = d => `${fmtDay(d)}, ${fmtTime(d)}`;
  const fmtLong = d => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
  const at = s => new Date(`${s}T12:00:00`);
  const plus = (s, n) => ymd(new Date(at(s).getTime() + n * D));
  const daysBetween = (a, b) => Math.round((at(b) - at(a)) / D);
  const hourLabel = h => `${h % 12 || 12}:00 ${h >= 12 ? 'PM' : 'AM'}`;
  const today = new Date();
  const nextDow = dow => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + ((dow - d.getDay() + 7) % 7 || 7)); return ymd(d); };

  /* ---------- state (kept per tab so the landing page can hand a trip to booking.html) ---------- */
  const fresh = () => ({
    place: '', returnPlace: '', mode: 'days', pDate: plus(ymd(today), 1), time: '09:00', rDate: plus(ymd(today), 2),
    extras: { seat: false, driver: false }, guest: { name: '', email: '', phone: '' }, agree: false
  });
  const state = fresh();
  try {
    const saved = JSON.parse(sessionStorage.getItem(DRAFT) || '{}');
    Object.assign(state, saved, { extras: { ...state.extras, ...(saved.extras || {}) }, guest: { ...state.guest, ...(saved.guest || {}) } });
  } catch { /* storage unavailable */ }
  const saveDraft = () => { try { sessionStorage.setItem(DRAFT, JSON.stringify(state)); } catch { /* ignore */ } };
  function resetTrip() { const g = state.guest; Object.assign(state, fresh(), { guest: g }); saveDraft(); }
  if (!ZONE[state.place]) state.place = '';
  if (state.returnPlace && !ZONE[state.returnPlace]) state.returnPlace = '';
  if (!state.pDate || state.pDate < ymd(today)) { const f = fresh(); Object.assign(state, { pDate: f.pDate, rDate: state.mode === 'half' ? '' : f.rDate }); }

  /* ---------- storage ---------- */
  function bookings() {
    try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v.filter(b => b && b.id && b.trip) : []; }
    catch { return []; }
  }
  function saveBookings(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch { toast('Could not save in this browser.'); return false; }
  }

  /* ---------- trip, validation, pricing ---------- */
  function trip() {
    if (!state.place || !state.pDate) return null;
    const from = new Date(`${state.pDate}T${state.time}:00`);
    if (isNaN(from)) return null;
    let to;
    if (state.mode === 'half') to = new Date(from.getTime() + 12 * H);
    else { if (!state.rDate) return null; to = new Date(`${state.rDate}T${state.time}:00`); }
    if (isNaN(to)) return null;
    return { from, to, mode: state.mode, place: state.place, returnPlace: state.returnPlace || state.place };
  }
  function validate() {
    if (!state.place) return 'Choose a pickup location.';
    if (!state.pDate) return 'Pick a pickup date on the calendar.';
    if (state.mode === 'days' && !state.rDate) return 'Select a return date on the calendar.';
    const t = trip();
    if (!t) return 'Check your dates.';
    if (t.from.getTime() < Date.now() + 5 * 60000) return 'Pick-up must be in the future. Choose a later time or date.';
    if (state.mode === 'days' && t.to.getTime() - t.from.getTime() < D) return 'Whole-day rentals start at 24 hours. Choose a later return date.';
    if (t.to.getTime() - t.from.getTime() > 30 * D) return 'For this demo, choose a rental of 30 days or less.';
    return '';
  }
  function quote(t, extras = state.extras) {
    const rate = ZONE[t.place] === 'metro' ? RATES.metro : RATES.outside;
    const half = t.mode === 'half';
    const days = half ? 1 : Math.max(1, Math.round((t.to - t.from) / D));
    const base = half ? Math.round(rate * 0.65 / 50) * 50 : rate * days;
    const lines = [{ label: half ? '12-hour rental' : `${days} ${days === 1 ? 'day' : 'days'} × ${money(rate)}`, amount: base }];
    const free = half ? 0 : Math.floor(days / 4);
    if (free) lines.push({ label: `Book 3, get 1 free (${free} ${free === 1 ? 'day' : 'days'})`, amount: -rate * free, promo: true });
    Object.keys(EXTRAS).filter(k => extras[k]).forEach(k => lines.push({ label: EXTRAS[k].label, amount: EXTRAS[k].day * days }));
    const oneWay = t.place !== t.returnPlace ? ONE_WAY : 0;
    if (oneWay) lines.push({ label: 'Different return location', amount: oneWay });
    return { rate, days, base, lines, oneWay, total: lines.reduce((n, l) => n + l.amount, 0) };
  }
  function isFree(from, to) {
    const s = from.getTime(), e = to.getTime();
    return !bookings().some(b => {
      if (b.status === 'cancelled') return false;
      const bs = new Date(b.trip.pickupDate).getTime(), be = new Date(b.trip.returnDate).getTime();
      return !isNaN(bs) && !isNaN(be) && s < be + BUFFER && e > bs - BUFFER;
    });
  }
  function nextSlot(t) {
    const len = t.to - t.from;
    for (let h = 1; h <= 24 * 90; h++) {
      const from = new Date(t.from.getTime() + h * H);
      if (from.getHours() < 6 || from.getHours() > 21) continue;
      if (from.getTime() < Date.now() + 5 * 60000) continue;
      if (isFree(from, new Date(from.getTime() + len))) return from;
    }
    return null;
  }

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg) {
    const el = $('#toast'); if (!el) return; el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
  }

  /* ---------- keyword reading of the landing prompt (not AI) ---------- */
  const GENERIC = new Set(['city', 'of']);
  const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const NUMWORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
  function matchCity(text) {
    const q = text.trim().toLowerCase(); if (!q || /^(metro\s*manila|ncr)$/.test(q)) return null;
    return CITIES.find(c => q.includes(c.v.toLowerCase()) || q.includes(c.l.toLowerCase()))
      || CITIES.find(c => c.l.toLowerCase().split(/[\s,/]+/).some(w => w.length > 3 && !GENERIC.has(w) && q.includes(w)))
      || CITIES.find(c => c.v.toLowerCase().startsWith(q)) || null;
  }
  const numDur = n => n < 1 ? null : n > 30 ? { bad: true } : { n };
  function parseDur(raw) {
    const t = raw.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/g, w => NUMWORDS[w]);
    if (/\bweekend\b/.test(t)) return { n: 2 };
    let m = t.match(/(\d+)\s*-?\s*(?:hours?|hrs?)\b/);
    if (m) return +m[1] === 12 ? { half: true } : { bad: true };
    if ((m = t.match(/(\d+)\s*-?\s*weeks?\b/))) return numDur(+m[1] * 7);
    if (/\b(?:a|1)[\s-]*week\b|\bweek[\s-]*long\b/.test(t)) return { n: 7 };
    if ((m = t.match(/(\d+)\s*-?\s*(?:days?|nights?)\b/))) return numDur(+m[1]);
    if (/\b(?:a|1)\s+(?:day|night)\b|\bovernight\b/.test(t)) return { n: 1 };
    return null;
  }
  function parseDate(t) {
    if (/\b(tomorrow|tmrw)\b/.test(t)) return ymd(new Date(Date.now() + D));
    if (/\b(today|tonight)\b/.test(t)) return ymd(new Date());
    let m = t.match(/\b\d{4}-\d{2}-\d{2}\b/); if (m) return m[0];
    const mo = MONTHS.join('|'); let mi = -1, da = 0;
    if ((m = t.match(new RegExp(`\\b(${mo})[a-z]*\\.?\\s+(\\d{1,2})\\b`)))) { mi = MONTHS.indexOf(m[1]); da = +m[2]; }
    else if ((m = t.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${mo})[a-z]*\\b`)))) { mi = MONTHS.indexOf(m[2]); da = +m[1]; }
    if (mi >= 0 && da >= 1 && da <= 31) {
      const d = new Date(today.getFullYear(), mi, da, 12);
      if (d.getMonth() !== mi) return null;
      if (ymd(d) < ymd(today)) d.setFullYear(d.getFullYear() + 1);
      return ymd(d);
    }
    if ((m = t.match(new RegExp(`\\b(${WEEKDAYS.join('|')})\\b`)))) return nextDow(WEEKDAYS.indexOf(m[1]));
    if ((m = t.match(/\b(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/))) return nextDow(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(m[1].slice(0, 3)));
    if (/\bweekend\b/.test(t)) return nextDow(6);
    return null;
  }
  function parseTime(t) {
    let m, h;
    if ((m = t.match(/\b(\d{1,2})(?::\d{2})?\s*(a\.?m\.?|p\.?m\.?)/))) h = (+m[1] % 12) + (m[2][0] === 'p' ? 12 : 0);
    else if ((m = t.match(/\b(\d{1,2}):00\b/))) h = +m[1];
    else if (/\bnoon\b/.test(t)) h = 12; else if (/\bmorning\b/.test(t)) h = 9; else if (/\bafternoon\b/.test(t)) h = 14; else if (/\bevening\b/.test(t)) h = 18;
    else return null;
    return h < 6 || h > 21 ? null : h;
  }
  /* Read a sentence without touching the draft (used by the live preview on the landing page). */
  function read(text) {
    const t = text.toLowerCase();
    return { city: matchCity(t), date: parseDate(t), hour: parseTime(t), dur: parseDur(t) };
  }
  /* Fill the draft from a sentence like "4 days in Baguio, leaving Friday at 2pm". */
  function prefill(text) {
    const t = text.toLowerCase();
    const len = state.mode === 'half' ? 1 : Math.max(1, daysBetween(state.pDate, state.rDate || plus(state.pDate, 1)));
    const c = matchCity(t); if (c) state.place = c.v;
    const date = parseDate(t); if (date) state.pDate = date;
    const h = parseTime(t); if (h !== null) state.time = pad(h) + ':00';
    const d = parseDur(t);
    if (d && d.half) { state.mode = 'half'; state.rDate = ''; }
    else if (d && d.n) { state.mode = 'days'; state.rDate = plus(state.pDate, d.n); }
    else if (state.mode === 'days') state.rDate = plus(state.pDate, len);
    saveDraft();
  }


  /* ---------- booking records: ticket, calendar file, cancel (used by booking.html and track.html) ---------- */
  const findBooking = ref => bookings().find(x => x.id.toLowerCase() === String(ref || '').trim().toLowerCase());
  const stageIndex = b => { const i = STAGES.findIndex(s => s[0] === b.workflowStage); return i < 0 ? 0 : i; };
  function barcode(ref) {
    let x = 0, out = '';
    for (let i = 0; i < 44; i++) {
      const c = ref.charCodeAt(i % ref.length) + i * 7;
      const w = 1 + (c % 3); x += 2 + (c % 2); out += `<rect x="${x}" y="0" width="${w}" height="38" rx=".4"/>`; x += w;
    }
    return `<svg viewBox="0 0 ${x + 4} 38" preserveAspectRatio="none" aria-hidden="true">${out}</svg>`;
  }
  function ticketHTML(b) {
    const from = new Date(b.trip.pickupDate), to = new Date(b.trip.returnDate);
    const cancelled = b.status === 'cancelled', idx = stageIndex(b), total = Number(b.price?.total || 0);
    return `<article class="ticket ${cancelled ? 'is-cancelled' : ''}">
        <div class="ticket-main">
          <div class="ticket-brand"><img src="assets/everyride-logo.webp" alt="" width="34" height="34"><span>every<b>ride</b></span><em>Mitsubishi Xpander GLS</em></div>
          <div class="route">
            <div><small>Pick-up</small><strong>${esc(PLACE_LABEL[b.trip.pickupLocation] || b.trip.pickupLocation)}</strong><span>${fmtFull(from)}</span></div>
            <svg viewBox="0 0 60 12" aria-hidden="true"><path d="M2 6h50m-6-5 6 5-6 5"/></svg>
            <div><small>Return</small><strong>${esc(PLACE_LABEL[b.trip.returnLocation] || b.trip.returnLocation)}</strong><span>${fmtFull(to)}</span></div>
          </div>
          ${cancelled ? '' : `<ol class="timeline" aria-label="Booking status">${STAGES.map((s, i) => `<li class="${i < idx ? 'done' : ''} ${i === idx ? 'now' : ''}"><i></i><span>${s[1]}</span></li>`).join('')}</ol>`}
        </div>
        <div class="ticket-stub">
          <small>Reference</small><strong class="ref">${esc(b.id)}</strong>
          <div class="bars">${barcode(b.id)}</div>
          <small>Estimated total</small><strong>${money(total)}</strong>
        </div>
      </article>`;
  }
  function downloadICS(id) {
    const b = findBooking(id); if (!b) return;
    const f = s => s.replace(/[-:]/g, '').slice(0, 15);
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Everyride//Demo//EN', 'BEGIN:VEVENT', `UID:${b.id}@everyride.demo`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
      `DTSTART:${f(b.trip.pickupDate)}00`, `DTEND:${f(b.trip.returnDate)}00`, 'SUMMARY:Everyride · Mitsubishi Xpander GLS', `LOCATION:${PLACE_LABEL[b.trip.pickupLocation] || b.trip.pickupLocation}`,
      `DESCRIPTION:Booking reference ${b.id} (demo request)`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = `everyride-${b.id}.ics`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 500);
  }
  function cancelBooking(id, btn, done) {
    if (btn.dataset.armed !== '1') { btn.dataset.armed = '1'; btn.textContent = 'Tap again to confirm cancel'; setTimeout(() => { btn.dataset.armed = ''; btn.textContent = 'Cancel booking'; }, 4000); return; }
    const list = bookings(), b = list.find(x => x.id === id); if (!b) return;
    b.status = 'cancelled'; b.cancelledAt = new Date().toISOString();
    if (saveBookings(list)) { toast('Booking cancelled.'); if (done) done(id); }
  }
  /* data-copy / data-ics / data-cancel buttons work the same on every page */
  function bindActions(onChange) {
    document.addEventListener('click', e => {
      const c = e.target.closest('[data-copy]');
      if (c) { (navigator.clipboard?.writeText(c.dataset.copy) || Promise.reject()).then(() => toast(c.dataset.msg || 'Copied.')).catch(() => toast(c.dataset.copy)); return; }
      const ics = e.target.closest('[data-ics]'); if (ics) { downloadICS(ics.dataset.ics); return; }
      const cx = e.target.closest('[data-cancel]'); if (cx) cancelBooking(cx.dataset.cancel, cx, onChange);
    });
  }

  /* ---------- URL prefill: booking.html?to=Baguio&from=2026-12-12&days=3 (&mode=half) ---------- */
  function applyUrl() {
    const q = new URLSearchParams(location.search); if (![...q.keys()].length) return false;
    const to = q.get('to'), from = q.get('from'), days = parseInt(q.get('days'), 10);
    const c = to && CITIES.find(x => x.v.toLowerCase() === to.toLowerCase()); if (c) state.place = c.v;
    if (from && /^\d{4}-\d{2}-\d{2}$/.test(from) && from >= ymd(today)) state.pDate = from;
    if (q.get('mode') === 'half') { state.mode = 'half'; state.rDate = ''; }
    else if (days >= 1 && days <= 30) { state.mode = 'days'; state.rDate = plus(state.pDate, days); }
    saveDraft(); history.replaceState(null, '', location.pathname + location.hash);
    return true;
  }

  window.ER = {
    $, $$, KEY, VERSION, H, D, RATES, EXTRAS, ONE_WAY, PLACES, PLACE_LABEL, ZONE, ZONE_NAME, CITIES, TIMES, PHOTOS, STAGES,
    pad, ymd, local, money, esc, fmtDay, fmtTime, fmtFull, fmtLong, at, plus, daysBetween, hourLabel, today, nextDow,
    state, saveDraft, resetTrip, bookings, saveBookings, trip, validate, quote, isFree, nextSlot, toast, prefill, read,
    findBooking, stageIndex, ticketHTML, downloadICS, cancelBooking, bindActions, applyUrl
  };
})();
