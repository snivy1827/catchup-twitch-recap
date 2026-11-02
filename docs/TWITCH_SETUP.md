# Twitch + OBS live validation runbook

Documentation checked: 2026-11-02. These are executable operator steps, not a record of successful account validation.

## 1. Register

Verify the broadcaster account email and enable 2FA. Open https://dev.twitch.tv/console → Applications → Register Your Application. Create a unique application name and an appropriate chatbot category. Register exactly `http://localhost:3000/auth/twitch/callback`. Record Client ID and generate a Client Secret. Put both only in local `.env`.

Expected evidence: the application exists and its redirect exactly matches `TWITCH_REDIRECT_URI`. Never screenshot the secret.

## 2. Authorize the installed chatbot

Run `node --env-file=.env src/server.mjs`, open http://localhost:3000 and click Connect Twitch. Sign in **as the broadcaster** and authorize `user:read:chat user:write:chat`. This prototype uses the broadcaster as sender and channel owner. A separate bot account/cloud deployment requires a different permission design.

The local callback exchanges the code server-side, validates state and token client/scopes, saves token data only in ignored `data/twitch-private.json`, and opens EventSub. The token is validated at connection and hourly; refresh is attempted on validation 401. Reauthorize if an active API call returns 401.

Expected evidence: Twitch status becomes Connected; no token appears in the browser URL or logs. Authorization code is removed by redirect after callback. Refresh failure or revocation requires reconnecting.

## 3. Receive and send

The program connects to `wss://eventsub.wss.twitch.tv/ws`. After session_welcome it creates `channel.chat.message` v1 via `POST /helix/eventsub/subscriptions` with the session ID. Both `condition.broadcaster_user_id` and `condition.user_id` are the authenticated broadcaster ID. WebSocket uses a User Access Token.

Have another viewer type `!recap`. The app deduplicates delivery IDs and applies channel/user cooldowns. It sends cached text using `POST /helix/chat/messages`. Both broadcaster_id and sender_id are the broadcaster ID. It inspects `data[0].is_sent`; HTTP 200 alone is insufficient. AutoMod/drop errors appear in the local status.

Expected evidence: the actual channel receives one reply. Record the command and visible reply in the video; do not display credentials. Send another command immediately: no repeated reply or new AI analysis. Do not use whispers or test other people's channels without authorization.

## 4. OBS

OBS → Tools → WebSocket Server Settings → enable server, enable authentication, set password. Default local port 4455. Fill OBS_PASSWORD in .env. Create a visible game capture source. In CatchUp click List OBS sources, select the game input, then Use. Create a Live session and Start. The app uses `GetSourceScreenshot` to capture JPEG images at 960×540.

Expected evidence: after six samples and processing, a card contains a screenshot matching the actual game. Verify five distinct observed events manually. Source selection lists inputs, not scene names. A minimized/hidden game source may be black; inspect the captured card and correct OBS settings.

## 5. Public page and delay

Only the local admin is served by this app. Run export.mjs and host the four public export files separately. Put the HTTPS URL in PUBLIC_RECAP_URL and restart. The remote page is a timestamped manual snapshot; re-export/upload as needed. Never publish the complete working directory or tunnel the admin port.

The default 30-second publication delay may be too short for your stream. Compare the live Twitch playback clock to OBS capture time and set a sufficient delay. When safety delay has not elapsed, only older events are released.

## 6. Fault checks

- Pause and End: no further scheduled captures. In-flight AI can still be billed; its output is not applied while paused/ended.
- Lose OBS: record a gap and actionable status.
- Lose Twitch: reconnect/resubscribe; lost chat messages are not replayed.
- Revoke app permission: terminate subscription on revocation or next token validation.
- Exceed local budget: no next AI request. Restart does not reset the same session's spend.

Fill verification.md with actual results, separating mocked tests from account tests.

## Official references

- [Register app](https://dev.twitch.tv/docs/authentication/register-app)
- [OAuth flows](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/)
- [Token validation](https://dev.twitch.tv/docs/authentication/validate-tokens/)
- [Installed chatbot authentication](https://dev.twitch.tv/docs/chat/authenticating/)
- [EventSub WebSocket](https://dev.twitch.tv/docs/eventsub/handling-websocket-events)
- [Chat sending and receiving](https://dev.twitch.tv/docs/chat/send-receive-messages/)
- [OBS protocol](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#getsourcescreenshot)
