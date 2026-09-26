/* Exnovo Round Table — a WebUI page over Hermes' own Kanban engine.
 * Quests are Kanban tasks. Knights are Hermes profiles (task assignee = profile name).
 * Arthur (the Orchestrator) is the default profile and the Kanban dispatcher.
 * Read-only view: every action opens WebUI's native Kanban UI, so there is one source of truth. */
(function () {
  'use strict';
  if (window.ExnovoRoundTable) return;

  var NS = 'http://www.w3.org/2000/svg';
  var POLL_MS = 5000;
  var ACTIVE = ['triage', 'todo', 'scheduled', 'ready', 'running', 'blocked', 'review'];
  // Roster: the default profile sits as Arthur; knights bind to profiles of the same name when they exist.
  var ROSTER = [
    { id: 'lancelot', name: 'Lancelot', role: 'Implementer' },
    { id: 'tristan', name: 'Tristan', role: 'Debugger' },
    { id: 'galahad', name: 'Galahad', role: 'Test executor' },
  ];
  var ARTHUR = { id: 'default', name: 'Arthur', role: 'Orchestrator' };

  var state = { tasks: [], profiles: [], lastEvent: null, error: null, prev: {}, timer: null, root: null };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function getJSON(url) {
    return fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } }).then(function (r) {
      if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
      return r.json();
    });
  }

  // ---- data ----
  function seatStateFor(tasks) {
    if (tasks.some(function (t) { return t.status === 'blocked'; })) return 'blocked';
    if (tasks.some(function (t) { return t.status === 'running'; })) return 'executing';
    if (tasks.some(function (t) { return t.status === 'review'; })) return 'mediating';
    if (tasks.some(function (t) { return ['ready', 'todo', 'triage', 'scheduled'].indexOf(t.status) >= 0; })) return 'thinking';
    return 'idle';
  }
  function seats() {
    var names = state.profiles.map(function (p) { return (p.name || p.id || p).toString().toLowerCase(); });
    var list = [ARTHUR].concat(ROSTER).map(function (k) {
      var mine = state.tasks.filter(function (t) { return (t.assignee || 'default').toLowerCase() === k.id && ACTIVE.indexOf(t.status) >= 0; });
      return { id: k.id, name: k.name, role: k.role, bound: k.id === 'default' || names.indexOf(k.id) >= 0, tasks: mine, state: seatStateFor(mine) };
    });
    // Extra profiles (not in the roster) take seats too, so nothing Hermes runs is invisible.
    names.forEach(function (n) {
      if (n === 'default' || ROSTER.some(function (k) { return k.id === n; })) return;
      var mine = state.tasks.filter(function (t) { return (t.assignee || '').toLowerCase() === n && ACTIVE.indexOf(t.status) >= 0; });
      list.push({ id: n, name: n.charAt(0).toUpperCase() + n.slice(1), role: 'Hermes profile', bound: true, tasks: mine, state: seatStateFor(mine) });
    });
    return list;
  }

  function refresh() {
    var q = state.lastEvent != null ? '?since=' + state.lastEvent : '';
    return Promise.all([
      getJSON('/api/kanban/board' + q),
      state.profiles.length ? Promise.resolve(null) : getJSON('/api/profiles').catch(function () { return { profiles: [] }; }),
    ]).then(function (res) {
      var board = res[0], prof = res[1];
      if (prof) state.profiles = Array.isArray(prof.profiles) ? prof.profiles : [];
      state.error = null;
      if (board && board.changed === false) return false;
      var tasks = [];
      (board.columns || []).forEach(function (c) { (c.tasks || []).forEach(function (t) { tasks.push(t); }); });
      state.tasks = tasks;
      state.lastEvent = board.latest_event_id;
      return true;
    }).catch(function (e) { state.error = e.message || String(e); return true; });
  }

  // ---- render ----
  function seatXY(i, n, r) { var a = -Math.PI / 2 + (2 * Math.PI * i) / n; return { x: 200 + r * Math.cos(a), y: 200 + r * Math.sin(a) }; }

  function renderTable(list) {
    var knights = list.slice(1), n = Math.max(knights.length, 3);
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 400 400'); svg.setAttribute('class', 'exrt-table'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Round Table: ' + list.map(function (s) { return s.name + ' ' + s.state; }).join(', '));
    var html = '<defs><radialGradient id="exrt-g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#142036"/><stop offset="1" stop-color="#0A1120"/></radialGradient></defs>' +
      '<circle cx="200" cy="200" r="150" fill="url(#exrt-g)" stroke="#3A5279" stroke-width="1.5"/>' +
      '<circle cx="200" cy="200" r="118" fill="none" stroke="#22324D" stroke-dasharray="2 6"/>';
    knights.forEach(function (k, i) {
      var p = seatXY(i, n, 150);
      html += '<line class="exrt-spoke" data-knight="' + esc(k.id) + '" x1="200" y1="200" x2="' + p.x.toFixed(1) + '" y2="' + p.y.toFixed(1) + '"/>';
    });
    html += '<g class="exrt-seat exrt-hub" data-knight="default" data-state="' + list[0].state + '" tabindex="0" role="button" aria-label="Arthur, Orchestrator, ' + list[0].state + '">' +
      '<circle cx="200" cy="200" r="46"/><text x="200" y="196" class="exrt-name">ARTHUR</text><text x="200" y="214" class="exrt-role">Orchestrator</text></g>';
    knights.forEach(function (k, i) {
      var p = seatXY(i, n, 150);
      html += '<g class="exrt-seat' + (k.bound ? '' : ' exrt-unbound') + '" data-knight="' + esc(k.id) + '" data-state="' + k.state + '" tabindex="0" role="button" aria-label="' + esc(k.name + ', ' + k.role + ', ' + (k.bound ? k.state : 'no Hermes profile yet')) + '">' +
        '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="30"/>' +
        '<text x="' + p.x.toFixed(1) + '" y="' + (p.y - 1).toFixed(1) + '" class="exrt-name">' + esc(k.name.toUpperCase()) + '</text>' +
        '<text x="' + p.x.toFixed(1) + '" y="' + (p.y + 13).toFixed(1) + '" class="exrt-role">' + (k.tasks.length ? k.tasks.length + ' quest' + (k.tasks.length > 1 ? 's' : '') : esc(k.state)) + '</text></g>';
    });
    svg.innerHTML = html;
    return svg;
  }

  function questCard(t) {
    var who = (t.assignee || 'default').toLowerCase();
    var knight = who === 'default' ? 'Arthur' : (ROSTER.filter(function (k) { return k.id === who; })[0] || { name: who }).name;
    return '<button type="button" class="exrt-quest" data-task="' + esc(t.id) + '" data-status="' + esc(t.status) + '">' +
      '<span class="exrt-quest-id">' + esc(t.id) + '</span>' +
      '<span class="exrt-quest-title">' + esc(t.title || 'Untitled quest') + '</span>' +
      '<span class="exrt-quest-meta"><span class="exrt-pill" data-status="' + esc(t.status) + '">' + esc(t.status) + '</span> ' + esc(knight) + '</span></button>';
  }

  function render() {
    var root = state.root; if (!root || !root.isConnected) return;
    var list = seats();
    var active = state.tasks.filter(function (t) { return ACTIVE.indexOf(t.status) >= 0; });
    var done = state.tasks.filter(function (t) { return t.status === 'done'; }).length;
    var unbound = list.filter(function (s) { return !s.bound; }).map(function (s) { return s.name; });

    root.innerHTML =
      '<div class="exrt">' +
        '<header class="exrt-head"><div><h2>The Round Table</h2><p>Live quests from Hermes Kanban · ' + active.length + ' active · ' + done + ' completed</p></div>' +
        '<div class="exrt-actions"><button type="button" class="exrt-btn exrt-btn-primary" data-act="new">Summon a quest</button>' +
        '<button type="button" class="exrt-btn" data-act="board">Open Kanban</button></div></header>' +
        (state.error ? '<div class="exrt-note exrt-note-warn" role="status">Kanban is not reachable right now (' + esc(state.error) + '). Retrying every few seconds.</div>' : '') +
        '<div class="exrt-body"><div class="exrt-table-wrap"></div>' +
        '<section class="exrt-quests" aria-label="Active quests"><h3>Active quests</h3>' +
          (active.length ? active.map(questCard).join('') :
            '<div class="exrt-empty"><p>No quests on the table.</p><p>Summon one and assign it to a knight, or leave it with Arthur to dispatch.</p></div>') +
        '</section></div>' +
        (unbound.length ? '<p class="exrt-foot">' + esc(unbound.join(', ')) + ' will take their seats once Hermes profiles with those names exist.</p>' : '') +
      '</div>';
    root.querySelector('.exrt-table-wrap').appendChild(renderTable(list));
  }

  // ---- motion: only on real state changes ----
  function animateChanges() {
    var root = state.root; if (!root) return;
    var seen = state.prev, next = {};
    state.tasks.forEach(function (t) {
      next[t.id] = t.status;
      var before = seen[t.id];
      if (before === undefined || before === t.status) return;
      var who = (t.assignee || 'default').toLowerCase();
      var seat = root.querySelector('.exrt-seat[data-knight="' + who + '"] circle');
      if (seat && window.Exnovo && window.Exnovo.pulse) window.Exnovo.pulse(seat.parentNode);
      if (t.status === 'running' && who !== 'default') {           // dispatch: Arthur -> knight
        var spoke = root.querySelector('.exrt-spoke[data-knight="' + who + '"]');
        if (spoke) { spoke.classList.remove('exrt-dispatch'); void spoke.getBoundingClientRect(); spoke.classList.add('exrt-dispatch');
          spoke.addEventListener('animationend', function done() { spoke.classList.remove('exrt-dispatch'); spoke.removeEventListener('animationend', done); }); }
      }
    });
    state.prev = next;
  }

  function onClick(e) {
    var q = e.target.closest('.exrt-quest');
    if (q) { if (typeof switchPanel === 'function') switchPanel('kanban'); if (typeof loadKanbanTask === 'function') setTimeout(function () { loadKanbanTask(q.dataset.task); }, 150); return; }
    var act = e.target.closest('[data-act]');
    if (act && act.dataset.act === 'new' && typeof openKanbanCreate === 'function') return openKanbanCreate();
    if (act && act.dataset.act === 'board' && typeof switchPanel === 'function') return switchPanel('kanban');
    var seat = e.target.closest('.exrt-seat');
    if (seat && typeof switchPanel === 'function') switchPanel('kanban');
  }

  function tick() {
    if (!state.root || !state.root.isConnected) { stop(); return; }
    refresh().then(function (changed) { if (changed) { render(); animateChanges(); } });
  }
  function stop() { if (state.timer) clearInterval(state.timer); state.timer = null; }

  // ---- mount into WebUI's plugin page area ----
  function open(ev) {
    if (ev) { ev.preventDefault(); ev.stopPropagation(); }
    if (typeof switchPluginPage !== 'function') return;
    Promise.resolve(switchPluginPage(null, '/extensions/blank.html', 'Round Table')).then(function () {
      var c = document.getElementById('pluginPageContainer'); if (!c) return;
      c.innerHTML = '';
      var root = document.createElement('div'); root.className = 'exrt-root'; c.appendChild(root);
      root.addEventListener('click', onClick);
      root.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.exrt-seat')) { e.preventDefault(); onClick(e); } });
      state.root = root; state.lastEvent = null; state.prev = {};
      document.querySelectorAll('.rail-btn.active').forEach(function (b) { b.classList.remove('active'); });
      var mine = document.querySelector('.rail-btn[data-exnovo="roundtable"]'); if (mine) mine.classList.add('active');
      root.innerHTML = '<div class="exrt"><p class="exrt-foot">Loading the Round Table…</p></div>';
      refresh().then(function () { render(); state.tasks.forEach(function (t) { state.prev[t.id] = t.status; }); });
      stop(); state.timer = setInterval(tick, POLL_MS);
    });
  }

  function addRailButton() {
    var rail = document.querySelector('nav.rail'); if (!rail || rail.querySelector('[data-exnovo="roundtable"]')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'rail-btn'; b.dataset.exnovo = 'roundtable';
    b.title = 'Round Table'; b.setAttribute('aria-label', 'Round Table');
    b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 10H5L3 8z"/><path d="M5 21h14"/></svg>';
    b.addEventListener('click', open);
    var spacer = rail.querySelector('.rail-spacer');
    rail.insertBefore(b, spacer || null);
    // Leaving for any other rail view hands the highlight back to core.
    rail.addEventListener('click', function (e) { if (!e.target.closest('[data-exnovo="roundtable"]')) b.classList.remove('active'); });
  }

  window.ExnovoRoundTable = { open: open, _state: state };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addRailButton); else addRailButton();
})();
