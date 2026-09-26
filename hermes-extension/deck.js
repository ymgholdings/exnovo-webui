/* Exnovo Command Deck — the Dashboard Overview mockup, live inside Hermes WebUI.
 * Data: Hermes Kanban (quests, events), Hermes profiles (knights), WebUI agent health (system status).
 * Read-only; clicking a quest opens WebUI's native Kanban task. */
(function () {
  'use strict';
  if (window.ExnovoDeck) return;

  var POLL_MS = 6000;
  var ACTIVE = ['triage', 'todo', 'scheduled', 'ready', 'running', 'blocked', 'review'];
  var KNIGHT_NAMES = { 'default': 'Arthur', lancelot: 'Lancelot', tristan: 'Tristan', galahad: 'Galahad' };
  var state = { root: null, timer: null, tasks: [], profiles: [], events: [], health: null, lastEvent: null, error: null };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function get(url) {
    return fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } }).then(function (r) {
      if (!r.ok) throw new Error(r.status + ' ' + r.statusText); return r.json();
    });
  }
  function knight(a) { a = (a || 'default').toLowerCase(); return KNIGHT_NAMES[a] || (a.charAt(0).toUpperCase() + a.slice(1)); }
  function ago(ts) {
    if (!ts) return '';
    var s = Math.max(0, Math.floor(Date.now() / 1000 - (ts > 1e12 ? ts / 1000 : ts)));
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' h ago';
    return Math.floor(s / 86400) + ' d ago';
  }

  // ---- data ----
  function refresh() {
    return Promise.all([
      get('/api/kanban/board').catch(function (e) { return { error: e.message }; }),
      state.profiles.length ? Promise.resolve(null) : get('/api/profiles').catch(function () { return { profiles: [] }; }),
      get('/api/health/agent').catch(function () { return { alive: false }; }),
    ]).then(function (res) {
      var board = res[0];
      if (res[1]) state.profiles = Array.isArray(res[1].profiles) ? res[1].profiles : [];
      state.health = res[2];
      if (board.error) { state.error = board.error; return; }
      state.error = null;
      var tasks = [];
      (board.columns || []).forEach(function (c) { (c.tasks || []).forEach(function (t) { tasks.push(t); }); });
      state.tasks = tasks;
      var latest = board.latest_event_id || 0;
      if (latest !== state.lastEvent) {
        state.lastEvent = latest;
        return get('/api/kanban/events?since=' + Math.max(0, latest - 25) + '&limit=25')
          .then(function (d) { state.events = (d.events || []).slice().reverse(); })
          .catch(function () {});
      }
    });
  }

  // ---- render pieces ----
  function card(tone, label, value, delta, extraClass) {
    return '<div class="exd-card exd-' + tone + (extraClass ? ' ' + extraClass : '') + '"><div class="exd-card-edge"><div class="exd-card-body">' +
      '<span class="exd-card-mark" aria-hidden="true"></span>' +
      '<div class="exd-card-label">' + esc(label) + '</div><div class="exd-card-value">' + esc(value) + '</div>' +
      '<div class="exd-card-delta">' + esc(delta) + '</div></div></div></div>';
  }

  function stats() {
    var active = state.tasks.filter(function (t) { return ACTIVE.indexOf(t.status) >= 0; });
    var blocked = active.filter(function (t) { return t.status === 'blocked'; }).length;
    var review = active.filter(function (t) { return t.status === 'review'; }).length;
    var done = state.tasks.filter(function (t) { return t.status === 'done'; }).length;
    var rate = (done + blocked) ? Math.round(100 * done / (done + blocked)) : null;
    var names = state.profiles.map(function (p) { return knight(p.name || p.id || p); });
    var h = state.health || {};
    var ok = h.alive === true && !state.error;
    var gw = h.details && h.details.gateway_state;
    return '<section class="exd-stats" aria-label="Summary">' +
      card('arcane', 'Active Quests', active.length, blocked + ' blocked · ' + review + ' in review') +
      card('regal', 'Total Knights', names.length || 1, (names.length ? names : ['Arthur']).join(' · ')) +
      card('regal', 'Quests Completed', done, rate === null ? 'no finished quests yet' : rate + '% success') +
      card('aether', 'System Status', ok ? 'OPTIMAL' : 'DEGRADED',
        ok ? 'Hermes alive · gateway ' + (gw || 'up') : (state.error ? 'Kanban unreachable' : 'Hermes not responding'), ok ? '' : 'exd-alert') +
      '</section>';
  }

  // 2.5D network: Arthur's hub table with active quest tables around it.
  function network() {
    var quests = state.tasks.filter(function (t) { return ACTIVE.indexOf(t.status) >= 0; }).slice(0, 6);
    var W = 900, H = 560, cx = 450, cy = 280;
    var slots = [[180, 120], [450, 70], [720, 120], [175, 420], [450, 480], [725, 420]];
    var svg = '<svg class="exd-net" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Quest network: ' + quests.length + ' active quests around Arthur">' +
      '<defs><radialGradient id="exdTable" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#1B3150"/><stop offset="1" stop-color="#0B1322"/></radialGradient>' +
      
      '<filter id="exdGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
    [170, 250, 330].forEach(function (rr) {
      svg += '<ellipse class="exd-radar" cx="' + cx + '" cy="' + cy + '" rx="' + rr + '" ry="' + (rr * 0.5).toFixed(0) + '"/>';
    });
    quests.forEach(function (q, i) {
      var p = slots[i], mx = (p[0] + cx) / 2, my = (p[1] + cy) / 2 + (p[1] < cy ? -30 : 30);
      svg += '<path class="exd-link' + (q.status === 'running' ? ' exd-link-live' : '') + '" d="M' + cx + ',' + cy + ' Q' + mx + ',' + my + ' ' + p[0] + ',' + p[1] + '"/>';
    });
    svg += table(cx, cy, 120, 'ORCHESTRATOR', 'ARTHUR', 'hub', null, 8);
    quests.forEach(function (q, i) {
      var p = slots[i], title = (q.title || 'Quest').toUpperCase();
      if (title.length > 22) title = title.slice(0, 21) + '…';
      svg += table(p[0], p[1], 88, 'QUEST:', title, q.status, q.id, 4, knight(q.assignee));
    });
    svg += '</svg>';
    return '<section class="exd-panel exd-net-panel" aria-label="Quest network"><header><h2>Quest Network Overview</h2>' +
      '<span>' + (quests.length ? quests.length + ' active quest' + (quests.length > 1 ? 's' : '') : 'no active quests') + ' · click a table to open it</span></header>' + svg +
      (quests.length ? '' : '<p class="exd-empty">No quests on the table. <button type="button" class="exrt-btn exrt-btn-primary" data-act="new">Summon a quest</button></p>') +
      '</section>';
  }

  function table(x, y, r, kicker, name, status, id, seats, who) {
    var ry = r * 0.42, g = '<g class="exd-table exd-' + esc(status) + '"' + (id ? ' data-task="' + esc(id) + '" tabindex="0" role="button" aria-label="' + esc(kicker + ' ' + name + ', ' + status + (who ? ', ' + who : '')) + '"' : '') + '>';
    g += '<ellipse class="exd-halo" cx="' + x + '" cy="' + (y + 10) + '" rx="' + (r + 18) + '" ry="' + (ry + 10) + '"/>';
    g += '<ellipse class="exd-top" cx="' + x + '" cy="' + y + '" rx="' + r + '" ry="' + ry + '" fill="url(#exdTable)" filter="url(#exdGlow)"/>';
    g += '<ellipse class="exd-ring" cx="' + x + '" cy="' + y + '" rx="' + (r * 0.72) + '" ry="' + (ry * 0.72) + '"/>';
    for (var i = 0; i < seats; i++) {
      var a = Math.PI * 2 * i / seats - Math.PI / 2, sx = x + (r + 10) * Math.cos(a), sy = y + (ry + 8) * Math.sin(a);
      g += '<g class="exd-seat" transform="translate(' + sx.toFixed(1) + ',' + sy.toFixed(1) + ')"><circle r="5.5"/><path d="M-6,13 Q0,4 6,13"/></g>';
    }
    g += '<text x="' + x + '" y="' + (y - 3) + '" class="exd-kicker">' + esc(kicker) + '</text>';
    g += '<text x="' + x + '" y="' + (y + 13) + '" class="exd-name">' + esc(name) + '</text>';
    if (who) g += '<text x="' + x + '" y="' + (y + ry + 34) + '" class="exd-who">' + esc(who) + ' · ' + esc(status) + '</text>';
    return g + '</g>';
  }

  var EVENT_WORDS = { created: 'initialized', claimed: 'claimed', completed: 'completed', blocked: 'blocked', unblocked: 'resumed',
    status_changed: 'status changed', commented: 'comment added', assigned: 'assigned', archived: 'archived', run_started: 'run started', run_finished: 'run finished' };

  function feed() {
    var titles = {}; state.tasks.forEach(function (t) { titles[t.id] = t.title; });
    var items = state.events.slice(0, 12).map(function (ev) {
      var word = EVENT_WORDS[ev.kind] || String(ev.kind || 'update').replace(/_/g, ' ');
      var to = ev.payload && (ev.payload.to || ev.payload.status || ev.payload.new_status);
      var tone = /block|fail/.test(ev.kind + to) ? 'critical' : /complete|done/.test(ev.kind + to) ? 'ok' : /review|mediat/.test(ev.kind + to) ? 'warn' : 'info';
      return '<li class="exd-ev exd-ev-' + tone + '"><span class="exd-dot" aria-hidden="true"></span><div>' +
        '<div class="exd-ev-title">Quest “' + esc(titles[ev.task_id] || ev.task_id) + '” ' + esc(word) + (to ? ' → ' + esc(to) : '') + '</div>' +
        '<div class="exd-ev-meta">' + esc(ago(ev.created_at)) + '</div></div></li>';
    });
    return '<aside class="exd-panel exd-feed" aria-label="Recent activity"><header><h2>Recent Activity Feed</h2></header>' +
      (items.length ? '<ol>' + items.join('') + '</ol>' : '<p class="exd-empty">Activity appears here as knights take and finish quests.</p>') + '</aside>';
  }

  function render() {
    var root = state.root; if (!root || !root.isConnected) return;
    root.innerHTML = '<div class="exd">' + stats() + '<div class="exd-main">' + network() + feed() + '</div></div>';
    // One-shot halo pulse on tables whose quest changed state since the last render.
    var prev = state.prevStatus || {}, next = {};
    state.tasks.forEach(function (t) {
      next[t.id] = t.status;
      if (state.prevStatus && prev[t.id] !== t.status) {
        var g = root.querySelector('.exd-table[data-task="' + String(t.id).replace(/"/g, '') + '"]');
        if (g) g.classList.add('exd-changed');
      }
    });
    state.prevStatus = next;
  }

  // ---- interaction ----
  function onClick(e) {
    var t = e.target.closest('[data-task]');
    if (t) { if (typeof switchPanel === 'function') switchPanel('kanban'); if (typeof loadKanbanTask === 'function') setTimeout(function () { loadKanbanTask(t.dataset.task); }, 150); return; }
    var act = e.target.closest('[data-act]');
    if (act && act.dataset.act === 'new' && typeof openKanbanCreate === 'function') openKanbanCreate();
  }
  function tick() {
    if (!state.root || !state.root.isConnected) { clearInterval(state.timer); state.timer = null; return; }
    if (document.hidden) return;
    refresh().then(render);
  }

  function open(ev) {
    if (ev) { ev.preventDefault(); ev.stopPropagation(); }
    if (!window.Exnovo || !window.Exnovo.mountPage) return;
    window.Exnovo.mountPage('deck', 'Command Deck').then(function (root) {
      if (!root) return;
      state.root = root; state.lastEvent = null;
      root.addEventListener('click', onClick);
      root.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('[data-task]')) { e.preventDefault(); onClick(e); } });
      root.innerHTML = '<div class="exd"><p class="exrt-foot">Assembling the Command Deck…</p></div>';
      refresh().then(render);
      if (state.timer) clearInterval(state.timer);
      state.timer = setInterval(tick, POLL_MS);
    });
  }

  window.ExnovoDeck = { open: open, _state: state };
  function boot() {
    if (window.Exnovo && window.Exnovo.addRailButton) {
      window.Exnovo.addRailButton('deck', 'Command Deck',
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="8"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="15" width="7" height="6"/></svg>', open);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
