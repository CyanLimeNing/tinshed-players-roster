'use strict';

/** Repeatable independent AI review of inactive-history editing.
 * Browser skill is unavailable in this session, so the frontend-testing-debugging
 * skill permits ordinary Playwright. All fixtures are synthetic and in memory.
 * Run with Node 24; A3_PLAYWRIGHT_MODULE may point to an installed Playwright.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const projectRoot = path.resolve(__dirname, '..');
const outputRoot = path.resolve(process.env.A3_UI_EVIDENCE_DIR || path.join(__dirname, '../docs/a3/evidence/ui-review'), 'inactive-ui');
// Playwright is an optional validation tool; the application does not need it.
const { chromium } = require(process.env.A3_PLAYWRIGHT_MODULE || 'playwright');
const { createDb } = require(path.join(projectRoot, 'src/db'));
const createApp = require(path.join(projectRoot, 'src/app'));
assert.ok(!fs.existsSync(outputRoot), 'Choose a new A3_UI_EVIDENCE_DIR to preserve earlier UI evidence.');
fs.mkdirSync(outputRoot, { recursive: true });

const results = {
  startedAtUtc: new Date().toISOString(), finishedAtUtc: null,
  scope: 'AI technical regression; does not replace human peer review or stakeholder UAT',
  routing: 'Browser skill not available; frontend-testing-debugging Playwright fallback',
  tool: 'Playwright / installed Edge', node: process.version,
  viewport: { width: 1365, height: 900 }, checks: [], errors: [], console: [], responses: [],
  sourceHashes: Object.fromEntries(['public/app.js', 'src/routes/assignments.js', 'src/routes/volunteers.js'].map(file => [
    file, createHash('sha256').update(fs.readFileSync(path.join(projectRoot, file))).digest('hex'),
  ])),
};

async function withFixture(browser, includeActiveReplacement, run) {
  const db = createDb(':memory:');
  const server = createApp(db).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const request = async (method, route, body, expectedStatus = 200) => {
    const response = await fetch(baseUrl + route, {
      method, headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    assert.equal(response.status, expectedStatus, `${method} ${route}`);
    return response.json();
  };
  const page = await browser.newPage({ viewport: results.viewport });
  const puts = [];
  page.on('pageerror', error => results.errors.push(error.message));
  page.on('request', request => { if (request.method() === 'PUT') puts.push({ url: request.url(), body: request.postDataJSON() }); });
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) results.console.push({ type: message.type(), text: message.text() });
  });
  page.on('response', response => {
    if (response.status() >= 400) results.responses.push({ status: response.status(), url: response.url() });
  });
  try {
    const historical = await request('POST', '/api/volunteers', { name: 'Review Historical Volunteer', phone: '0400000000' }, 201);
    const active = includeActiveReplacement
      ? await request('POST', '/api/volunteers', { name: 'Review Active Replacement', phone: '0400000001' }, 201)
      : null;
    const production = await request('POST', '/api/productions', { title: 'Inactive History Regression' }, 201);
    const performance = await request('POST', `/api/productions/${production.id}/performances`, { date: '2026-09-04', startTime: '19:30' }, 201);
    const assignment = await request('POST', `/api/performances/${performance.id}/assignments`, { volunteerId: historical.id, role: 'Usher' }, 201);
    await request('POST', `/api/assignments/${assignment.id}/confirm`);
    await request('POST', `/api/volunteers/${historical.id}/deactivate`);
    const readAssignments = () => request('GET', `/api/performances/${performance.id}/assignments`);
    const before = await readAssignments();
    await page.goto(baseUrl);
    assert.equal(new URL(page.url()).origin, baseUrl);
    assert.match(await page.title(), /Tinshed Players/);
    assert.match(await page.locator('main').innerText(), /Production/);
    assert.equal(await page.locator('nextjs-portal, vite-error-overlay').count(), 0);
    await page.locator('#roster-production').selectOption(String(production.id));
    await page.locator('#roster-performance').selectOption(String(performance.id));
    await page.locator('.assignment').filter({ hasText: historical.name }).waitFor();
    // A new assignment must never offer an inactive volunteer.
    const newAssignmentOptions = await page.getByLabel('Volunteer for Stage Manager', { exact: true }).locator('option').allTextContents();
    assert.ok(!newAssignmentOptions.some(text => text.includes(historical.name)));
    await page.getByRole('button', { name: 'Change', exact: true }).click();
    const volunteerSelect = page.locator('dialog').getByLabel('Volunteer', { exact: true });
    assert.equal(await volunteerSelect.inputValue(), String(historical.id));
    const options = await volunteerSelect.locator('option').allTextContents();
    assert.ok(options.some(text => text.includes(historical.name) && text.includes('inactive')));
    await run({ page, historical, active, performance, before, readAssignments, volunteerSelect, options, puts, baseUrl });
  } finally {
    await page.close();
    await new Promise(resolve => server.close(resolve));
    db.close();
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  results.browserVersion = browser.version();
  try {
    await withFixture(browser, true, async fixture => {
      const { page, active, before, readAssignments, options, puts, baseUrl } = fixture;
      assert.ok(options.some(text => text.includes(active.name)));
      await page.screenshot({ path: path.join(outputRoot, 'inactive-with-active-selected.png'), fullPage: true });
      await page.getByRole('button', { name: 'Save changes', exact: true }).click();
      await page.locator('dialog').waitFor({ state: 'detached' });
      const after = await readAssignments();
      assert.deepEqual(after, before);
      assert.equal(puts.length, 0, 'No-op save must not send an assignment update');
      results.checks.push({ id: 'IUI01', description: 'Inactive current volunteer remains selected with an active alternative; no-op save preserves complete confirmed history', status: 'PASS', baseUrl, before, after, dialogOptions: options, putRequests: puts.length });
    });

    await withFixture(browser, false, async fixture => {
      const { page, before, readAssignments, options, puts, baseUrl } = fixture;
      assert.equal(options.length, 1);
      await page.screenshot({ path: path.join(outputRoot, 'inactive-with-no-active-selected.png'), fullPage: true });
      await page.getByRole('button', { name: 'Save changes', exact: true }).click();
      await page.locator('dialog').waitFor({ state: 'detached' });
      const after = await readAssignments();
      assert.deepEqual(after, before);
      assert.equal(puts.length, 0);
      results.checks.push({ id: 'IUI02', description: 'With no active volunteers, no-op save preserves the complete confirmed assignment', status: 'PASS', baseUrl, before, after, dialogOptions: options, putRequests: puts.length });
    });

    await withFixture(browser, true, async fixture => {
      const { page, active, before, readAssignments, volunteerSelect, puts, baseUrl } = fixture;
      await volunteerSelect.selectOption(String(active.id));
      await page.getByRole('button', { name: 'Save changes', exact: true }).click();
      await page.locator('dialog').waitFor({ state: 'detached' });
      const after = await readAssignments();
      assert.equal(puts.length, 1);
      assert.deepEqual(after, [{ ...before[0], volunteerId: active.id, volunteerName: active.name, confirmed: false, notified: false }]);
      await page.locator('.assignment').filter({ hasText: `${active.name} (unconfirmed)` }).waitFor();
      await page.screenshot({ path: path.join(outputRoot, 'explicit-active-replacement-unconfirmed.png'), fullPage: true });
      results.checks.push({ id: 'IUI03', description: 'An explicit active replacement succeeds with stable assignment identity and renewed confirmation requirement', status: 'PASS', baseUrl, before, after, putRequests: puts.length });
    });

    await withFixture(browser, true, async fixture => {
      const { page, before, readAssignments, puts, baseUrl } = fixture;
      await page.locator('dialog').getByLabel('Role', { exact: true }).selectOption('Bar');
      const refused = page.waitForResponse(response => response.request().method() === 'PUT' && response.url().includes('/api/assignments/'));
      await page.getByRole('button', { name: 'Save changes', exact: true }).click();
      const response = await refused;
      assert.equal(response.status(), 400);
      await page.locator('dialog .error-text').filter({ hasText: 'inactive' }).waitFor();
      const after = await readAssignments();
      assert.deepEqual(after, before);
      assert.equal(puts.length, 1);
      await page.screenshot({ path: path.join(outputRoot, 'inactive-role-change-refused.png'), fullPage: true });
      results.checks.push({ id: 'IUI04', description: 'Changing an inactive volunteer duty is refused visibly and preserves all original assignment fields', status: 'PASS', baseUrl, before, after, expectedHttpStatus: 400, errorText: await page.locator('dialog .error-text').innerText(), putRequests: puts.length });
    });
    assert.deepEqual(results.errors, [], 'No uncaught browser errors');
    assert.equal(results.responses.length, 1);
    assert.equal(results.responses[0].status, 400);
    assert.ok(results.responses[0].url.includes('/api/assignments/'));
    results.consoleInterpretation = 'Any HTTP 400 resource console entry is expected from the deliberate inactive duty refusal; no uncaught JavaScript errors.';
    results.totals = { tests: results.checks.length, pass: results.checks.length, fail: 0 };
  } catch (error) {
    results.failure = { message: error.message, stack: error.stack };
    results.totals = { plannedFlows: 4, pass: results.checks.length, fail: 1, notCompleted: Math.max(3 - results.checks.length, 0) };
    process.exitCode = 1;
  } finally {
    await browser.close();
    results.finishedAtUtc = new Date().toISOString();
    fs.writeFileSync(path.join(outputRoot, 'results.json'), JSON.stringify(results, null, 2) + '\n');
    console.log(JSON.stringify({ output: outputRoot, totals: results.totals, failure: results.failure || null, browser: results.browserVersion, node: results.node }, null, 2));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
