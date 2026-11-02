import { randomUUID } from 'node:crypto';

export function fresh(mode = 'offline') {
  return { id: randomUUID(), mode, status: 'paused', startedAt: null, elapsed: 0,
    events: [], chapters: [], state: 'No observations yet.', analyzedUntil: 0,
    frames: [], calls: 0, spent: 0, reserved: 0, errors: [], gaps: [], fixtureStep: 0 };
}
export class Gate {
  constructor() { this.seen = new Set(); this.users = new Map(); this.last = -Infinity; }
  accept(id, user, now = Date.now()) {
    if (this.seen.has(id)) return false;
    this.seen.add(id);
    if (this.seen.size > 5000) this.seen.delete(this.seen.values().next().value);
    if (now - this.last < 60000 || now - (this.users.get(user) ?? -Infinity) < 120000) return false;
    this.last = now; this.users.set(user, now);
    if(this.users.size > 5000) this.users.delete(this.users.keys().next().value);
    return true;
  }
}
export function validateObservation(value, frames) {
  if (!value || typeof value.state !== 'string' || value.state.length > 1000 || !Array.isArray(value.events) || value.events.length > 3) throw Error('Invalid observation');
  const ids = new Set(frames.map(f => f.id));
  const events = value.events.map(e => {
    if (typeof e.summary !== 'string' || !e.summary.trim() || e.summary.length > 500 || typeof e.uncertainty !== 'string' || e.uncertainty.length > 300 || !Array.isArray(e.evidenceFrameIds) || !e.evidenceFrameIds.length || e.evidenceFrameIds.some(id => !ids.has(id))) throw Error('Invalid event evidence');
    return { id: randomUUID(), summary: e.summary, uncertainty: e.uncertainty, evidenceFrameIds: [...new Set(e.evidenceFrameIds)], startSec: frames[0].sec, endSec: frames.at(-1).sec };
  });
  return { state: value.state, events };
}
export function applyObservation(s, observation, frames) {
  const valid = validateObservation(observation, frames);
  s.state = valid.state; s.events.push(...valid.events); s.analyzedUntil = frames.at(-1).sec;
  for (const f of frames) if (valid.events.some(e => e.evidenceFrameIds.includes(f.id))) s.frames.push(f);
  s.frames = s.frames.slice(-100);
  const chapter = Math.floor(s.analyzedUntil / 600);
  if (chapter > s.chapters.length) {
    const start = s.chapters.length * 600;
    s.chapters.push({ startSec: start, endSec: s.analyzedUntil, summary: s.events.filter(e => e.endSec > start).map(e => e.summary).slice(-6).join(' ') || s.state });
  }
}
export function publicRecap(s, delay = 0) {
  const cutoff = s.mode === 'offline' ? Infinity : s.elapsed - delay;
  const events = s.events.filter(e => e.endSec <= cutoff);
  const allowed = new Set(events.flatMap(e => e.evidenceFrameIds));
  return { mode: s.mode, sessionId: s.id, status: s.status, elapsed: s.elapsed,
    analyzedUntil: Math.min(s.analyzedUntil, Math.max(0, cutoff)),
    state: s.analyzedUntil <= cutoff ? s.state : (events.at(-1)?.summary || 'Waiting for the broadcast delay.'),
    chapters: s.chapters.filter(c => c.endSec <= cutoff), events,
    frames: s.frames.filter(f => allowed.has(f.id)).map(f => ({ id: f.id, sec: f.sec, image: f.image })),
    gaps: s.gaps.filter(g => g.endSec <= cutoff) };
}
export function chatText(recap, url = '') {
  const base = recap.events.length ? `CatchUp [${Math.floor(recap.analyzedUntil / 60)}m]: ${recap.state} ${recap.events.slice(-2).map(e => e.summary).join(' ')}` : 'CatchUp: Building the first recap. Please try again shortly.';
  const suffix = url ? ` | ${url}` : '';
  return [...base].slice(0, Math.max(0, 350 - [...suffix].length)).join('') + suffix;
}
export function reserve(s, budget, amount) {
  if (!Number.isFinite(amount) || amount <= 0 || s.spent + s.reserved + amount > budget) return false;
  s.reserved += amount; return true;
}
export const SCHEMA = { type: 'object', additionalProperties: false, required: ['state', 'events'], properties: {
  state: { type: 'string' }, events: { type: 'array', maxItems: 3, items: { type: 'object', additionalProperties: false,
    required: ['summary', 'uncertainty', 'evidenceFrameIds'], properties: { summary: { type: 'string' }, uncertainty: { type: 'string' }, evidenceFrameIds: { type: 'array', items: { type: 'string' } } } } } } };
