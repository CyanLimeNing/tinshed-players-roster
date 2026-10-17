'use strict';
const { chromium } = require(process.env.A3_PLAYWRIGHT_MODULE || 'playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const out = path.resolve(process.env.A3_UI_EVIDENCE_DIR || path.join(__dirname, '../docs/a3/evidence/ui-review'), 'core-ui');
assert.ok(!fs.existsSync(out), 'Choose a new A3_UI_EVIDENCE_DIR to preserve earlier UI evidence.');
fs.mkdirSync(out, { recursive: true });
const results = { startedAtUtc: new Date().toISOString(), tool: 'Playwright Chromium', routing: 'Browser plugin not available; frontend-testing-debugging Playwright fallback', node: process.version, viewports: ['1365x900', '390x844'], checks: [], errors: [], console: [], responses: [] };
const port = 3199;
const server = spawn(process.execPath, ['src/server.js'], { cwd: root, env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), DB_PATH: ':memory:' }, windowsHide: true });
let serverLog = ''; server.stdout.on('data', d => serverLog += d); server.stderr.on('data', d => serverLog += d);
const pause = ms => new Promise(r => setTimeout(r, ms));
async function main() {
  for (let n = 0; n < 50; n++) { try { if ((await fetch(`http://127.0.0.1:${port}`)).ok) break; } catch {} await pause(100); }
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  page.on('pageerror', e => results.errors.push(e.message));
  page.on('console', m => { if (['error','warning'].includes(m.type())) results.console.push({ type: m.type(), text: m.text() }); });
  page.on('response', r => { if (r.status() >= 400) results.responses.push({ status: r.status(), url: r.url() }); });
  page.on('dialog', d => d.accept());
  const check = async (id, description, fn) => { await fn(); results.checks.push({ id, description, status: 'PASS' }); };
  const has = async (loc, text) => { await loc.filter({ hasText: text }).first().waitFor(); };
  try {
    await check('UI01', 'App identity and meaningful first screen', async () => {
      await page.goto(`http://127.0.0.1:${port}`);
      assert.match(await page.title(), /Tinshed Players/);
      await page.getByRole('button', { name: 'Roster', exact: true }).waitFor();
      assert.ok((await page.locator('main').innerText()).includes('Production'));
    });
    await check('UI02', 'Create and rename production', async () => {
      await page.getByRole('button', { name: 'Productions', exact: true }).click();
      await page.locator('#production-title').fill('A3 Technical Demo');
      await page.getByRole('button', { name: 'Create production', exact: true }).click();
      await page.getByRole('button', { name: 'Rename production', exact: true }).click();
      await page.getByLabel('Title', { exact: true }).fill('A3 Verified Demo');
      await page.getByRole('button', { name: 'Save changes', exact: true }).click();
      await page.getByRole('heading', { name: 'A3 Verified Demo', exact: true }).waitFor();
    });
    await check('UI03', 'Create performances, edit time and revise crew count', async () => {
      for (const date of ['2026-10-12','2026-10-13']) {
        await page.getByLabel('New performance date').fill(date);
        await page.getByRole('button', { name: 'Add performance', exact: true }).click();
        await has(page.locator('.perf-line .date'), date);
      }
      await page.getByRole('button', { name: 'Edit performance', exact: true }).first().click();
      await page.getByLabel('Start time', { exact: true }).fill('20:00');
      await page.getByRole('button', { name: 'Save changes', exact: true }).click();
      await has(page.locator('.perf-line .date'), '20:00');
      await page.getByRole('button', { name: 'Edit crew call', exact: true }).first().click();
      await page.getByLabel('People required', { exact: true }).last().fill('3');
      await page.getByRole('button', { name: 'Save changes', exact: true }).click();
      await page.locator('dialog').waitFor({ state: 'detached' });
    });
    await check('UI04', 'Create volunteers and edit contact without losing emergency contact', async () => {
      await page.getByRole('button', { name: 'Volunteers', exact: true }).click();
      for (const name of ['Demo Alice','Demo Bob']) {
        await page.locator('#volunteer-name').fill(name);
        await page.locator('#volunteer-phone').fill('0400000000');
        await page.locator('#volunteer-emergency').fill('Demo contact');
        await page.getByRole('button', { name: 'Add volunteer', exact: true }).click();
        await has(page.locator('#volunteer-list tr'), name);
      }
      await page.locator('#volunteer-list tr').filter({ hasText: 'Demo Alice' }).getByRole('button', { name: 'Edit contact' }).click();
      assert.equal(await page.getByLabel('Emergency contact', { exact: true }).inputValue(), 'Demo contact');
      await page.getByLabel('Phone', { exact: true }).fill('0400000001');
      await page.getByRole('button', { name: 'Save changes', exact: true }).click();
      await has(page.locator('#volunteer-list tr'), '0400000001');
    });
    await check('UI05', 'Assign volunteer and confirm from roster', async () => {
      await page.getByRole('button', { name: 'Roster', exact: true }).click();
      await page.locator('#roster-production').selectOption({ label: 'A3 Verified Demo' });
      await page.locator('#roster-performance').selectOption({ label: '2026-10-12 20:00' });
      await page.getByLabel('Volunteer for Stage Manager', { exact: true }).selectOption({ label: 'Demo Alice' });
      await page.locator('.roster-row').filter({ hasText: 'Stage Manager' }).getByRole('button', { name: 'Assign', exact: true }).click();
      await page.getByRole('button', { name: 'Confirm', exact: true }).click();
      await page.getByRole('button', { name: 'Confirm', exact: true }).waitFor({ state: 'detached' });
      assert.ok((await page.locator('.assignment').innerText()).includes('Demo Alice'));
      assert.ok(!(await page.locator('.assignment').innerText()).includes('unconfirmed'));
    });
    await check('UI06', 'Duplicate role refusal remains visible; assignment preserved', async () => {
      await page.getByLabel('Volunteer for Lighting Operator', { exact: true }).selectOption({ label: 'Demo Alice' });
      await page.locator('.roster-row').filter({ hasText: 'Lighting Operator' }).getByRole('button', { name: 'Assign', exact: true }).click();
      await has(page.locator('#banner'), 'at most one role');
      await page.screenshot({ path: path.join(out, 'desktop-conflict.png'), fullPage: true });
      assert.equal(await page.locator('.assignment').count(), 1);
    });
    await check('UI07', 'Replacement resets confirmation and move changes performance', async () => {
      await page.getByRole('button', { name: 'Change', exact: true }).click();
      await page.locator('dialog').getByLabel('Volunteer', { exact: true }).selectOption({ label: 'Demo Bob' });
      await page.locator('dialog').getByLabel('Role', { exact: true }).selectOption({ label: 'Sound Operator' });
      await page.getByRole('button', { name: 'Save changes', exact: true }).click();
      await has(page.locator('.assignment'), 'Demo Bob (unconfirmed)');
      await page.getByRole('button', { name: 'Change', exact: true }).click();
      await page.locator('dialog').getByLabel('Performance', { exact: true }).selectOption({ label: '2026-10-13 19:30' });
      await page.getByRole('button', { name: 'Save changes', exact: true }).click();
      await page.locator('dialog').waitFor({ state: 'detached' });
      assert.equal(await page.locator('.assignment').count(), 0);
      await page.locator('#roster-performance').selectOption({ label: '2026-10-13 19:30' });
      await has(page.locator('.assignment'), 'Demo Bob');
    });
    await check('UI08', 'Volunteer schedule reflects moved assignment', async () => {
      await page.getByRole('button', { name: 'My Schedule', exact: true }).click();
      await page.locator('#schedule-volunteer').selectOption({ label: 'Demo Bob' });
      await has(page.locator('#schedule-list'), '2026-10-13');
      assert.match(await page.locator('#schedule-list').innerText(), /Sound Operator/);
    });
    await check('UI09', 'Whole production overview and responsive roster', async () => {
      await page.getByRole('button', { name: 'Roster', exact: true }).click();
      await page.locator('#roster-performance').selectOption('all');
      await page.locator('#roster-grid .card').nth(1).waitFor();
      assert.equal(await page.locator('#roster-grid .card').count(), 2);
      await page.screenshot({ path: path.join(out, 'production-overview.png'), fullPage: true });
      await page.locator('#roster-performance').selectOption({ label: '2026-10-13 19:30' });
      await has(page.locator('.assignment'), 'Demo Bob');
      await page.setViewportSize({ width: 390, height: 844 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: path.join(out, 'mobile-roster.png'), fullPage: true });
      await page.setViewportSize({ width: 1365, height: 900 });
    });
    await check('UI10', 'Remove assignment opens its role', async () => {
      await page.locator('.assignment').getByRole('button', { name: 'Remove', exact: true }).click();
      await page.locator('.assignment').waitFor({ state: 'detached' });
      assert.match(await page.locator('.roster-row').filter({ hasText: 'Sound Operator' }).innerText(), /1 open/);
    });
    await check('UI11', 'Deactivate volunteer and still find their schedule', async () => {
      await page.getByRole('button', { name: 'Volunteers', exact: true }).click();
      await page.locator('#volunteer-list tr').filter({ hasText: 'Demo Alice' }).getByRole('button', { name: 'Make inactive' }).click();
      await page.locator('#volunteer-list tr').filter({ hasText: 'Demo Alice' }).waitFor({ state: 'detached' });
      await page.locator('#volunteer-show-inactive').check();
      await has(page.locator('#volunteer-list tr'), 'Demo Alice');
      await page.getByRole('button', { name: 'My Schedule', exact: true }).click();
      await page.locator('#schedule-volunteer').selectOption({ label: 'Demo Alice (inactive)' });
      await has(page.locator('#schedule-list'), 'No assignments yet');
    });
    await check('UI12', 'No uncaught app errors or unexpected HTTP failures', async () => {
      assert.deepEqual(results.errors, []);
      assert.equal(results.responses.length, 1);
      assert.equal(results.responses[0].status, 409);
    });
    results.status = 'PASS';
  } catch (error) { results.status = 'FAIL'; results.failure = error.stack; await page.screenshot({ path: path.join(out, 'failure.png'), fullPage: true }); throw error; }
  finally {
    results.finishedAtUtc = new Date().toISOString();
    results.browser = browser.version(); results.serverLog = serverLog;
    fs.writeFileSync(path.join(out, 'ui-results.json'), JSON.stringify(results, null, 2));
    await browser.close();
  }
}
main().then(() => console.log(JSON.stringify({ status: results.status, checks: results.checks.length, out }))).catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => server.kill());
