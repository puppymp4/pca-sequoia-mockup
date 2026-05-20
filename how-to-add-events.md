# How to Add an Event (60 seconds, no code)

The whole calendar lives in one file: **`events.json`**. The site renders from that file. Add an event there, push, the site updates everywhere it shows up (home page + events page).

## The workflow

1. Open `events.json` in any text editor (VS Code, Notepad, anything).
2. Copy the last event block.
3. Paste it above the closing `]`.
4. Edit the fields (date, title, location, etc).
5. Save.
6. Push to the repo. The site rebuilds in ~30 seconds on Vercel.

That is it. No CMS login. No clicking around. No re-deploying anything by hand.

## What each field does

```json
{
  "id": "may-dinner-2026",                                  // unique slug, kebab-case
  "month": "May",                                           // shown big on the date badge
  "day": "23",                                              // shown big on the date badge
  "year": 2026,                                             // used for sorting
  "isoDate": "2026-05-23",                                  // used for sorting (YYYY-MM-DD)
  "title": "May Dinner at Vern's House",                    // the event headline
  "category": "Dinner",                                     // pill shown on the card (Dinner / Cars and Coffee / Driving Tour / Auto X)
  "startTime": "6:30 PM",
  "endTime": "10:30 PM",                                    // leave "" if no end time
  "location": "Vern's House, Fresno CA",
  "description": "Long form description shown when the event is expanded.",
  "thumbnail": "https://path-to-flyer-image.jpg",           // leave "" to show Coming Soon block
  "rsvpRequired": true,                                     // true = RSVP form appears in the expanded panel
  "paymentRequired": true,                                  // true = payment button + price pill appear
  "pricePerPerson": 35,                                     // dollar amount, integer
  "paymentLink": "https://buy.stripe.com/xxxxxxx",          // your Stripe Payment Link (or empty)
  "isComingSoon": false                                     // true = hides RSVP and shows "Coming Soon"
}
```

## How dates sort

Events sort by `isoDate` ascending. The next upcoming event is always at the top. Past events do not get removed automatically (use the cleanup step below).

## Cleanup past events (once a month)

After an event has passed, just delete that block from `events.json`. Or move it into a separate `past-events.json` if you want history. Don't leave them on the upcoming list because they will clutter the calendar.

## Adding a new payment-required event

1. Create a Stripe Payment Link (see options doc).
2. Paste the link URL into the `paymentLink` field.
3. Set `paymentRequired: true` and fill in `pricePerPerson`.
4. Save and push.

## RSVPs go to your inbox

RSVPs submit through Formspree (free up to 50/month, $10/mo above). Once the Formspree endpoint is set in `main.js`, every RSVP arrives in the inbox you connect, with event title and date in the subject line.

## File checklist when something looks wrong

- Did you forget a comma between event blocks? JSON is strict.
- Did you use straight quotes `"` and not curly quotes `"`?
- Did `isoDate` match the actual `month` + `day`? They should agree.
- Is `paymentRequired` true but `paymentLink` empty? The pay button will not show.
