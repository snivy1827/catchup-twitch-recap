# Real Twitch command validation — 2026-11-02

**PASS: authenticated OBS → OpenAI visual recap → real Twitch chat command and reply.**

This was tested in the broadcaster's actual Twitch channel while the channel was offline. No live broadcast was started. It is a real EventSub/Helix integration test, not the local chat simulator and not a test from a second viewer account.

## Setup and result

- Developer application: CatchUp Visual Recap snivy1827, confidential client, Chat Bot category.
- Registered redirect: `http://localhost:3000/auth/twitch/callback`.
- Broadcaster completed 2FA and explicitly approved `user:read:chat` and `user:write:chat`.
- Token validation returned HTTP 200. EventSub connected successfully.
- A new live-mode session used the actual `CatchUp TapTapLoot` OBS input.
- Six screenshots were sampled over 51 seconds using the normal schedule. One OpenAI request completed. Analysis was paused after the 30-second publication delay, at elapsed 81 seconds.
- The real model described the player idle beside a chest/object. The sampled scene did not establish any unseen progress or victory.
- Broadcaster typed `!recap` in the actual channel. EventSub received it; Send Chat Message API reported success and the reply was visible in Twitch.
- Broadcaster immediately typed a second `!recap`. Cooldown suppressed the second response.

Observed counters after both commands:

```json
{"received":2,"suppressed":1,"sent":1,"failed":0,"aiCalls":1,"calculatedSessionCostUSD":0.004137,"status":"paused"}
```

The chat queries caused zero additional AI calls. This cost is calculated from response usage and configured prices, not reconciled against an invoice. The earlier three-image component test separately cost approximately US$0.002019.

## Evidence and fixes

Local private test evidence: `data/twitch-e2e/status-after-chat.json`, `recap-before-chat.json`; local screenshots are in `dist/`. Tokens and raw gameplay captures are excluded from source packages.

Testing found a state-only summary edge case: an empty events array caused a misleading “building recap” message even after analysis. The chat formatter now uses the analyzed timestamp so a conservative state-only observation is usable. A regression test covers it. Chat counters now distinguish received, suppressed, successfully sent and failed messages. **Nine automated tests pass.**

## Remaining limits

- A second-account viewer test, on-air live broadcast test, longer changing-game sample, and reconnect/revocation fault tests have not been performed.
- The illustrated viewer page is currently local. Static export is implemented; public HTTPS hosting is not yet configured.
- No YouTube upload or Devpost submission has been completed as of this report.
- This local prototype posts as the broadcaster. A separate bot identity requires a separate authorization design.
