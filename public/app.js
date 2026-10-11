'use strict';

/* Front-end logic for the Tinshed Crew Roster. Plain fetch + DOM, no build
   step, no framework — the handover is the code plus `npm start`. */

const $ = (sel) => document.querySelector(sel);
const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  for (const child of children) {
    if (child) node.append(child);
  }
  return node;
};

async function api(method, path, body) {
  let res;
  try { res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }); } catch {
    banner('Connection lost. Check the server and try again.');
    throw new Error('Server connection failed');
  }
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, body: data };
}

let bannerTimer;
function banner(message, kind = 'error') {
  const b = $('#banner');
  b.textContent = message;
  b.className = `banner ${kind}`;
  b.classList.remove('hidden');
  clearTimeout(bannerTimer);
  if (kind !== 'error') bannerTimer = setTimeout(() => b.classList.add('hidden'), 6000);
}

function info(message) {
  banner(message, 'info');
}

// One keyboard-accessible editor, with server refusals kept beside its fields.
function editor(title, fields, save, note = '') {
  const dialog = el('dialog', { 'aria-labelledby': 'editor-title' });
  const form = el('form', {}, el('h2', { id: 'editor-title', text: title }));
  if (note) form.append(el('p', { text: note }));
  fields.forEach(([label, input], index) => {
    const id = `editor-field-${index}`; input.id = id;
    form.append(el('div', { class: 'editor-field' }, el('label', { text: label, for: id }), input));
  });
  const error = el('p', { class: 'error-text', role: 'alert' });
  const submit = el('button', { type: 'submit', text: 'Save changes' });
  const cancel = el('button', { type: 'button', class: 'secondary', text: 'Cancel' });
  cancel.addEventListener('click', () => dialog.close());
  form.append(error, el('div', { class: 'actions' }, submit, cancel));
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); submit.disabled = true;
    try {
      const result = await save();
      if (result.status >= 200 && result.status < 300) dialog.close();
      else error.textContent = result.body?.error || 'Could not save changes.';
    } catch { error.textContent = 'Connection lost. Check the server and try again.'; }
    finally { submit.disabled = false; }
  });
  dialog.addEventListener('close', () => dialog.remove());
  dialog.append(form); document.body.append(dialog); dialog.showModal();
}

function action(text, handler) {
  const button = el('button', { type: 'button', class: 'small secondary', text });
  button.addEventListener('click', handler);
  return button;
}

async function editAssignment(assignment, performanceId, currentRole) {
  const productionId = $('#roster-production').value;
  const perfs = (await api('GET', `/api/productions/${productionId}/performances`)).body;
  const performance = el('select', {});
  for (const perf of perfs) performance.append(el('option', { value: perf.id, text: `${perf.date} ${perf.startTime}` }));
  performance.value = String(performanceId);
  // Keep the current person selected even after deactivation. Otherwise the
  // browser silently selects the first active volunteer and Save replaces history.
  const volunteer = el('select', {}, ...volunteerOptions(assignment.volunteerId, true));
  const role = el('select', {});
  const loadRoles = async () => {
    const r = await api('GET', `/api/productions/${productionId}/performances/${performance.value}/roles`);
    role.replaceChildren(...r.body.map(r => el('option', { value: r.role, text: r.role })));
    if (Array.from(role.options).some(o => o.value === currentRole)) role.value = currentRole;
  };
  await loadRoles(); performance.addEventListener('change', loadRoles);
  editor('Change assignment', [['Volunteer', volunteer], ['Performance', performance], ['Role', role]], async () => {
    // A no-op editor submission must not rewrite a historical assignment or
    // reset its confirmation. Actual changes still go through API validation.
    if (Number(volunteer.value) === assignment.volunteerId && Number(performance.value) === Number(performanceId) && role.value === currentRole) {
      info('No assignment changes.');
      return { status: 200 };
    }
    const r = await api('PUT', `/api/assignments/${assignment.id}`, { volunteerId: Number(volunteer.value), performanceId: Number(performance.value), role: role.value });
    if (r.status === 200) { await renderRosterGrid(performanceId); info('Assignment updated. Changed assignments need confirmation again.'); }
    return r;
  }, 'Inactive volunteers retain their existing assignment. Select an active replacement before changing their duty.');
}

/* ---------- tabs ---------- */

$('#tabs').addEventListener('click', (e) => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  $(`#view-${tab.dataset.view}`).classList.add('active');
  refreshActiveView(tab.dataset.view);
});

function refreshActiveView(view) {
  if (view === 'roster') refreshRoster();
  if (view === 'productions') refreshProductions();
  if (view === 'volunteers') refreshVolunteers();
  if (view === 'schedule') refreshSchedule();
}

/* ---------- shared data ---------- */

let volunteers = [];

async function loadVolunteers() {
  const res = await api('GET', '/api/volunteers?active=all');
  volunteers = res.body;
}

function volunteerOptions(selectedId, includeCurrentInactive = false) {
  return volunteers
    .filter((v) => v.active || (includeCurrentInactive && v.id === selectedId))
    .map((v) => el('option', { value: String(v.id), text: v.active ? v.name : `${v.name} (inactive - existing assignment)`, ...(selectedId === v.id ? { selected: '' } : {}) }));
}

/* ---------- roster view ---------- */

async function refreshRoster() {
  await loadVolunteers();
  const prodSel = $('#roster-production');
  const perfSel = $('#roster-performance');
  const prevProd = prodSel.value;
  const prevPerf = perfSel.value;

  const prods = await api('GET', '/api/productions');
  prodSel.replaceChildren(el('option', { value: '', text: '— choose a production —' }));
  for (const p of prods.body) {
    prodSel.append(el('option', { value: String(p.id), text: p.title }));
  }
  if (prevProd) prodSel.value = prevProd;

  if (!prodSel.value) {
    perfSel.replaceChildren();
    $('#roster-grid').replaceChildren();
    return;
  }

  const perfs = await api('GET', `/api/productions/${prodSel.value}/performances`);
  perfSel.replaceChildren(el('option', { value: '', text: '— choose a performance —' }), el('option', { value: 'all', text: 'All performances (overview)' }));
  for (const p of perfs.body) {
    perfSel.append(el('option', { value: String(p.id), text: `${p.date} ${p.startTime}` }));
  }
  if (prevPerf) perfSel.value = prevPerf;

  if (perfSel.value) await renderRosterGrid(perfSel.value);
  else $('#roster-grid').replaceChildren();
}

async function renderRosterGrid(performanceId) {
  if (performanceId === 'all') {
    const r = await api('GET', `/api/productions/${$('#roster-production').value}/roster`);
    const grid = $('#roster-grid'); grid.replaceChildren();
    for (const perf of r.body.performances) {
      const card = el('div', { class: 'card' }, el('h2', { text: `${perf.date} ${perf.startTime}` }));
      for (const row of perf.roster) card.append(el('p', { text: `${row.role}: ${row.assignments.map(a => a.volunteerName).join(', ') || 'No one assigned'} (${row.open} open)` }));
      grid.append(card);
    }
    if (!r.body.performances.length) grid.append(el('p', { text: 'No performances recorded.' }));
    return;
  }
  const res = await api('GET', `/api/performances/${performanceId}/roster`);
  const grid = $('#roster-grid');
  grid.replaceChildren();

  let holes = 0;
  for (const position of res.body) {
    const people = position.assignments
      .map((a) => {
        const confirmed = a.confirmed ? '' : ' (unconfirmed)';
        const controls = [action('Change', () => editAssignment(a, performanceId, position.role)), action('Remove', async () => {
          if (!confirm(`Remove ${a.volunteerName} from ${position.role}?`)) return;
          const r = await api('DELETE', `/api/assignments/${a.id}`);
          if (r.status === 204) { await renderRosterGrid(performanceId); info('Assignment removed.'); }
          else banner(r.body?.error || 'Could not remove assignment.');
        })];
        if (!a.confirmed) controls.unshift(action('Confirm', async () => {
          const r = await api('POST', `/api/assignments/${a.id}/confirm`);
          if (r.status === 200) { await renderRosterGrid(performanceId); info('Confirmation recorded.'); }
          else banner(r.body?.error || 'Could not confirm assignment.');
        }));
        return el('span', { class: 'assignment' }, el('span', { text: `${a.volunteerName}${confirmed}` }), el('span', { class: 'actions' }, ...controls));
      });
    if (people.length === 0) {
      people.push(el('span', { class: 'hole', text: '— open —' }));
    }

    const assignSelect = el('select', { 'aria-label': `Volunteer for ${position.role}` });
    assignSelect.append(el('option', { value: '', text: 'assign…' }));
    for (const opt of volunteerOptions()) assignSelect.append(opt);
    const assignBtn = el('button', { class: 'small', text: 'Assign' });
    assignBtn.addEventListener('click', async () => {
      if (!assignSelect.value) return;
      const r = await api('POST', `/api/performances/${performanceId}/assignments`, {
        volunteerId: Number(assignSelect.value),
        role: position.role,
      });
      if (r.status === 201) { await renderRosterGrid(performanceId); info('Volunteer assigned.'); }
      else banner(r.body?.error || 'Assignment failed.');
    });

    if (position.open > 0) holes += 1;
    const gap = position.open > 0
      ? el('span', { class: 'gap-badge', text: `${position.open} open` })
      : el('span', { class: 'ok', text: 'full' });

    grid.append(
      el('div', { class: 'roster-row' },
        el('span', { class: 'roster-role', text: `${position.role} ×${position.required}` }),
        el('span', { class: 'roster-people' }, ...people),
        el('span', { class: 'roster-assign' }, assignSelect, assignBtn, gap)
      )
    );
  }
  grid.prepend(el('p', { class: 'roster-summary', text: `${holes} role(s) still need volunteers. Confirmation records a reply; it does not send a message.` }));
}

$('#roster-production').addEventListener('change', refreshRoster);
$('#roster-performance').addEventListener('change', (e) => {
  if (e.target.value) renderRosterGrid(e.target.value);
  else $('#roster-grid').replaceChildren();
});
$('#roster-refresh').addEventListener('click', refreshRoster);

/* ---------- productions view ---------- */

$('#production-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = $('#production-title').value.trim();
  if (!title) return;
  const res = await api('POST', '/api/productions', { title });
  if (res.status === 201) {
    info(`Production "${title}" created.`);
    $('#production-title').value = '';
    refreshProductions();
  } else {
    banner(res.body?.error || 'Could not create production.');
  }
});

async function refreshProductions() {
  const prods = await api('GET', '/api/productions');
  const list = $('#production-list');
  list.replaceChildren();

  if (prods.body.length === 0) {
    list.append(el('p', { text: 'No productions yet. Add the first one above.' }));
    return;
  }

  for (const prod of prods.body) {
    const detail = await api('GET', `/api/productions/${prod.id}`);
    const card = el('div', { class: 'card production-card' },
      el('h2', { text: prod.title })
    );
    card.append(action('Rename production', () => {
      const title = el('input', { value: prod.title, required: '' });
      editor('Rename production', [['Title', title]], async () => {
        const r = await api('PUT', `/api/productions/${prod.id}`, { title: title.value });
        if (r.status === 200) await refreshProductions();
        return r;
      });
    }));

    if (detail.body.performances.length === 0) {
      card.append(el('p', { text: 'No performances recorded.' }));
    }
    for (const perf of detail.body.performances) {
      const line = el('div', { class: 'perf-line' },
        el('span', { class: 'date', text: `${perf.date} · ${perf.startTime}` }),
        el('button', { class: 'small secondary', text: 'Remove' })
      );
      line.querySelector('button').addEventListener('click', async () => {
        if (!confirm('Remove this performance and all its assignments?')) return;
        const r = await api('DELETE', `/api/productions/${prod.id}/performances/${perf.id}`);
        if (r.status === 204) refreshProductions();
        else banner(r.body?.error || 'Could not remove performance.');
      });
      line.append(action('Edit performance', () => {
        const date = el('input', { type: 'date', value: perf.date, required: '' });
        const time = el('input', { type: 'time', value: perf.startTime, required: '' });
        editor('Edit performance', [['Date', date], ['Start time', time]], async () => {
          const r = await api('PUT', `/api/productions/${prod.id}/performances/${perf.id}`, { date: date.value, startTime: time.value });
          if (r.status === 200) await refreshProductions();
          return r;
        }, 'Changing the date or time clears confirmations. Unavailable volunteers must be reassigned first.');
      }), action('Edit crew call', async () => {
        const path = `/api/productions/${prod.id}/performances/${perf.id}/roles`;
        const roles = (await api('GET', path)).body;
        const list = el('div', { class: 'crew-editor' });
        function addRole(role = '', count = 1) {
          const name = el('input', { value: role, required: '', 'aria-label': 'Role name' });
          const required = el('input', { type: 'number', min: '1', step: '1', value: count, required: '', 'aria-label': 'People required' });
          const row = el('div', { class: 'crew-editor-row' }, name, required);
          row.append(action('Remove role', () => row.remove())); list.append(row);
        }
        for (const r of roles) addRole(r.role, r.required_count);
        const panel = el('div', {}, list, action('Add role', () => addRole()));
        editor('Edit crew call', [['Roles and people required', panel]], async () => {
          const payload = Array.from(list.children).map(row => ({ role: row.children[0].value, required_count: Number(row.children[1].value) }));
          const r = await api('PUT', path, { roles: payload });
          if (r.status === 200) info('Crew call saved.');
          return r;
        }, 'Remove or reassign volunteers before deleting a role they hold.');
      }));
      card.append(line);
    }

    const addForm = el('div', { class: 'perf-line' });
    const date = el('input', { type: 'date', 'aria-label': 'New performance date' });
    const time = el('input', { type: 'time', value: '19:30', 'aria-label': 'New performance start time' });
    const call = el('select', { 'aria-label': 'Crew call template' },
      el('option', { value: 'evening', text: 'evening call' }),
      el('option', { value: 'matinee', text: 'matinee call' })
    );
    const addBtn = el('button', { class: 'small', text: 'Add performance' });
    addBtn.addEventListener('click', async () => {
      const r = await api('POST', `/api/productions/${prod.id}/performances`, {
        date: date.value,
        startTime: time.value,
        callTemplate: call.value,
      });
      if (r.status === 201) refreshProductions();
      else banner(r.body?.error || 'Could not add performance.');
    });
    addForm.append(date, time, call, addBtn);
    card.append(addForm);

    const removeProd = el('button', { class: 'small secondary', text: 'Remove production' });
    removeProd.addEventListener('click', async () => {
      if (!confirm(`Remove ${prod.title}, its performances and all their assignments?`)) return;
      const r = await api('DELETE', `/api/productions/${prod.id}`);
      if (r.status === 204) refreshProductions();
      else banner(r.body?.error || 'Could not remove production.');
    });
    card.append(el('div', { style: 'margin-top:8px' }, removeProd));

    list.append(card);
  }
}

/* ---------- volunteers view ---------- */

$('#volunteer-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: $('#volunteer-name').value.trim(),
    phone: $('#volunteer-phone').value.trim(),
    email: $('#volunteer-email').value.trim(),
    emergency_contact: $('#volunteer-emergency').value.trim(),
  };
  const res = await api('POST', '/api/volunteers', payload);
  if (res.status === 201) {
    info(`Volunteer "${payload.name}" added.`);
    e.target.reset();
    refreshVolunteers();
  } else {
    banner(res.body?.error || 'Could not add volunteer.');
  }
});

async function refreshVolunteers() {
  const showInactive = $('#volunteer-show-inactive').checked;
  const res = await api('GET', `/api/volunteers${showInactive ? '?active=all' : ''}`);
  const list = $('#volunteer-list');
  list.replaceChildren();

  const table = el('table', {},
    el('thead', {}, el('tr', {},
      el('th', { text: 'Name' }), el('th', { text: 'Phone' }),
      el('th', { text: 'Email' }), el('th', { text: 'Status' }), el('th', { text: '' })
    ))
  );
  const tbody = el('tbody', {});
  for (const v of res.body) {
    const deactivateBtn = v.active
      ? el('button', { class: 'small secondary', text: 'Make inactive' })
      : el('span', { text: 'inactive', style: 'color:#a03030' });
    if (v.active) {
      deactivateBtn.addEventListener('click', async () => {
        await api('POST', `/api/volunteers/${v.id}/deactivate`);
        refreshVolunteers();
      });
    }
    const actions = el('td', {}, deactivateBtn);
    actions.prepend(action('Edit contact', () => {
      const name = el('input', { value: v.name, required: '' });
      const phone = el('input', { value: v.phone || '' });
      const email = el('input', { type: 'email', value: v.email || '' });
      const emergency = el('input', { value: v.emergencyContact || '' });
      editor('Edit volunteer', [['Name', name], ['Phone', phone], ['Email', email], ['Emergency contact', emergency]], async () => {
        const r = await api('PUT', `/api/volunteers/${v.id}`, { name: name.value, phone: phone.value, email: email.value, emergency_contact: emergency.value });
        if (r.status === 200) await refreshVolunteers();
        return r;
      }, 'Keep a name and at least one contact method.');
    }));
    const row = el('tr', {},
      el('td', { text: v.name }),
      el('td', { text: v.phone }),
      el('td', { text: v.email || '—' }),
      el('td', { text: v.active ? 'active' : 'inactive' }),
      actions
    );
    if (v.active) {
      const unavBtn = el('button', { class: 'small secondary', text: 'Unavailable…' });
      unavBtn.addEventListener('click', () => toggleUnavailabilityPanel(v, row));
      actions.prepend(unavBtn);
    }
    tbody.append(row);
  }
  table.append(tbody);
  list.append(table);
}

/* Inline panel per volunteer row: list recorded unavailability and add/remove
   ranges. The API refuses assignments that clash with these ranges. */
function toggleUnavailabilityPanel(volunteer, row) {
  const existing = row.nextElementSibling;
  if (existing && existing.dataset.panel === String(volunteer.id)) {
    existing.remove();
    return;
  }
  const panelRow = el('tr', { class: 'unavailability-panel', 'data-panel': String(volunteer.id) });
  const cell = el('td', { colspan: '5' });
  panelRow.append(cell);

  const render = async () => {
    cell.replaceChildren();
    const res = await api('GET', `/api/volunteers/${volunteer.id}/unavailability`);
    const list = el('ul', { class: 'unavailability-list' });
    if (res.body.length === 0) {
      list.append(el('li', { text: 'No unavailable dates recorded.' }));
    }
    for (const u of res.body) {
      const remove = el('button', { class: 'small secondary', text: 'Remove' });
      remove.addEventListener('click', async () => {
        await api('DELETE', `/api/volunteers/${volunteer.id}/unavailability/${u.id}`);
        render();
      });
      list.append(el('li', {},
        el('span', { text: `${u.startsOn} – ${u.endsOn}${u.reason ? ` · ${u.reason}` : ''}` }),
        remove
      ));
    }

    const starts = el('input', { type: 'date', 'aria-label': 'Unavailable from' });
    const ends = el('input', { type: 'date', 'aria-label': 'Unavailable until' });
    const reason = el('input', { type: 'text', placeholder: 'reason (optional)', 'aria-label': 'Reason' });
    const add = el('button', { class: 'small', text: 'Add range' });
    add.addEventListener('click', async () => {
      const r = await api('POST', `/api/volunteers/${volunteer.id}/unavailability`, {
        startsOn: starts.value,
        endsOn: ends.value,
        reason: reason.value.trim() || undefined,
      });
      if (r.status === 201) render();
      else banner(r.body?.error || 'Could not record unavailability.');
    });

    cell.append(
      el('p', { class: 'panel-title', text: `Unavailable dates — ${volunteer.name}` }),
      list,
      el('div', { class: 'perf-line' }, starts, ends, reason, add)
    );
  };

  render();
  row.after(panelRow);
}

$('#volunteer-show-inactive').addEventListener('change', refreshVolunteers);

/* ---------- my schedule view ---------- */

async function refreshSchedule() {
  await loadVolunteers();
  const sel = $('#schedule-volunteer');
  const prev = sel.value;
  sel.replaceChildren(el('option', { value: '', text: '— choose a volunteer —' }));
  for (const v of volunteers) sel.append(el('option', { value: v.id, text: `${v.name}${v.active ? '' : ' (inactive)'}` }));
  if (prev) sel.value = prev;
  if (sel.value) await renderSchedule(sel.value);
  else $('#schedule-list').replaceChildren();
}

async function renderSchedule(volunteerId) {
  const res = await api('GET', `/api/volunteers/${volunteerId}/assignments`);
  const list = $('#schedule-list');
  list.replaceChildren();

  if (res.body.length === 0) {
    list.append(el('p', { text: 'No assignments yet — enjoy the quiet.' }));
    return;
  }

  const table = el('table', {},
    el('thead', {}, el('tr', {},
      el('th', { text: 'Production' }), el('th', { text: 'Date' }),
      el('th', { text: 'Start' }), el('th', { text: 'Role' }), el('th', { text: 'Confirmed' })
    ))
  );
  const tbody = el('tbody', {});
  for (const row of res.body) {
    tbody.append(el('tr', {},
      el('td', { text: row.production }),
      el('td', { text: row.date }),
      el('td', { text: row.startTime }),
      el('td', { text: row.role }),
      el('td', { text: row.confirmed ? 'yes' : 'no', class: row.confirmed ? 'ok' : 'unconfirmed' })
    ));
  }
  table.append(tbody);
  list.append(table);
}

$('#schedule-volunteer').addEventListener('change', (e) => {
  if (e.target.value) renderSchedule(e.target.value);
  else $('#schedule-list').replaceChildren();
});
$('#schedule-refresh').addEventListener('click', refreshSchedule);

/* ---------- boot ---------- */

refreshRoster();
