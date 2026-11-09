# Everyride — Direct (v41)

v41 adds `css/mobile.css` and `js/nav.js`: Apple / Tesla style header and full-screen menu, phone layouts for every page.

v40 is a cleanup of v39: one hero action, matching headers, neutral palette, unused code removed.

v39 adds `css/responsive.css` (all screen sizes, more minimal).

v38 adds `css/apple.css` and removes the hero chips.

v37 adds `css/vibe.css`: full-bleed photo hero, a spec-row showcase for the car, big quiet type, pill buttons and light bands (Tesla / Apple feel).


v36 adds `css/polish.css` and `js/fx.js` (motion, bigger text, live trip preview).


Three pages, one demo:

- `index.html` — landing page (hero prompt, how it works, the car, rates, FAQ). Typing a sentence like "4 days in Baguio, leaving Friday at 2pm" prefills a trip (keyword matching, not AI) and opens the booking page.
- `booking.html` — the booking flow: **Dates** (pickup/return locations, half/whole day, calendar range picker, live summary) → **Your Xpander** (availability, add-ons, price) → **Details** (guest form) → **Confirmation** (booking pass). Routes by hash: `#dates`, `#car`, `#details`, `#pass/<ref>`; 

- `track.html` — standalone tracking page: the reference box sits in the middle and the request (status ticket, trip, price breakdown, driver) shows below it. Deep link: `track.html?ref=EVR-...`. With an empty box it lists bookings saved on this device. Bookings are read from this browser only.

Links can prefill a trip: `booking.html?to=Baguio&from=2026-12-12&days=3` (or `&mode=half`).

Files: `js/core.js` (constants, state, storage, pricing, text parsing), `js/home.js`, `js/booking.js`, `js/track.js`; `css/site.css` (shared + landing), `css/booking.css` (booking page), `css/track.css` (tracking page).

Run: `python -m http.server 5500` in this folder, then open http://localhost:5500

Pricing (edit at the top of `js/core.js`): ₱2,500 / 24h for Quezon City, Manila, Makati and Pasay pickups; ₱3,200 / 24h elsewhere; book 3 days get 1 free; 12-hour rental = 65% of the 24h rate rounded to ₱50; child seat ₱150/day, additional driver ₱180/day, different return place ₱950.

Bookings are stored in the browser under `everyride_demo_bookings_v1`, the same key and record shape as the main prototype, so both versions see the same bookings. Frontend demo only: no real reservations, payments or accounts.
