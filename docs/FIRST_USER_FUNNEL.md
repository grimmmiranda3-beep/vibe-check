# Vibe Check — First-User Funnel

## Launch goal

Get a new visitor from the landing page to a meaningful anonymous check-in in under one minute.

## Core loop

1. **Landing** — immediately communicate: “Know the vibe before you go.”
2. **Search** — user searches a place type + location, e.g. `coffee Vacaville`.
3. **Place selection** — show recognizable businesses with photo, Google rating, open status, and Vibe Check signal.
4. **View Vibe** — make the live community signal and check-in action obvious.
5. **Check in** — user chooses one of the five core vibes without creating an account.
6. **Immediate feedback** — confirm “Your vibe is live” and show the updated community signal.
7. **Next action** — encourage checking another nearby place rather than requiring signup.

## Five core vibes

- 😍 Loved
- 😊 Chill
- 🔥 Energetic
- 😌 Relaxed
- 🥳 Party

These must remain consistent across place-level recommendations, the check-in selector, confirmation messaging, and community summaries.

## Launch UX rules

- Never require account creation for the first check-in.
- Keep the primary CTA visible without scrolling on mobile where possible.
- Search results must honor explicit category intent.
- A repeated selection by the same anonymous visitor must not inflate the live count.
- Changing a visitor's vibe updates their existing contribution instead of creating another active contribution.
- Community signals should clearly be distinguished from Google ratings and Vibe Check's place-level estimate.
- Empty states should tell the visitor exactly what to search for next.
- Errors should provide a retry path rather than leaving a blank results area.

## Analytics funnel

Track these events in order:

`search` → `place_view` → `checkin_open` → `checkin_submitted`

The launch analytics summary should report conversion between each stage and repeat usage when enough data exists.

## Manual release gate

Before inviting users, verify on desktop and mobile:

- `coffee Vacaville` returns coffee/cafe businesses rather than parks or unrelated places.
- `restaurants Vacaville` returns restaurants.
- `bars Vacaville` returns bars/nightlife.
- A place with no photo still renders cleanly.
- Open/closed status does not break the card.
- View Vibe opens and closes cleanly.
- Each of the five vibes can be selected.
- Submitting a vibe immediately updates the community result.
- Submitting the same vibe twice does not increase the count twice.
- Changing the vibe changes the visitor's existing contribution.
- Refreshing does not lose the anonymous visitor identity.
- API failures produce a usable error state.
- No console errors occur during the core loop.

## Definition of done

The first-user funnel is launch-ready when a new visitor can complete the entire loop without an account, without confusing category results, and with an immediate understanding of how their check-in affects the live vibe.