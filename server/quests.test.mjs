import { test } from 'node:test';
import assert from 'node:assert/strict';
import { titleFromSpec, toQuest, summarize, fingerprint, ROSTER, asUtc, excerpt, failureReason } from './quests.mjs';

test('title skips rule lines and trims', () => {
  assert.equal(titleFromSpec('====\n\n  Deploy hermes-webui  \nmore'), 'Deploy hermes-webui');
  assert.equal(titleFromSpec(''), 'Untitled quest');
  assert.equal(titleFromSpec(null), 'Untitled quest');
  assert.equal(titleFromSpec('# Heading'), 'Heading');
  assert.equal(titleFromSpec('x'.repeat(100)).length, 72);
});

test('status maps to bucket and seats', () => {
  const q = toQuest({ id: '7', spec: 'Build it', status: 'testing_failed', iteration_count: 3, created_at: '2026-09-18T10:00:00Z' }, Date.parse('2026-09-18T12:00:00Z'));
  assert.equal(q.stale, false);
  assert.equal(q.id, 7);
  assert.equal(q.status, 'mediation');
  assert.deepEqual(q.seats.map((s) => s.state), ['complete', 'complete', 'mediating', 'blocked']);
  assert.equal(q.seats.length, ROSTER.length);
  assert.equal(q.createdAt, '2026-09-18T10:00:00.000Z');
});

test('unknown status degrades to idle seats, active bucket', () => {
  const q = toQuest({ id: 1, spec: 's', status: 'weird', created_at: 'nope' });
  assert.equal(q.status, 'active');
  assert.equal(q.createdAt, null);
  assert.ok(q.seats.every((s) => s.state === 'idle'));
});

test('summary counts and success rate', () => {
  const rows = [
    { id: 1, status: 'completed', created_at: '2026-09-18T00:00:00Z' },
    { id: 2, status: 'failed', created_at: '2026-09-19T00:00:00Z' },
    { id: 3, status: 'pending', created_at: '2026-09-17T00:00:00Z' },
    { id: 4, status: 'testing_failed', created_at: '2026-09-16T00:00:00Z' },
  ].map((r) => toQuest(r, Date.parse('2026-09-19T12:00:00Z')));
  const s = summarize(rows, Date.parse('2026-09-20T00:00:00Z'));
  assert.equal(s.total, 4);
  assert.equal(s.open, 0);
  assert.equal(s.stalled, 2);
  assert.equal(s.mediation, 0);
  assert.equal(s.successRate, 50);
  assert.equal(s.lastActivityAgeHours, 24);
});

test('empty summary has null rate', () => {
  assert.equal(summarize([]).successRate, null);
});

test('fingerprint changes only when status or iterations change', () => {
  const a = [toQuest({ id: 1, status: 'pending', iteration_count: 0 })];
  const b = [toQuest({ id: 1, status: 'pending', iteration_count: 0 })];
  const c = [toQuest({ id: 1, status: 'decomposed', iteration_count: 0 })];
  assert.equal(fingerprint(a), fingerprint(b));
  assert.notEqual(fingerprint(a), fingerprint(c));
});

test('open quests past STALE_HOURS go stale but keep where they stopped; archived never stale', () => {
  const now = Date.parse('2026-09-25T00:00:00Z');
  const open = toQuest({ id: 1, status: 'implemented', created_at: '2026-09-13T00:00:00Z' }, now);
  assert.equal(open.stale, true);
  assert.deepEqual(open.seats.map((s) => s.state), ['complete', 'complete', 'executing', 'executing']);
  const done = toQuest({ id: 2, status: 'completed', created_at: '2026-09-13T00:00:00Z' }, now);
  assert.equal(done.stale, false);
  assert.equal(done.seats[0].state, 'complete');
});

test('naive timestamps are read as UTC', () => {
  assert.equal(asUtc('2026-09-19 17:39:50.25'), '2026-09-19T17:39:50.25Z');
  assert.equal(asUtc('2026-09-19T17:39:50Z'), '2026-09-19T17:39:50Z');
  assert.equal(asUtc('2026-09-19T17:39:50+02:00'), '2026-09-19T17:39:50+02:00');
  assert.equal(toQuest({ id: 1, status: 'pending', created_at: '2026-09-19T17:39:50' }).createdAt, '2026-09-19T17:39:50.000Z');
});

test('excerpt drops rule lines and caps length', () => {
  assert.equal(excerpt('====\nDo it\n\n\n\nnow'), 'Do it\n\nnow');
  assert.equal(excerpt('x'.repeat(500)).length, 420);
});

test('failure reason is the last meaningful trace line, only for failures', () => {
  assert.equal(failureReason('Traceback\n  File x\nAssertionError: 3 != 4\n---\n'), 'AssertionError: 3 != 4');
  assert.equal(failureReason(''), null);
  assert.equal(toQuest({ id: 1, status: 'failed', error_trace: 'boom' }).failure, 'boom');
  assert.equal(toQuest({ id: 1, status: 'completed', error_trace: 'old' }).failure, null);
});
