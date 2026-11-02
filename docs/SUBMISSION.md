# Devpost submission preparation — NOT submitted

Official rules: https://twitchcon-codex.devpost.com/rules
Overview: https://twitchcon-codex.devpost.com/
Checked 2026-11-02. Recheck the signed-in form for additional fields.

Deadline: Nov 2, 2026, 2:00pm PST / Nov 3, 2026, 06:00 Asia/Taipei.

## English project description (current verified status)

**CatchUp — Late to the stream. Right in the story.**

Viewers joining a game stream midway often lack the context to participate. CatchUp is a visual catch-up companion: it samples the broadcaster's OBS game source, creates short progress notes with image evidence, and answers a Twitch chat command with the latest shared recap. A read-only page presents illustrated event cards and chapter notes. Viewers can catch up at their own pace without being called out or interrupting everyone else.

The prototype includes budget reservations, persistent usage accounting, event deduplication and chat cooldowns. It samples frames rather than replaying the whole broadcast on every request. Sampling gaps and uncertainty are disclosed. Static public snapshots require manual publishing in v0.1.

Codex helped turn the product specification into native Node.js capture, vision, EventSub and UI modules, automated tests, and reproducible documentation. Eight automated tests passed, including a clean ZIP extraction test run. The offline workflow is verified; OBS, vision API and Twitch adapters are implemented and tested against mocks, but real account-based end-to-end validation is still pending. Offline fixtures demonstrate the workflow separately from actual AI results.

## Required operator completion

- [x] Repository URL: https://github.com/snivy1827/catchup-twitch-recap . Includes source, original assets, README and testing instructions. ZIP alone is insufficient.
- [ ] Public YouTube URL: TO BE PROVIDED. Under three minutes; show real Twitch function and Codex development.
- [x] Primary development Codex Session ID: `01a1982f-5c5c-76f2-877c-43edfe99fe17`. Read from this process's CODEX_THREAD_ID environment variable on 2026-11-02; this is the chat where the implementation was written.
- [ ] Live OBS / AI / Twitch results recorded in verification.md.
- [ ] English video captions, description and testing instructions.
- [ ] Rights-cleared gameplay and audio; permission for all third-party material shown.
- [ ] Working project available free for judges through the judging period. Source plus offline fixtures does not prove live function; make live testing possible without charging judges for your demo. Hosting/API access arrangements remain to be established securely, without embedding secrets.
- [ ] If private repository, share with the exact official judging account stated in the current rules.
- [ ] Verify submission is new work created during the submission period; this project was created for this build, but authors must confirm final eligibility.

Do not mark these completed based on a local ZIP or mocked tests. Judge access, video upload, account permissions and final form submission are pending.
