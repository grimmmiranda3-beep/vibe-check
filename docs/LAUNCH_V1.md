# Vibe Check Launch V1

## Product promise
Know the vibe before you go.

## Current MVP
- Google Places search
- Place photos, ratings, review counts, and open status
- Vibe categories
- Anonymous live check-ins
- 3-hour active vibe window
- Community vibe counts and score signal
- Review summary support
- Maps/place links
- For Businesses surface

## Launch priorities
1. Make the community/live signal obvious in the place experience.
2. Instrument search → place view → check-in open → check-in submitted/updated.
3. Keep anonymous check-ins abuse-resistant.
4. Capture qualified business interest without exposing lead data publicly.
5. Validate mobile UX before public promotion.

## Backend safeguards
- Check-in rate limit: 12 requests/minute per anonymous visitor.
- Search rate limit: 30 requests/minute per client.
- Business lead rate limit: 3 requests/hour per client.
- Business lead honeypot for simple automated spam.
- Analytics intentionally excludes names, addresses, emails, cookies, and other direct identifiers.
- Analytics events expire after 45 days.
- Business leads expire after 180 days.

## Launch metrics
Track:
- Searches
- Place views
- Check-in opens
- Check-ins submitted
- Check-ins updated
- Business page views
- Business leads

## Definition of launch-ready
- Search works for major place categories.
- No unrelated place types appear for targeted category searches.
- Check-in works anonymously and survives page refresh.
- Duplicate check-ins do not inflate counts.
- Community score updates after check-in.
- API failures degrade gracefully without breaking the app.
- No public endpoint exposes business lead records.
- Mobile layout is usable with one hand.
