# Devpost submission record — SUBMITTED

Updated 2026-11-02 (Asia/Taipei). The owner performed the final submission. The signed-in Devpost page displayed **“Project submitted!”** and **“SUBMITTED TO Codex x TwitchCon Hackathon”**. Submission is not an award or a guarantee of eligibility/judging outcome.

## Submitted deliverables

- Project: CatchUp — Visual Recaps for Twitch.
- Devpost: https://devpost.com/software/catchup-visual-recaps-for-twitch
- Public source: https://github.com/snivy1827/catchup-twitch-recap
- Public English demo, approximately 2:45: https://www.youtube.com/watch?v=hYGgMk6Mikw
- English project story, source setup/testing instructions, video captions and Codex development footage included.
- Primary Codex session ID: `01a1982f-5c5c-76f2-877c-43edfe99fe17`.
- Submitter type: Individual. The owner completed the final terms acceptance and submission.

## Judge access without the owner's credentials

Download a fresh source copy, install Node.js 24+, run `node src/server.mjs` and open http://localhost:3000. No `.env`, OpenAI key, OBS or Twitch login is needed for the explicitly labeled scripted fixture. Click Simulate one minute, Viewer recap and Send twice to inspect the recap and cooldown. AI calls remain zero. Run `node --test tests/*.test.mjs` for local automated checks.

This offline path establishes workflow behavior, not model accuracy. The video and [TWITCH_VALIDATION.md](TWITCH_VALIDATION.md) document the limited real integration test. Independent live testing requires the operator's own OBS, OpenAI and Twitch configuration and can incur charges to their API project. No hosted interactive live instance or sponsor-funded API access is provided. The owner's local analyzer is paused; it is not a judging dependency.

## Authorship and remaining limits

The owner defined the problem, requirements, scope and acceptance criteria, operated account/OBS setup, gave feedback and confirmed submission. Codex helped implement, debug, test and document the prototype and prepare demo materials. See README and [portfolio](portfolio.zh-TW.html).

Real tests used the broadcaster account in an offline channel. On-air, second-viewer-account, prolonged changing-game accuracy and recovery testing remain pending. The viewer page is local; static export is manual and public hosting is not configured. No audio analysis, measured retention improvement, user adoption or award is claimed. Approximately US$0.004137 for the final test session is calculated from tokens and configured prices, not invoice-reconciled and not an hourly estimate.

## Record boundaries

Local submission-success screenshots and video files are retained in `dist/`, excluded from source. Credentials, local gameplay state and Twitch tokens are excluded from GitHub and source ZIPs. Earlier verification documents preserve historical tests; their latest-status sections supersede earlier pending statements. Third-party gameplay rights remain separate from the repository's MIT code license.
