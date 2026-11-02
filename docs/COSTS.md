# Cost controls and measurement

Default model: gpt-5.4-mini. Official model page checked 2026-11-02 lists $0.75 input and $4.50 output per million tokens:
https://developers.openai.com/api/docs/models/gpt-5.4-mini

Image sizing/token rules:
https://developers.openai.com/api/docs/guides/images-vision

Offline cost: $0. One later live component check used 2,098 input and 99 output tokens, calculated at US$0.002019. See LIVE_VALIDATION.md. Live hourly cost is not measured and billing has not been reconciled.

Default: 6 images per analysis, approximately 60 analyses/hour. Reservation per analysis uses `(images × 3000 + 4000) × input_price / 1e6 + 1200 × output_price / 1e6`. With six images and default prices, reserve is $0.0219. This is a conservative working estimate for this model's high-detail patch ceiling, not an invoice estimate or a provider-enforced cap. At 60 calls, the corresponding reserved-amount ceiling is $1.314/hour; actual usage may be much lower. A $1 session budget can pause earlier. Custom models/prices require reviewing sizing and reservations before use.

The actual usage from each completed response is saved in local data/usage.jsonl. Output/reasoning token billing is included in output_tokens. Cached input is conservatively charged at the standard input price. Missing usage, timeout, API error or process crash retains the reserved estimate as consumed. This intentionally overcounts uncertain charges. Incomplete and invalid JSON responses still consume usage. No automatic retries and no per-viewer model call.

Ten-minute live measurement worksheet (pending operator run):

| Measure | Result |
| --- | --- |
| Model and pricing date | Pending |
| Actual elapsed minutes | Pending |
| Calls / failed calls | Pending |
| Total input / output tokens | Pending |
| API calculated cost | Pending |
| Billing dashboard cross-check | Pending |
| Estimated hourly cost = measured cost / measured minutes × 60 | Pending |
| Hosting / static upload / traffic cost | Separate, pending |

Paid usage can continue for a request already submitted when Pause is clicked. The code persists reservations before network calls. Editing/deleting data manually can invalidate budget history; do not use a fresh session to claim continuity of the previous budget.
