# Verification report — v0.1

## Latest status — 2026-11-02

- **Submitted:** Devpost showed “Project submitted!” and “SUBMITTED TO Codex x TwitchCon Hackathon”; user performed the final submission. See [submission record](SUBMISSION.md).
- Public [source](https://github.com/snivy1827/catchup-twitch-recap) and [English-captioned demo (~2:45)](https://www.youtube.com/watch?v=hYGgMk6Mikw) are available.
- Nine automated tests passed again after this documentation/portfolio update (2026-11-02), without real paid API calls; the delivery version had also passed from an anonymously downloaded source copy. Real OBS → OpenAI → Twitch command/reply and cooldown passed in an offline channel using the broadcaster account.
- Local analysis is paused with no in-flight request at the last operational check: one request in that session, calculated US$0.004137, zero reserved budget. This is a dated local observation, not ongoing monitoring or invoice reconciliation.
- Free review: fresh download, Node.js 24+, `node src/server.mjs`; no `.env` or credentials needed. Run `node --test tests/*.test.mjs` for tests. Offline fixtures are scripted and do not establish AI accuracy. Live review needs the operator's own credentials and may incur their API costs.
- Remaining limits: no on-air, second-viewer-account or long changing-game accuracy test; no public hosted recap or automatic publishing; no audio analysis or measured user outcomes.
- Owner/Codex responsibilities are described in README and the portfolio. No award or production-readiness claim.

## Historical offline delivery report

The following records the initial delivery; later completion is stated above and in linked follow-up reports.

Date: 2026-11-02 (Asia/Taipei). Runtime: Node.js v24.22.1, Windows. No npm packages required. No paid API call or real Twitch chat message was made during this delivery.

**Later update:** real OBS capture and one paid visual API request have now passed; see [LIVE_VALIDATION.md](LIVE_VALIDATION.md). The original results below describe the earlier offline delivery. Twitch account-based validation subsequently passed within the limited scope in TWITCH_VALIDATION.md.

**Subsequent update:** the real Twitch `!recap` command/reply and cooldown now pass. Nine tests pass, including the new state-only-summary case. See [TWITCH_VALIDATION.md](TWITCH_VALIDATION.md) for actual counters and the offline-channel/broadcaster-account scope. Earlier Pending entries below are historical.

## Executed

Original command: `node --test` (current recommended command: `node --test tests/*.test.mjs`)

Result: **8 passed, 0 failed, 0 skipped**. The local HTTP test needs localhost networking permission; it passed after that permission was granted. No unresolved automatic-approval rejection.

| Check | Actual result | Evidence type |
| --- | --- | --- |
| OBS challenge authentication + source screenshot parameters | Pass | Mock WebSocket protocol; tests/adapters.test.mjs |
| Twitch scope/client validation, EventSub subscription and dropped chat handling | Pass | Mock fetch/WebSocket; tests/adapters.test.mjs |
| Duplicate delivery + channel/user cooldown | Pass | Unit test |
| Budget reservations and serialized persistence | Pass | Unit test |
| Reject invented evidence without partial commit | Pass | Unit test |
| Delay hides unreleased events/images/chapters | Pass | Unit test |
| Vision request sends ordered images and strict schema; incomplete response exposes usage | Pass | Mock HTTP API |
| Offline HTTP flow, blocked foreign-origin POST, chat simulation, protected file routes, JSON export and restart persistence | Pass | Real local HTTP server + child-process restart |
| Browser control page loads | Pass | In-app browser accessibility inspection at localhost:3000 |
| Click Simulate one minute twice | Pass | Browser shows 02:00, two event cards and zero AI calls |
| Source and viewer HTML semantics | Inspected via browser accessibility | Pixel screenshot capture unavailable; no pixel/layout screenshot verification claimed |
| Public static export | Pass | export.mjs generated four public files |
| Browser simulated !recap | Pass | Visible cached reply: CatchUp [2m], Old bridge; zero AI calls |
| ZIP contents | Pass | 29 source/document files; .env.example included; no data/, .env, token, exports or node_modules |
| Clean ZIP extraction | Pass | All 8 tests passed again from a fresh extracted directory |

Offline test artwork and scripted events do NOT validate AI accuracy. Local test state is excluded from the distributable.

## Historical checklist with current disposition

| Check | Status / required operator action |
| --- | --- |
| Real OBS server connection | Completed; LIVE_VALIDATION.md |
| Real image-model response | Completed short checks; no ten-minute accuracy claim |
| AI gameplay accuracy | Pending: compare at least five visible events over a 30-minute session |
| Real Twitch OAuth / token refresh | OAuth completed; long-running refresh/recovery remains unverified |
| Actual channel command and visible reply | Completed using broadcaster account in offline channel; no second-viewer test |
| Real disconnection/revocation recovery | Pending after live setup |
| Hosted HTTPS recap | Pending: publish only exported static files; snapshot is manual |
| Playback delay vs spoilers | Pending: measure actual stream delay |
| Live cost / billing comparison | Pending; no measured hourly claim |
| Public repository / YouTube / final Devpost form | Completed; SUBMISSION.md |

## Reproduce

1. Extract ZIP into a fresh directory.
2. Run `node --test tests/*.test.mjs` (allow localhost networking if prompted).
3. Run `node src/server.mjs`, open http://localhost:3000.
4. Click Simulate one minute, Send, then Send again; inspect event card, cached reply and cooldown.
5. Verify zero AI calls; open Viewer recap; stop/restart and confirm saved events.
6. Follow TWITCH_SETUP.md for real service verification and replace Pending rows only with observed outcomes.
