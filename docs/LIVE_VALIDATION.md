# Live component validation — 2026-11-02

This report supplements the original offline verification. It does not claim Twitch end-to-end validation.

## OBS: PASS

- OBS Studio 33.0.0, local authenticated WebSocket, port 4455.
- WebSocket enable setting was confirmed and saved. Local .env was synchronized to the existing OBS-generated password without changing that credential or printing it.
- Created a game_capture input named `CatchUp TapTapLoot` in the current scene.
- Selected exactly `TapTapLoot:UnityWndClass:TapTapLoot.exe`; full-desktop capture was not used.
- JPEG screenshot captured at 960×540. Visible character, enemies, platform and chest; most of this desktop-overlay game's background is black.
- Real OBS returns the data URL MIME type `image/jpg`. The adapter now accepts jpg/jpeg and normalizes to image/jpeg; its mocked protocol test covers that variant.

## OpenAI visual analysis: PASS

- One real Responses API request, model `gpt-5.4-mini`.
- Three real OBS screenshots sampled at 2-second intervals for this short component check (not the normal 10-second production schedule).
- No microphone/audio input.
- Response completed and passed local observation/evidence validation.
- Input: 2,098 tokens. Output: 99 tokens. Total: 2,197 tokens.
- Estimated API cost using configured standard prices: US$0.002019. Billing dashboard has not been reconciled; this is a calculated amount, not an invoice.
- The model described a small player, green slime-like enemies, a narrow stone platform and a chest/crate-like object. It reported no clear readable progress indicators and no confirmed interaction across the frames.
- Events array was empty. This is a valid conservative result; a short near-static sample cannot establish prior progress or victory.

Local evidence: `data/live-check/latest.json`, timestamped report JSON, and `sample-0.jpg` to `sample-2.jpg`. These contain gameplay and are deliberately excluded from source ZIPs and GitHub uploads.

## Still pending

- A longer live game sample with manually confirmed changing events.
- Twitch developer application, OAuth, actual chat instruction and visible reply.
- Public HTTPS recap deployment.
- Recorded demonstration, English captions, public YouTube upload and submission.

## Repeat the one-request check

```sh
node --env-file=.env scripts/verify-live.mjs
```

Requires OBS running with the selected game source and a valid funded API key. It submits exactly one model request after three captures, records usage locally, and refuses estimates above US$0.05. It does not start streaming or recording. Repeating it incurs a new API charge.
