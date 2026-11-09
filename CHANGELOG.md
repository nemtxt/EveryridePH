# Changelog

## v41
- Mobile pass modelled on apple.com/ph and tesla.com. New `css/mobile.css` and `js/nav.js` (delete both and their tags to get v40 back).
- One slim header on every page: logo, a white "Book now" pill and a two-line menu button. Tapping it opens a full-screen black menu with large type (Book the Xpander, Track booking, The car, Rates, then Explore links), staggered fade-in, X close, Esc to close, page scroll locked while open. On the landing page the bar is clear over the photo and turns black once you scroll.
- Laptop and tablet widths (861px and up): links sit centred in the bar like apple.com, no menu button.
- Booking: stepper is now four dots with only the current step named (it was cut off at step 4); frosted bottom bar with a big Back / Next; confirmation and tracking buttons in a tidy two-column grid.
- Fixed the page being 28px wider than the screen on the car and details steps (the slide-in animation), so no sideways panning.
- Landing: shorter search placeholder so it is no longer cut off, balanced hero text, floating "Book the Xpander" button removed (the bar already has Book now), section anchors stop below the bar.
- Fixed the car showcase photo on the landing page (it was a broken path, so the section showed plain black).
- Version label is now v41.

## v40
- Cleanup, no new files. Hero now has one job: heading, one search bar and a quiet "Explore the car" link (removed the duplicate Book now / Explore buttons, rate line, "Track your request" line, label above the heading and the hidden ticker).
- Headers match on every page: booking shows only "Track booking", tracking shows only "Book now".
- All green-tinted greys are now neutral greys; one radius scale (cards 20px, fields 14px), one heading/number weight (600), one blue link colour. Native controls and scrollbars are light on the light pages (were dark).
- Removed unused CSS (idea chips, trip chips, ticker, city pills) and the unused Sora font request; scroll-snapping removed so scrolling is predictable.

## v39
- New `css/responsive.css` (delete it and its tags to get v38). Phone, tablet, laptop and wide-screen layouts; larger readable booking text; 44px tap targets; safe-area padding for notched phones; frosted bottom bar and swipeable stepper on phones; landscape-phone rules; hover effects off on touch. Quieter hero (eyebrow and rate line hidden on phones).

## v38
- Removed the live trip chips (place and price) and the three idea chips under the hero prompt. New `css/apple.css` (delete it and its tags to get v37): SF-style type, frosted search bar, scroll-driven hero zoom and fade, alternating black/white/grey sections, Apple-style segmented controls and soft cards on booking and tracking, blue focus rings.

## v37
- New `css/vibe.css` (delete it and its tags to get v36). Landing rebuilt as full-screen sections: bright photo hero with Book now / Explore the car, Xpander showcase with spec row, photo grid, three steps, places, rates, FAQ and a closing call to action. Booking and tracking pages get a calmer white/black look.

## v36
- New `css/polish.css` and `js/fx.js` (delete both, plus their tags, to get v35 back). Existing logic and styles are untouched apart from `ER.read()` in core.js.
- Landing: staggered load-in, typing hint, a live reader that shows the place, length, date, time and estimated price as you type, count-up prices, staggered reveals, smooth FAQ, phone "Book" button after the hero.
- Booking: bigger text and tap targets, steps slide forward/back, calendar days pop, photos fade, errors shake, confetti and a dropping ticket on confirmation.
- Tracking: cards rise in, status line fills. Smooth page-to-page transitions where the browser supports them. All motion off with reduced-motion.

## v35.1
- New standalone `track.html`: centered reference box, then the request details below (status ticket, trip, price breakdown, driver, actions: copy reference/link, add to calendar, cancel). Lists bookings saved on this device when the box is empty.
- The tracking drawer is gone from the booking page; "Track booking" links to the new page, and the confirmation links straight to the booking.
- Booking: arrow-key navigation and hover preview on the calendar, live estimate in the bottom bar, per-field errors on the details form, "what happens next" on the confirmation, URL prefill (`?to=&from=&days=`).
- Landing: solid header after scrolling, new "Where we hand over the Xpander" city cards that start a booking, richer footer, skip links, social/SEO meta, reduced-motion support, better small-phone headers.

## v35
- Booking is now its own page, `booking.html`, with its own script and styles; `index.html` is only the landing page. Shared logic lives in `js/core.js`.
- New first step "Pick your rental dates": pickup and return location, Half day / Whole day toggle, calendar range picker and a rental summary card with a timeline, duration and estimated rate.
- Steps: Dates → Your Xpander → Details → Confirmation, with a stepper and a bottom bar ("Next: Your Xpander").
- The results/map step and the plan form were removed; the landing prompt prefills the booking page.
- Unused CSS removed from the shared stylesheet.

## v34
- Landing prompt and plan form (replaced the v33 wizard card).
