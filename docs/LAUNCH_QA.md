# Vibe Check Launch QA

## Production gate

### Search
- [ ] Restaurant queries return restaurants, not unrelated place types.
- [ ] Coffee queries return coffee/cafe businesses.
- [ ] Empty searches do not make an API request.
- [ ] Empty results have a useful recovery message.
- [ ] Search failures do not expose raw server errors.

### Place experience
- [ ] Photos load or gracefully fall back.
- [ ] Open/closed status is displayed correctly when available.
- [ ] Google rating remains clearly separate from Vibe Check signals.
- [ ] View Vibe opens the correct place.
- [ ] Google Maps link opens the selected place.

### Live community
- [ ] Check-in selector uses only the five supported vibes.
- [ ] A first check-in appears in the live community counts.
- [ ] Submitting the same vibe twice does not inflate the count.
- [ ] Changing a vibe updates the existing anonymous check-in rather than creating a second one.
- [ ] Check-ins expire after three hours.
- [ ] Rate limiting does not block ordinary use.
- [ ] API/storage failure degrades gracefully.

### Analytics
- [ ] Search events are accepted.
- [ ] Place views are accepted.
- [ ] Check-in opens are accepted.
- [ ] Check-in submissions/updates are accepted.
- [ ] Analytics failures never block the product.
- [ ] Analytics summary endpoint requires `ANALYTICS_ADMIN_TOKEN`.
- [ ] No analytics payload contains names, addresses, emails, cookies, or other direct identifiers.

### Business
- [ ] Business page loads without affecting Explore.
- [ ] Business leads are not publicly readable.
- [ ] Lead submissions validate email.
- [ ] Lead spam/rate limiting works.

### Mobile
- [ ] Search is comfortable to use one-handed.
- [ ] Place cards do not overflow horizontally.
- [ ] View Vibe modal fits the viewport.
- [ ] Emoji buttons are easy to tap.
- [ ] Map pins remain usable.

## Launch decision

Do not publicly promote until all critical items above are verified against the production deployment.
