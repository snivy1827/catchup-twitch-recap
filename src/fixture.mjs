// Original synthetic game artwork and scripted observations. Never an AI accuracy claim.
export const scenes = [
  ['Meadow gate', 'Find the brass key', 'The adventurer reached the meadow gate.', '#4caa82'],
  ['Old bridge', 'Cross the river', 'The adventurer found the key and reached the bridge.', '#618bc2'],
  ['Crystal cave', 'Collect three crystals', 'The adventurer entered the crystal cave.', '#9673d2'],
  ['Guardian arena', 'Defeat the guardian', 'The adventurer reached the guardian arena.', '#d18b58'],
  ['Victory', 'Gate unlocked', 'The victory screen confirms the guardian was defeated.', '#d0b55a']
];
export function fixtureFrame(step, sec) {
  const [place, goal, , color] = scenes[step % scenes.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><rect width="960" height="540" fill="#102423"/><circle cx="780" cy="100" r="55" fill="#fff3be"/><path d="M0 310L180 170 340 320 560 140 760 300 960 190V540H0" fill="${color}"/><path d="M0 470Q400 320 960 440V540H0" fill="#244844"/><rect x="44" y="35" width="550" height="110" rx="16" fill="#112b2b"/><text x="65" y="75" fill="#edfff9" font-family="sans-serif" font-size="28">${place}</text><text x="65" y="115" fill="#bce4d3" font-family="sans-serif" font-size="22">Quest: ${goal}</text><rect x="440" y="350" width="45" height="60" rx="8" fill="#f0c86f"/><circle cx="462" cy="335" r="23" fill="#fff0ca"/><text x="40" y="510" fill="white" font-family="sans-serif" font-size="20">SYNTHETIC FIXTURE / ${sec}s / no AI call</text></svg>`;
  return { id: `fixture-${step}-${sec}`, sec, image: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}` };
}
export function fixtureObservation(step, frames) {
  const [place, goal, summary] = scenes[step % scenes.length];
  return { state: `${place} — ${goal}`, events: [{ summary, uncertainty: 'Scripted fixture, not model analysis.', evidenceFrameIds: [frames.at(-1).id] }] };
}
