'use strict';

/**
 * UI regressions for assignment role loading. Execute the actual browser helper,
 * editor and editAssignment source with a minimal DOM/select/event model, and
 * send requests to the existing isolated Express/SQLite test server.
 * This is not a rendered-browser or human acceptance test.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const { startTestServer, seedProduction, seedVolunteer } = require('./helpers');

class Element {
  constructor(tag) {
    this.tagName = tag.toLowerCase();
    this.attributes = {};
    this.children = [];
    this.listeners = new Map();
    this.parentElement = null;
    this.disabled = false;
    this.open = false;
    this._value = '';
    this.textContent = '';
    this.classList = {
      add: name => this.setClasses([...this.classes(), name]),
      remove: name => this.setClasses(this.classes().filter(value => value !== name)),
    };
  }

  classes() { return String(this.className || '').split(/\s+/).filter(Boolean); }
  setClasses(values) { this.className = [...new Set(values)].join(' '); }
  get id() { return this.attributes.id || ''; }
  set id(value) { this.attributes.id = String(value); }
  get options() { return this.children.filter(child => child.tagName === 'option'); }
  get value() { return this._value; }
  set value(value) {
    const next = String(value);
    this._value = this.tagName !== 'select' || this.options.some(option => option.value === next) ? next : '';
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === 'value') this.value = value;
    if (name === 'class') this.className = String(value);
    if (name === 'disabled') this.disabled = true;
  }

  append(...children) {
    for (const child of children) {
      child.parentElement = this;
      this.children.push(child);
      if (this.tagName === 'select' && (this.options.length === 1 || Object.hasOwn(child.attributes, 'selected'))) {
        this._value = child.value;
      }
    }
  }

  replaceChildren(...children) {
    for (const child of this.children) child.parentElement = null;
    this.children = [];
    this._value = '';
    this.append(...children);
  }

  remove() {
    if (this.parentElement) {
      this.parentElement.children = this.parentElement.children.filter(child => child !== this);
      this.parentElement = null;
    }
  }

  matches(selector) {
    const match = selector.match(/^([a-z]+)?(?:\.([\w-]+))?(?:\[([\w-]+)(?:=["']?([^"'\]]+)["']?)?\])?$/i);
    if (!match) throw new Error('Unsupported test DOM selector: ' + selector);
    const [, tag, className, attribute, value] = match;
    return (!tag || this.tagName === tag.toLowerCase()) &&
      (!className || this.classes().includes(className)) &&
      (!attribute || Object.hasOwn(this.attributes, attribute) &&
        (value === undefined || this.attributes[attribute] === value));
  }

  querySelectorAll(selector) {
    const found = [];
    for (const child of this.children) {
      if (child.matches(selector)) found.push(child);
      found.push(...child.querySelectorAll(selector));
    }
    return found;
  }

  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  addEventListener(type, handler) {
    const handlers = this.listeners.get(type) || [];
    handlers.push(handler);
    this.listeners.set(type, handlers);
  }
  async dispatch(type) {
    for (const handler of this.listeners.get(type) || []) {
      await handler({ target: this, preventDefault() {} });
    }
  }
  showModal() { this.open = true; }
  close() {
    this.open = false;
    for (const handler of this.listeners.get('close') || []) handler({ target: this });
  }
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function fixture(t) {
  const s = await startTestServer(t);
  const original = await seedProduction(s, { title: 'Role response ordering', date: '2026-10-20' });
  const performances = [{ id: original.performanceId }];
  for (const date of ['2026-10-21', '2026-10-22']) {
    const created = await s.post('/api/productions/' + original.productionId + '/performances', { date, startTime: '19:30', callTemplate: 'evening' });
    assert.equal(created.status, 201);
    performances.push(created.body);
  }
  const [p1, p2, p3] = performances;
  const rolesPath = perf => '/api/productions/' + original.productionId + '/performances/' + perf.id + '/roles';
  for (const [perf, names] of [[p2, ['Stage Manager', 'Box Office']], [p3, ['Stage Manager', 'Usher']]]) {
    assert.equal((await s.put(rolesPath(perf), { roles: names.map(role => ({ role, required_count: 1 })) })).status, 200);
  }
  const volunteer = await seedVolunteer(s, { name: 'Synthetic role loading volunteer' });
  const created = await s.post('/api/performances/' + p1.id + '/assignments', { volunteerId: volunteer.id, role: 'Stage Manager' });
  assert.equal(created.status, 201);
  const confirmed = await s.post('/api/assignments/' + created.body.id + '/confirm');
  assert.equal(confirmed.status, 200);
  return { s, original, p1, p2, p3, volunteer, assignment: confirmed.body, rolesPath };
}

async function openEditor(f) {
  const body = new Element('body');
  const banner = new Element('div');
  banner.id = 'banner';
  const production = { value: String(f.original.productionId) };
  const plans = new Map();
  const writes = [];
  const document = {
    body,
    createElement: tag => new Element(tag),
    querySelector: selector => selector === '#roster-production' ? production : selector === '#banner' ? banner : body.querySelector(selector),
  };
  const delayRoles = perf => {
    const entered = deferred();
    const released = deferred();
    const path = f.rolesPath(perf);
    const queue = plans.get(path) || [];
    queue.push({ entered, released });
    plans.set(path, queue);
    return { entered: entered.promise, resolve: released.resolve, reject: released.reject };
  };
  const controlledFetch = async (path, options = {}) => {
    const plan = options.method === 'GET' && plans.get(path)?.shift();
    if (options.method === 'PUT') writes.push({ path, body: JSON.parse(options.body) });
    const response = await fetch(f.s.baseUrl + path, options);
    if (plan) {
      plan.entered.resolve();
      await plan.released.promise;
    }
    return response;
  };
  const source = readFileSync(join(__dirname, '..', 'public', 'app.js'), 'utf8');
  const editorEnd = source.indexOf('/* ---------- tabs ---------- */');
  const sharedStart = source.indexOf('let volunteers = [];');
  const sharedEnd = source.indexOf('/* ---------- roster view ---------- */');
  assert.ok(editorEnd > 0 && sharedStart > editorEnd && sharedEnd > sharedStart);
  const sandbox = {
    document,
    fetch: controlledFetch,
    setTimeout: () => 0,
    clearTimeout: () => {},
    renderRosterGrid: async () => {},
    fixtureVolunteers: [f.volunteer],
  };
  vm.createContext(sandbox);
  vm.runInContext(source.slice(0, editorEnd) + '\n' + source.slice(sharedStart, sharedEnd) +
    '\nvolunteers = fixtureVolunteers; this.openAssignmentEditor = editAssignment;', sandbox, { filename: 'public/app.js' });
  await sandbox.openAssignmentEditor(f.assignment, String(f.p1.id), 'Stage Manager');
  const dialog = body.querySelector('dialog');
  assert.ok(dialog && dialog.open);
  const form = dialog.querySelector('form');
  const selects = dialog.querySelectorAll('select');
  assert.equal(selects.length, 3);
  const [, performance, role] = selects;
  const save = dialog.querySelector('button[type="submit"]');
  const error = dialog.querySelector('[role="alert"]');
  assert.ok(save && error);
  return {
    dialog, form, performance, role, save, error, banner, writes, delayRoles,
    selectPerformance(perf) { performance.value = String(perf.id); return performance.dispatch('change'); },
    forceSubmit() { return form.dispatch('submit'); },
    stored() { return f.s.db.prepare('SELECT * FROM assignments WHERE id = ?').get(f.assignment.id); },
  };
}

test('UIROLE01 stale successful role responses preserve the latest selected duty and saved assignment', async t => {
  const f = await fixture(t);
  const ui = await openEditor(f);
  const delayed = ui.delayRoles(f.p2);
  const earlierChange = ui.selectPerformance(f.p2);
  await delayed.entered;
  await ui.selectPerformance(f.p3);
  ui.role.value = 'Usher';
  assert.equal(ui.role.value, 'Usher');
  const currentOptions = ui.role.options.map(option => option.value);
  assert.deepEqual(currentOptions, ['Stage Manager', 'Usher']);

  delayed.resolve();
  await earlierChange;
  assert.equal(ui.performance.value, String(f.p3.id));
  assert.equal(ui.role.value, 'Usher');
  assert.deepEqual(ui.role.options.map(option => option.value), currentOptions);
  assert.equal(ui.role.disabled, false);
  assert.equal(ui.save.disabled, false);

  await ui.forceSubmit();
  assert.equal(ui.writes.length, 1);
  assert.deepEqual(ui.writes[0].body, { volunteerId: f.volunteer.id, performanceId: f.p3.id, role: 'Usher' });
  const stored = ui.stored();
  assert.equal(stored.id, f.assignment.id);
  assert.equal(stored.performance_id, f.p3.id);
  assert.equal(stored.role, 'Usher');
  assert.equal(stored.volunteer_id, f.volunteer.id);
  assert.equal(stored.confirmed, 0);
  assert.equal(ui.dialog.open, false);
});

test('UIROLE02 pending or failed current roles cannot write and reselecting recovers despite a stale error', async t => {
  const f = await fixture(t);
  const ui = await openEditor(f);
  const before = ui.stored();
  const failing = ui.delayRoles(f.p2);
  const failingChange = ui.selectPerformance(f.p2);
  await failing.entered;
  assert.equal(ui.role.disabled, true);
  assert.equal(ui.save.disabled, true);

  // Force the form handler directly as a defence-in-depth check; a disabled
  // button alone must not allow stale roles through an Enter/script submission.
  await ui.forceSubmit();
  assert.equal(ui.writes.length, 0);
  assert.deepEqual(ui.stored(), before);
  assert.equal(ui.dialog.open, true);
  assert.equal(ui.save.disabled, true);

  failing.reject(new Error('Synthetic latest role request failure'));
  await failingChange;
  assert.equal(ui.role.disabled, true);
  assert.equal(ui.save.disabled, true);
  assert.ok(ui.error.textContent.trim());
  await ui.forceSubmit();
  assert.equal(ui.writes.length, 0);
  assert.deepEqual(ui.stored(), before);
  assert.equal(ui.dialog.open, true);
  assert.equal(ui.save.disabled, true);

  // Start another old request, then recover by selecting the latest performance.
  // A late failure of the old request must not corrupt the recovered editor.
  const stale = ui.delayRoles(f.p2);
  const staleChange = ui.selectPerformance(f.p2);
  await stale.entered;
  await ui.selectPerformance(f.p3);
  ui.role.value = 'Usher';
  assert.equal(ui.role.disabled, false);
  assert.equal(ui.save.disabled, false);
  const recoveredError = ui.error.textContent;
  const recoveredBanner = ui.banner.textContent;
  stale.reject(new Error('Synthetic stale role request failure'));
  await staleChange;
  assert.equal(ui.role.value, 'Usher');
  assert.deepEqual(ui.role.options.map(option => option.value), ['Stage Manager', 'Usher']);
  assert.equal(ui.role.disabled, false);
  assert.equal(ui.save.disabled, false);
  assert.equal(ui.error.textContent, recoveredError);
  assert.equal(ui.banner.textContent, recoveredBanner);

  await ui.forceSubmit();
  assert.equal(ui.writes.length, 1);
  assert.deepEqual(ui.writes[0].body, { volunteerId: f.volunteer.id, performanceId: f.p3.id, role: 'Usher' });
  const stored = ui.stored();
  assert.equal(stored.id, f.assignment.id);
  assert.equal(stored.performance_id, f.p3.id);
  assert.equal(stored.role, 'Usher');
  assert.equal(stored.confirmed, 0);
});

