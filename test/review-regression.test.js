'use strict';

/** Independent AI technical-review regressions. These checks supplement the
 * existing acceptance suite; they do not establish a human peer review or UAT.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, dirname, resolve, basename } = require('node:path');
const { createDb } = require('../src/db');
const createApp = require('../src/app');
const { startTestServer, seedProduction, seedVolunteer } = require('./helpers');

async function assignmentSnapshot(s, performanceId) {
  const r = await s.get(`/api/performances/${performanceId}/assignments`);
  assert.equal(r.status, 200);
  return r.body;
}

test('REV01 evening and matinee have the complete 9 and 7 person crew calls', async t => {
  const s = await startTestServer(t);
  const production = await s.post('/api/productions', { title: 'Review crew templates' });
  const expectedCommon = [
    { role: 'Stage Manager', required_count: 1 },
    { role: 'Lighting Operator', required_count: 1 },
    { role: 'Sound Operator', required_count: 1 },
    { role: 'Front of House Manager', required_count: 1 },
    { role: 'Box Office', required_count: 1 },
  ];
  for (const [template, expected, total] of [
    ['evening', [...expectedCommon, { role: 'Bar', required_count: 2 }, { role: 'Usher', required_count: 2 }], 9],
    ['matinee', [...expectedCommon, { role: 'Usher', required_count: 2 }], 7],
  ]) {
    const f = await s.post(`/api/productions/${production.body.id}/performances`, {
      date: '2026-10-12', startTime: template === 'evening' ? '19:30' : '14:00', callTemplate: template,
    });
    assert.equal(f.status, 201);
    const roles = await s.get(`/api/productions/${production.body.id}/performances/${f.body.id}/roles`);
    assert.equal(roles.status, 200);
    assert.deepEqual(roles.body, expected);
    assert.equal(roles.body.reduce((sum, role) => sum + role.required_count, 0), total);
    const roster = (await s.get(`/api/performances/${f.body.id}/roster`)).body;
    assert.equal(roster.reduce((sum, role) => sum + role.open, 0), total);
  }
});

test('REV02 refused conflict move preserves confirmed assignments in both performances', async t => {
  const s = await startTestServer(t);
  const volunteer = await seedVolunteer(s);
  const p1 = await seedProduction(s);
  const p2 = await seedProduction(s, { title: 'Review other performance', date: '2026-09-05' });
  for (const [p, role] of [[p1, 'Bar'], [p2, 'Usher']]) {
    const a = await s.post(`/api/performances/${p.performanceId}/assignments`, { volunteerId: volunteer.id, role });
    assert.equal(a.status, 201);
    assert.equal((await s.post(`/api/assignments/${a.body.id}/confirm`)).status, 200);
  }
  const before1 = await assignmentSnapshot(s, p1.performanceId);
  const before2 = await assignmentSnapshot(s, p2.performanceId);
  const refused = await s.put(`/api/assignments/${before2[0].id}`, { performanceId: p1.performanceId });
  assert.equal(refused.status, 409);
  assert.match(refused.body.error, /at most one role/i);
  assert.deepEqual(await assignmentSnapshot(s, p1.performanceId), before1);
  assert.deepEqual(await assignmentSnapshot(s, p2.performanceId), before2);
  assert.equal(before1[0].confirmed, true);
  assert.equal(before2[0].confirmed, true);
});

test('REV03 refused replacements preserve the complete confirmed assignment records', async t => {
  const s = await startTestServer(t);
  const p = await seedProduction(s);
  const a = await seedVolunteer(s, { name: 'Review original volunteer' });
  const b = await seedVolunteer(s, { name: 'Review occupied volunteer' });
  const inactive = await seedVolunteer(s, { name: 'Review inactive volunteer' });
  const unavailable = await seedVolunteer(s, { name: 'Review unavailable volunteer' });
  for (const [v, role] of [[a, 'Box Office'], [b, 'Sound Operator']]) {
    const assignment = await s.post(`/api/performances/${p.performanceId}/assignments`, { volunteerId: v.id, role });
    assert.equal(assignment.status, 201);
    assert.equal((await s.post(`/api/assignments/${assignment.body.id}/confirm`)).status, 200);
  }
  await s.post(`/api/volunteers/${inactive.id}/deactivate`);
  await s.post(`/api/volunteers/${unavailable.id}/unavailability`, {
    startsOn: '2026-09-04', endsOn: '2026-09-04', reason: 'Synthetic review conflict',
  });
  const before = await assignmentSnapshot(s, p.performanceId);
  const original = before.find(row => row.volunteerId === a.id);
  assert.equal(original.confirmed, true);
  for (const [volunteerId, status, reason] of [[b.id, 409, /at most one role/i], [inactive.id, 400, /inactive/i], [unavailable.id, 409, /unavailable/i]]) {
    const refused = await s.put(`/api/assignments/${original.id}`, { volunteerId });
    assert.equal(refused.status, status);
    assert.match(refused.body.error, reason);
    assert.deepEqual(await assignmentSnapshot(s, p.performanceId), before);
  }
});

test('REV04 unavailable reschedule refusal preserves dates, confirmations and the other performance', async t => {
  const s = await startTestServer(t);
  const p = await seedProduction(s);
  const other = await s.post(`/api/productions/${p.productionId}/performances`, {
    date: '2026-09-05', startTime: '14:00', callTemplate: 'matinee',
  });
  const volunteer = await seedVolunteer(s);
  for (const performanceId of [p.performanceId, other.body.id]) {
    const a = await s.post(`/api/performances/${performanceId}/assignments`, { volunteerId: volunteer.id, role: 'Usher' });
    assert.equal(a.status, 201);
    await s.post(`/api/assignments/${a.body.id}/confirm`);
  }
  await s.post(`/api/volunteers/${volunteer.id}/unavailability`, {
    startsOn: '2026-10-10', endsOn: '2026-10-11', reason: 'Review reschedule conflict',
  });
  const before = (await s.get(`/api/productions/${p.productionId}/roster`)).body;
  const assignmentsBefore = await assignmentSnapshot(s, p.performanceId);
  const otherBefore = await assignmentSnapshot(s, other.body.id);
  const refused = await s.put(`/api/productions/${p.productionId}/performances/${p.performanceId}`, {
    date: '2026-10-10', startTime: '20:00',
  });
  assert.equal(refused.status, 409);
  assert.match(refused.body.error, /unavailable/i);
  assert.deepEqual((await s.get(`/api/productions/${p.productionId}/roster`)).body, before);
  assert.deepEqual(await assignmentSnapshot(s, p.performanceId), assignmentsBefore);
  assert.deepEqual(await assignmentSnapshot(s, other.body.id), otherBefore);
});

test('REV05 reopening file storage preserves inactive history, availability, revised crew and confirmation', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tinshed-review-persist-'));
  let db, server, base;
  const boot = async () => {
    db = createDb(join(dir, 'review.db'));
    server = createApp(db).listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  };
  const stop = async () => {
    await new Promise(resolve => server.close(resolve));
    db.close(); server = db = null;
  };
  const request = async (method, path, body, status = 200) => {
    const response = await fetch(base + path, {
      method, headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    assert.equal(response.status, status);
    return response.json();
  };
  try {
    await boot();
    const volunteer = await request('POST', '/api/volunteers', { name: 'Review historical volunteer', email: 'history@example.invalid' }, 201);
    const available = await request('POST', '/api/volunteers', { name: 'Review availability volunteer', phone: '0400000000' }, 201);
    const production = await request('POST', '/api/productions', { title: 'Review persistence' }, 201);
    const performance = await request('POST', `/api/productions/${production.id}/performances`, { date: '2026-09-04', startTime: '19:30' }, 201);
    const crewPath = `/api/productions/${production.id}/performances/${performance.id}/roles`;
    await request('PUT', crewPath, { roles: [{ role: 'Stage Manager', required_count: 1 }, { role: 'Usher', required_count: 3 }] });
    const assignment = await request('POST', `/api/performances/${performance.id}/assignments`, { volunteerId: volunteer.id, role: 'Usher' }, 201);
    await request('POST', `/api/assignments/${assignment.id}/confirm`);
    await request('POST', `/api/volunteers/${volunteer.id}/deactivate`);
    await request('POST', `/api/volunteers/${available.id}/unavailability`, {
      startsOn: '2026-09-04', endsOn: '2026-09-05', reason: 'Persisted review interval',
    }, 201);
    const paths = [
      `/api/volunteers/${volunteer.id}`, `/api/volunteers?active=all`,
      `/api/volunteers/${available.id}/unavailability`, crewPath,
      `/api/performances/${performance.id}/assignments`, `/api/performances/${performance.id}/roster`,
      `/api/volunteers/${volunteer.id}/assignments`, `/api/productions/${production.id}`,
    ];
    const before = await Promise.all(paths.map(path => request('GET', path)));
    assert.equal(before[0].active, false);
    assert.equal(before[4][0].confirmed, true);
    await stop(); await boot();
    const after = await Promise.all(paths.map(path => request('GET', path)));
    assert.deepEqual(after, before);
    const refused = await request('POST', `/api/performances/${performance.id}/assignments`, {
      volunteerId: available.id, role: 'Stage Manager',
    }, 409);
    assert.match(refused.error, /unavailable/i);
    assert.deepEqual(await request('GET', paths[4]), before[4]);
    await stop();
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (db) db.close();
    // The target is a freshly created directory inside the OS temp directory.
    assert.equal(dirname(resolve(dir)).toLowerCase(), resolve(tmpdir()).toLowerCase());
    assert.ok(basename(dir).startsWith('tinshed-review-persist-'));
    rmSync(dir, { recursive: true, force: true });
  }
});
