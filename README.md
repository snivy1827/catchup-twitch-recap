# CatchUp — visual catch-up for Twitch

Late to the stream. Right in the story.

A local-first prototype that samples an OBS game source, builds evidence-backed progress notes with a vision model, and answers `!recap` / `!回顧` in Twitch chat. Viewers can read illustrated event cards without interrupting the stream.

**Status:** offline demo and nine automated tests pass. Real OBS → OpenAI → Twitch chat command/reply and cooldown have passed in an offline channel using the broadcaster account; see [Twitch validation](docs/TWITCH_VALIDATION.md). On-air and second-viewer-account tests remain pending. This is not yet a submitted hackathon entry.

## Run the offline demo (no keys, no npm, no API charges)

Install Node.js 24 or newer. Open a terminal in this folder:

```sh
node src/server.mjs
```

Open http://localhost:3000 . Click **Simulate one minute** to add an illustrated event, or **Start session** to run an accelerated simulation (one minute of fixture progress every three seconds). Open **Viewer recap** for the read-only view. **Send** simulates a chat command locally; a second request is suppressed by cooldown. It never posts to Twitch.

The original synthetic game artwork and observations are explicitly marked SCRIPTED FIXTURE. They verify the workflow, not AI accuracy. After ten simulated minutes a chapter appears. Pause or End stops the schedule. Create archives the previous session and starts a fresh one. Restarting the server restores the last session paused.

## Test

```sh
node --test tests/*.test.mjs
```

Tests need permission to bind a localhost port (31347). They exercise the offline HTTP flow, persistence, CSRF protection, chat throttling, evidence validation, publication delay, budget reservations, and mocked API payloads. They do not prove live external-service compatibility.

## Live setup

1. Copy `.env.example` to `.env` and fill values locally. Never publish `.env` or the `data/` directory.
2. Configure an OpenAI API key, a vision-capable model and its current prices. Default: `gpt-5.4-mini`, $0.75 input / $4.50 output per million tokens, checked 2026-11-02. Account access must be checked separately.
3. Enable OBS WebSocket Server, set its password and configure `OBS_PASSWORD`. Run OBS with a visible game input.
4. Start with environment loading:

```sh
node --env-file=.env src/server.mjs
```

5. Click List OBS sources, select the game input and Use. Create a **Live · OBS + AI** session, then Start. Keep OBS on that source. Six screenshots are collected at ten-second intervals before the first model request. Subsequent analysis follows the same schedule; busy periods create recorded gaps.
6. Configure and authorize Twitch using [TWITCH_SETUP.md](docs/TWITCH_SETUP.md). The prototype posts **as the broadcaster**, not a separate bot identity. Only connect it to a channel you authorize.
7. Have a viewer type `!recap` in the actual channel. Verify both `is_sent` and visible chat output; record the result in [verification.md](docs/verification.md).

## Illustrated public recap

The server binds to `127.0.0.1` only. A localhost link is not accessible to viewers. Do NOT tunnel this server or publish its admin interface.

```sh
node --env-file-if-exists=.env scripts/export.mjs
```

Upload ONLY the four generated `exports/` files (`index.html`, `style.css`, `app.js`, `recap.json`) to an HTTPS static host. Set `PUBLIC_RECAP_URL` to that public URL and restart the local server. Re-run export and upload when you want a newer snapshot. The exported page clearly states its observation timestamp. Live automatic publishing is deferred. Exported images/data are public: review them before uploading.

## Cost and limitations

- 360 sampled images and about 60 model requests per hour at the default schedule. Chat commands reuse stored results without another AI call.
- Default session budget $1. A conservative amount is reserved before each call. Missing usage and failed requests are charged at the reserved estimate; budget accounting survives restart. This is an application-side estimate, not a billing-provider hard cap.
- Default pricing logic is calibrated to the selected `gpt-5.4-mini` high-detail patch ceiling. Changing models requires reviewing token ceilings, pricing and request parameters in `src/server.mjs` and `src/vision.mjs`; an environment model change alone does not establish a safe estimate.
- Sampling can miss transient events. No audio transcription or action-by-action reconstruction. Only activity after activation is observed.
- A 30-second publication delay is the default. Measure actual Twitch delay and increase `PUBLISH_DELAY_SECONDS` to prevent spoilers. The app does not automatically measure it.
- Up to 100 evidence frames are retained; earlier text events remain after their image is pruned. Raw non-evidence frames are not saved.
- Local state contains screenshots; local Twitch tokens are stored in `data/twitch-private.json`. Protect your OS account and folder. Neither is included in the ZIP. No telemetry.
- No paid API retries; errors and gaps are visible. 401/403/429 pause analysis. Resolve the issue before resuming.
- See [implementation decisions](docs/IMPLEMENTATION.md), [cost method](docs/COSTS.md), and [contest checklist](docs/SUBMISSION.md).

## Package

On Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package.ps1
```

Produces `dist/catchup-demo-v0.1.zip` and `SHA256.txt` using an explicit source allowlist. `data/`, `.env`, exports and credentials are excluded. A ZIP supplements, but does not replace, the repository URL required by the competition.

## Troubleshooting

- `node` not found: install Node.js and reopen your terminal. No npm is needed.
- Connection refused: keep the server terminal open and use http://localhost:3000 (not HTTPS).
- CSRF / invalid host: use localhost:3000 consistently, refresh the control page, do not use a proxy.
- OBS failure: check running OBS, WebSocket enabled, password, local port 4455, and selected visible game source.
- No chat reply: inspect Twitch connection status, OAuth scopes, token client ID, cooldown and AutoMod.
- Blank/stale public page: host all four export files over HTTP(S), not `file://`; export/upload again.

MIT licensed code and original fixture art. Third-party games, broadcast footage and music require their own usage rights.
