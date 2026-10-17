'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, seedProduction, seedVolunteer } = require('./helpers');

test('VAL01 blank contact information is rejected on create', async (t) => {
  const s = await startTestServer(t);
  const r = await s.post('/api/volunteers', { name: 'Test Person', phone: '  ', email: ' ' });
  assert.equal(r.status, 400);
  assert.equal((await s.get('/api/volunteers')).body.length, 0);
});

test('VAL02 an update cannot erase the volunteer name', async (t) => {
  const s = await startTestServer(t); const v = await seedVolunteer(s);
  assert.equal((await s.put(`/api/volunteers/${v.id}`, { name: ' ' })).status, 400);
  assert.equal((await s.get(`/api/volunteers/${v.id}`)).body.name, v.name);
});

test('VAL03 an update cannot erase the last contact method', async (t) => {
  const s = await startTestServer(t); const v = await seedVolunteer(s);
  assert.equal((await s.put(`/api/volunteers/${v.id}`, { phone: '', email: null })).status, 400);
  assert.equal((await s.get(`/api/volunteers/${v.id}`)).body.phone, v.phone);
});

test('VAL04 email only is a valid contact method', async (t) => {
  const s = await startTestServer(t);
  const r = await s.post('/api/volunteers', { name: 'Email Tester', email: 'test@example.com' });
  assert.equal(r.status, 201);
  assert.equal((await s.put(`/api/volunteers/${r.body.id}`, { phone: ' ', email: 'second@example.com' })).status, 200);
});

test('VAL05 impossible performance dates are rejected', async (t) => {
  const s = await startTestServer(t); const p = await s.post('/api/productions', { title: 'Date Test' });
  for (const date of ['2026-02-30', '2026-13-01', 'tomorrow']) {
    assert.equal((await s.post(`/api/productions/${p.body.id}/performances`, { date, startTime: '19:30' })).status, 400);
  }
  assert.equal((await s.get(`/api/productions/${p.body.id}/performances`)).body.length, 0);
});

test('VAL06 impossible performance times are rejected', async (t) => {
  const s = await startTestServer(t); const p = await s.post('/api/productions', { title: 'Time Test' });
  for (const startTime of ['25:00', '19:75', 'noon']) {
    assert.equal((await s.post(`/api/productions/${p.body.id}/performances`, { date: '2026-10-10', startTime })).status, 400);
  }
});

test('VAL07 invalid dates on update preserve the old performance', async (t) => {
  const s = await startTestServer(t); const p = await seedProduction(s);
  assert.equal((await s.put(`/api/productions/${p.productionId}/performances/${p.performanceId}`, { date: '2026-02-30' })).status, 400);
  assert.equal((await s.get(`/api/productions/${p.productionId}/performances`)).body[0].date, '2026-09-04');
});

test('VAL08 impossible unavailable dates are rejected', async (t) => {
  const s = await startTestServer(t); const v = await seedVolunteer(s);
  assert.equal((await s.post(`/api/volunteers/${v.id}/unavailability`, { startsOn: '2026-02-30', endsOn: '2026-03-01' })).status, 400);
});

test('VAL09 real leap day is accepted and non leap day is rejected', async (t) => {
  const s = await startTestServer(t); const v = await seedVolunteer(s);
  assert.equal((await s.post(`/api/volunteers/${v.id}/unavailability`, { startsOn: '2028-02-29', endsOn: '2028-02-29' })).status, 201);
  assert.equal((await s.post(`/api/volunteers/${v.id}/unavailability`, { startsOn: '2026-02-29', endsOn: '2026-02-29' })).status, 400);
});

test('VAL10 changing assignment to an inactive volunteer is rejected', async (t) => {
  const s = await startTestServer(t); const a = await seedVolunteer(s); const b = await seedVolunteer(s, { name: 'Inactive Tester' }); const p = await seedProduction(s);
  const assignment = await s.post(`/api/performances/${p.performanceId}/assignments`, { volunteerId: a.id, role: 'Usher' });
  await s.post(`/api/volunteers/${b.id}/deactivate`);
  assert.equal((await s.put(`/api/assignments/${assignment.body.id}`, { volunteerId: b.id })).status, 400);
  assert.equal((await s.get(`/api/performances/${p.performanceId}/assignments`)).body[0].volunteerId, a.id);
});

test('VAL11 changing assignment to a role outside the call is rejected', async (t) => {
  const s = await startTestServer(t); const v = await seedVolunteer(s); const p = await seedProduction(s, { callTemplate: 'matinee' });
  const a = await s.post(`/api/performances/${p.performanceId}/assignments`, { volunteerId: v.id, role: 'Usher' });
  assert.equal((await s.put(`/api/assignments/${a.body.id}`, { role: 'Bar' })).status, 400);
  assert.equal((await s.get(`/api/performances/${p.performanceId}/assignments`)).body[0].role, 'Usher');
});

test('VAL12 replacing a confirmed assignment requires a new confirmation', async (t) => {
  const s = await startTestServer(t); const v = await seedVolunteer(s); const v2 = await seedVolunteer(s, { name: 'Replacement Tester' }); const p = await seedProduction(s);
  const a = await s.post(`/api/performances/${p.performanceId}/assignments`, { volunteerId: v.id, role: 'Usher' });
  await s.post(`/api/assignments/${a.body.id}/confirm`);
  const changed = await s.put(`/api/assignments/${a.body.id}`, { volunteerId: v2.id });
  assert.equal(changed.status, 200); assert.equal(changed.body.confirmed, false);
});

test('VAL13 a no change assignment update preserves confirmation', async (t) => {
  const s = await startTestServer(t); const v = await seedVolunteer(s); const p = await seedProduction(s);
  const a = await s.post(`/api/performances/${p.performanceId}/assignments`, { volunteerId: v.id, role: 'Usher' });
  await s.post(`/api/assignments/${a.body.id}/confirm`);
  const changed = await s.put(`/api/assignments/${a.body.id}`, { role: 'Usher' });
  assert.equal(changed.status, 200); assert.equal(changed.body.confirmed, true);
});

test('VAL14 nested performance operations cannot affect another production', async (t) => {
  const s = await startTestServer(t); const a = await seedProduction(s); const b = await seedProduction(s, { title: 'Other' });
  const wrong = `/api/productions/${a.productionId}/performances/${b.performanceId}`;
  assert.equal((await s.put(wrong, { date: '2026-10-10' })).status, 404);
  assert.equal((await s.get(`${wrong}/roles`)).status, 404);
  assert.equal((await s.put(`${wrong}/roles`, { roles: [{ role: 'Usher', required_count: 1 }] })).status, 404);
  assert.equal((await s.del(wrong)).status, 404);
  assert.equal((await s.get(`/api/productions/${b.productionId}/performances`)).body.length, 1);
});

test('VAL15 duplicate crew roles are rejected without losing the old crew call', async (t) => {
  const s = await startTestServer(t); const p = await seedProduction(s);
  const path = `/api/productions/${p.productionId}/performances/${p.performanceId}/roles`;
  const before = (await s.get(path)).body;
  const r = await s.put(path, { roles: [{ role: 'Usher', required_count: 1 }, { role: ' Usher ', required_count: 2 }] });
  assert.equal(r.status, 400); assert.deepEqual((await s.get(path)).body, before);
});

test('VAL16 a crew call edit cannot silently hide existing assignments', async (t) => {
  const s = await startTestServer(t); const p = await seedProduction(s); const v = await seedVolunteer(s);
  await s.post(`/api/performances/${p.performanceId}/assignments`, { volunteerId: v.id, role: 'Bar' });
  const r = await s.put(`/api/productions/${p.productionId}/performances/${p.performanceId}/roles`, { roles: [{ role: 'Usher', required_count: 2 }] });
  assert.equal(r.status, 409);
  assert.equal((await s.get(`/api/performances/${p.performanceId}/roster`)).body.find(r => r.role === 'Bar').filled, 1);
});

test('VAL17 moving a performance to an unavailable date is rejected', async (t) => {
  const s = await startTestServer(t); const p = await seedProduction(s); const v = await seedVolunteer(s);
  await s.post(`/api/performances/${p.performanceId}/assignments`, { volunteerId: v.id, role: 'Usher' });
  await s.post(`/api/volunteers/${v.id}/unavailability`, { startsOn: '2026-10-10', endsOn: '2026-10-11' });
  assert.equal((await s.put(`/api/productions/${p.productionId}/performances/${p.performanceId}`, { date: '2026-10-10' })).status, 409);
});

test('VAL18 malformed JSON returns a client error', async (t) => {
  const s = await startTestServer(t);
  const res = await fetch(s.baseUrl + '/api/volunteers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(res.status, 400); assert.match((await res.json()).error, /JSON/i);
});

test('VAL19 rescheduling clears confirmation and preserves assignment identity', async (t) => {
  const s = await startTestServer(t); const p = await seedProduction(s); const v = await seedVolunteer(s);
  const a = await s.post(`/api/performances/${p.performanceId}/assignments`, { volunteerId: v.id, role: 'Usher' });
  await s.post(`/api/assignments/${a.body.id}/confirm`);
  assert.equal((await s.put(`/api/productions/${p.productionId}/performances/${p.performanceId}`, { startTime: '20:00' })).status, 200);
  const saved = (await s.get(`/api/performances/${p.performanceId}/assignments`)).body[0];
  assert.equal(saved.id, a.body.id); assert.equal(saved.confirmed, false);
});

test('VAL20 unknown crew template is rejected without creating a performance', async (t) => {
  const s = await startTestServer(t); const p = await s.post('/api/productions', { title: 'Template test' });
  assert.equal((await s.post(`/api/productions/${p.body.id}/performances`, { date: '2026-10-12', startTime: '19:30', callTemplate: 'unknown' })).status, 400);
  assert.deepEqual((await s.get(`/api/productions/${p.body.id}/performances`)).body, []);
});
