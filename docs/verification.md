# Verification report — v0.1

Date: 2026-11-02 (Asia/Taipei). Runtime: Node.js v24.22.1, Windows. No npm packages required. No paid API call or real Twitch chat message was made during this delivery.

## Executed

Command: `node --test`

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

## Pending real external validation

| Check | Status / required operator action |
| --- | --- |
| Real OBS server connection | Pending: enable OBS WebSocket and set local password/source |
| Real image-model response | Pending: local API key and funded account; run ten minutes |
| AI gameplay accuracy | Pending: compare at least five visible events over a 30-minute session |
| Real Twitch OAuth / token refresh | Pending: create developer application, authorize broadcaster |
| Actual channel command and visible reply | Pending: viewer sends !recap; verify is_sent and visible output |
| Real disconnection/revocation recovery | Pending after live setup |
| Hosted HTTPS recap | Pending: publish only exported static files; snapshot is manual |
| Playback delay vs spoilers | Pending: measure actual stream delay |
| Live cost / billing comparison | Pending; no measured hourly claim |
| Public repository / YouTube / final Devpost form | Pending; ZIP is not submission |

## Reproduce

1. Extract ZIP into a fresh directory.
2. Run `node --test` (allow localhost networking if prompted).
3. Run `node src/server.mjs`, open http://localhost:3000.
4. Click Simulate one minute, Send, then Send again; inspect event card, cached reply and cooldown.
5. Verify zero AI calls; open Viewer recap; stop/restart and confirm saved events.
6. Follow TWITCH_SETUP.md for real service verification and replace Pending rows only with observed outcomes.
