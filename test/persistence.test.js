'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { createDb } = require('../src/db');
const createApp = require('../src/app');

test('PERSIST01 saved volunteers, performances and assignments survive reopening the database', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tinshed-persist-'));
  let db, server;
  try {
    const boot = async () => {
      db = createDb(join(dir, 'roster.db'));
      server = createApp(db).listen(0, '127.0.0.1');
      await new Promise(resolve => server.once('listening', resolve));
      return `http://127.0.0.1:${server.address().port}`;
    };
    const stop = async () => { await new Promise(resolve => server.close(resolve)); db.close(); server = db = null; };
    let base = await boot();
    const post = async (path, body) => {
      const r = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      assert.equal(r.status, 201); return r.json();
    };
    const v = await post('/api/volunteers', { name: 'Persistence Demo', email: 'demo@example.invalid' });
    const p = await post('/api/productions', { title: 'Persistence Production' });
    const f = await post(`/api/productions/${p.id}/performances`, { date: '2026-10-12', startTime: '19:30' });
    const a = await post(`/api/performances/${f.id}/assignments`, { volunteerId: v.id, role: 'Usher' });
    await stop(); base = await boot();
    const read = async path => { const r = await fetch(base + path); assert.equal(r.status, 200); return r.json(); };
    assert.equal((await read(`/api/volunteers/${v.id}`)).name, v.name);
    assert.equal((await read(`/api/productions/${p.id}`)).performances[0].id, f.id);
    assert.equal((await read(`/api/volunteers/${v.id}/assignments`))[0].id, a.id);
    const duplicate = await fetch(base + `/api/performances/${f.id}/assignments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ volunteerId: v.id, role: 'Bar' }) });
    assert.equal(duplicate.status, 409);
    await stop();
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (db) db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
