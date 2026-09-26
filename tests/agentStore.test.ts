import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applySnapshot, kindFor, type AgentStoreState, type Snapshot, type Quest } from '../src/lib/agentStore.ts';

const q = (id: number, rawStatus: string, createdAt = '2026-09-18T00:00:00.000Z'): Quest => ({
  id, title: `Q${id}`, rawStatus, status: 'active', iterations: 0, createdAt, stale: false, seats: [],
});
const snap = (quests: Quest[]): Snapshot => ({
  quests, roster: [], health: { db: 'up', error: null, lastPollAt: null },
  summary: { total: quests.length, open: 0, stalled: 0, mediation: 0, completed: 0, failed: 0, successRate: null, knights: 4, lastActivityAt: null, lastActivityAgeHours: null },
});
const empty: AgentStoreState = { connection: 'connecting', snapshot: null, activity: [] };

test('first snapshot seeds history, not live', () => {
  const s = applySnapshot(empty, snap([q(2, 'failed'), q(1, 'completed')]), 'NOW');
  assert.equal(s.connection, 'live');
  assert.deepEqual(s.activity.map((a) => [a.questId, a.kind, a.live]), [[2, 'failed', false], [1, 'complete', false]]);
});

test('quests without a date are left out of the seed feed', () => {
  const s = applySnapshot(empty, snap([{ ...q(1, 'pending'), createdAt: null }]), 'NOW');
  assert.equal(s.activity.length, 0);
});

test('later snapshots add only transitions, newest first', () => {
  const a = applySnapshot(empty, snap([q(1, 'pending'), q(2, 'implemented')]), 'T0');
  const b = applySnapshot(a, snap([q(3, 'pending'), q(1, 'decomposed'), q(2, 'implemented')]), 'T1');
  const live = b.activity.filter((x) => x.live);
  assert.deepEqual(live.map((x) => [x.questId, x.kind, x.at]), [[3, 'initialized', 'T1'], [1, 'progress', 'T1']]);
  assert.equal(b.activity.length, 4);
});

test('leaving testing_failed for anything but failed reads as resolved', () => {
  const a = applySnapshot(empty, snap([q(1, 'testing_failed')]), 'T0');
  const b = applySnapshot(a, snap([q(1, 'implemented')]), 'T1');
  assert.equal(b.activity[0].kind, 'resolved');
  const c = applySnapshot(a, snap([q(1, 'failed')]), 'T1');
  assert.equal(c.activity[0].kind, 'failed');
});

test('feed is capped at 30', () => {
  let s = applySnapshot(empty, snap(Array.from({ length: 40 }, (_, i) => q(i, 'completed'))), 'T0');
  assert.equal(s.activity.length, 30);
  s = applySnapshot(s, snap(Array.from({ length: 40 }, (_, i) => q(i, 'failed'))), 'T1');
  assert.equal(s.activity.length, 30);
  assert.ok(s.activity.every((a) => a.live));
});

test('kindFor', () => {
  assert.equal(kindFor('testing_failed', false), 'conflict');
  assert.equal(kindFor('decomposed', true), 'initialized');
  assert.equal(kindFor('decomposed', false), 'progress');
});
