# P-CRM Security Demo Script

## How to demo Layer 1 (Rate Limiting) to judges:
- Submit 3 complaints quickly
- On the 4th attempt, show the red error:
  "Too many submissions. Maximum 3 complaints per hour. Try again in 59 minutes."
- Show the 429 status in Network tab
- Say: "A bot sending 10,000 requests hits this wall at attempt 4."

## How to demo Layer 2 (AI Bouncer) to judges:
- Type "asdfghjkl test test 123" in the complaint box, select any category
- Click Submit
- Show the error: "Your submission could not be processed. Please describe your civic issue clearly."
- Then type a real complaint: "No water supply in my building for 3 days"
- Show it goes through immediately
- Say: "Our AI distinguishes between spam and a frustrated citizen writing poorly."

## The Judge Answer (memorize this):
"We replaced login with a 2-layer invisible security stack.
Layer 1: Rate limiting blocks more than 3 submissions per hour per IP — a bot hitting 10,000 requests gets blocked at attempt 4 with a 429 error.
Layer 2: Gemini AI rejects gibberish and spam before it touches our database, while always allowing genuine complaints even if written poorly."
