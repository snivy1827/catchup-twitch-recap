# v0.1 implementation decisions

The accepted SPEC.md is the product plan. This file records actual scope changes.

- Node.js 24 native ES modules replace TypeScript/SDK dependencies: npm is absent on the development machine. No build or install step; WebSocket, fetch and HTTP use Node built-ins. package-lock.json has no external dependencies.
- Chapter notes concatenate up to six observed event summaries at ten-minute boundaries. They do not make an additional AI request. Original events remain in the session.
- No automatic paid-request retry in v0.1. Each failed request conservatively consumes its reserved estimate. This is cheaper and safer for the prototype than automatic retries.
- One analysis task is permitted at once; sampling is skipped and explicitly logged while analysis is busy. There is no deferred queue. This prevents catch-up bursts.
- Shared AI observations are in English. The local control page has a partial Traditional Chinese button-label toggle; README.zh-TW.md supplies complete Chinese operating instructions. Viewer recap and submission are English. Full UI translation is deferred.
- Evidence images are embedded data URLs in the persisted session (maximum 100). Non-evidence sampled frames are discarded after analysis. No video/audio is saved. Archives persist until the operator deletes their local data directory; there is no deletion button yet.
- Public webpage export is a manually refreshed static snapshot. Twitch command summaries are current (subject to publication delay), but the remote snapshot does not synchronize automatically. The viewer page displays its observation timestamp.
- UI supports original synthetic offline game artwork. Offline observations are scripted, not model output. Use live mode and rights-cleared game content for the official Twitch video.
- Live adapters are implemented but require account credentials, OBS and real validation before claiming a contest-ready submission.
- GitHub source repository: https://github.com/snivy1827/catchup-twitch-recap . No video has been uploaded and no contest submission has been sent.
