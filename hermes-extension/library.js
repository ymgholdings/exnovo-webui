/* Exnovo Module Library — search and install Hermes skills from inside WebUI.
 * v1 source: the Hermes skills hub, via the exnovo sidecar (consented proxy, token-v1).
 * Installs go through Hermes' own pipeline, including its security scan; nothing here can bypass it.
 * WebUI extensions and MCP tools already have native screens; the Library links to them. */
(function () {
  'use strict';
  if (window.ExnovoLibrary) return;

  var BASE = '/api/extensions/exnovo/sidecar';
  var state = { root: null, q: '', results: [], installed: {}, loading: false, error: null, jobs: {}, preview: null, sidecar: 'unknown' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function call(path, opts) {
    opts = opts || {};
    return fetch(BASE + path, {
      method: opts.method || 'GET', credentials: 'same-origin',
      headers: Object.assign({ Accept: 'application/json' }, opts.body ? { 'Content-Type': 'application/json' } : {}),
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) { var e = new Error((data && data.error) || (r.status + ' ' + r.statusText)); e.status = r.status; throw e; }
        return data;
      });
    });
  }

  var TRUST = {
    builtin: { label: 'Built-in', note: 'Ships with Hermes' },
    trusted: { label: 'Trusted', note: 'From a trusted publisher' },
    community: { label: 'Community', note: 'Community skill: Hermes scans it before install' },
  };

  function isInstalled(r) {
    return Object.keys(state.installed).some(function (k) { return k === r.identifier || state.installed[k].name === r.name; });
  }

  // ---- render ----
  function card(r) {
    var t = TRUST[r.trust] || { label: r.trust || 'unknown', note: '' };
    var job = state.jobs[r.identifier];
    var btn;
    if (isInstalled(r)) btn = '<span class="exlib-state exlib-ok">Installed</span>';
    else if (job && job.status === 'running') btn = '<span class="exlib-state">Installing…</span>';
    else if (r.trust === 'community') btn = '<button type="button" class="exrt-btn exrt-btn-primary" data-review="' + esc(r.identifier) + '">Review &amp; install</button>';
    else btn = '<button type="button" class="exrt-btn exrt-btn-primary" data-install="' + esc(r.identifier) + '">Install</button>';
    return '<article class="exlib-card">' +
      '<header><h4>' + esc(r.name) + '</h4><span class="exlib-trust" data-trust="' + esc(r.trust) + '" title="' + esc(t.note) + '">' + esc(t.label) + '</span></header>' +
      '<p>' + esc(r.description || 'No description.') + '</p>' +
      '<footer><span class="exlib-src">' + esc(r.provider || r.source) + ' · ' + esc(r.identifier) + '</span>' +
      '<span class="exlib-actions"><button type="button" class="exrt-btn" data-preview="' + esc(r.identifier) + '">Preview</button>' + btn + '</span></footer>' +
      (job && job.status === 'failed' ? '<div class="exlib-fail" role="alert"><b>Not installed.</b> ' + esc(summarise(job.output)) + '</div>' : '') +
      '</article>';
  }

  function summarise(out) {
    var lines = String(out || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    var hit = lines.filter(function (l) { return /block|refus|risk|not installed|fail|error|denied/i.test(l); });
    return (hit.length ? hit.slice(-2) : lines.slice(-2)).join(' ') || 'Hermes did not install it.';
  }

  function render() {
    var root = state.root; if (!root || !root.isConnected) return;
    var body;
    if (state.sidecar === 'unavailable') {
      body = '<div class="exrt-note exrt-note-warn" role="status"><b>Module Library needs a one-time approval.</b> ' +
        'Open <b>Settings → Extensions</b>, find <b>Exnovo</b>, and allow its sidecar proxy.</div>';
    } else if (state.loading) {
      body = '<p class="exrt-foot" aria-live="polite">Searching the Hermes skills hub…</p>';
    } else if (state.error) {
      body = '<div class="exrt-note exrt-note-warn" role="status">' + esc(state.error) + '</div>';
    } else if (!state.q) {
      body = '<div class="exrt-empty"><p>Search for a capability: “seo”, “youtube”, “substack”, “music”, “pdf”…</p>' +
        '<p>Skills teach your knights new work. Every install is scanned by Hermes before it lands.</p></div>';
    } else if (!state.results.length) {
      body = '<div class="exrt-empty"><p>No skills matched “' + esc(state.q) + '”.</p></div>';
    } else {
      body = '<div class="exlib-grid">' + state.results.map(card).join('') + '</div>';
    }
    var installedCount = Object.keys(state.installed).length;
    root.innerHTML =
      '<div class="exrt exlib">' +
        '<header class="exrt-head"><div><h2>Module Library</h2><p>Hermes skills hub · ' + installedCount + ' installed from the hub</p></div>' +
        '<div class="exrt-actions"><button type="button" class="exrt-btn" data-act="skills">Installed skills</button>' +
        '<button type="button" class="exrt-btn" data-act="extensions">WebUI extensions</button>' +
        '<button type="button" class="exrt-btn" data-act="mcp">MCP tools</button></div></header>' +
        '<form class="exlib-search" role="search"><label for="exlibQ" class="sr-only">Search skills</label>' +
        '<input id="exlibQ" type="search" autocomplete="off" placeholder="Search skills…" value="' + esc(state.q) + '">' +
        '<button type="submit" class="exrt-btn exrt-btn-primary">Search</button></form>' +
        body +
        (state.preview ? previewPanel() : '') +
      '</div>';
    if (state.preview) { var close = root.querySelector('[data-close]'); if (close) close.focus(); }
  }

  function previewPanel() {
    var p = state.preview;
    return '<div class="exlib-preview" role="dialog" aria-modal="true" aria-label="Skill preview"><div class="exlib-preview-inner">' +
      '<header><h3>' + esc(p.name || p.identifier) + '</h3><button type="button" class="exrt-btn" data-close="1">Close</button></header>' +
      '<p class="exlib-src">' + esc(p.identifier || '') + '</p>' +
      (p.review ? '<div class="exrt-note exrt-note-warn">Community skill. Read what it does below. Hermes will also run its security scan and refuse high-risk skills.</div>' : '') +
      (p.loading ? '<p>Loading…</p>' : p.error ? '<p class="exlib-fail">' + esc(p.error) + '</p>' :
        '<pre class="exlib-md">' + esc(p.skill_md_preview || p.description || 'No SKILL.md preview available.') + '</pre>') +
      (p.review && !p.loading && !p.error ? '<div class="exlib-actions"><button type="button" class="exrt-btn exrt-btn-primary" data-install="' + esc(p.identifier) + '" data-close-after="1">I have reviewed it: install</button></div>' : '') +
      '</div></div>';
  }

  // ---- actions ----
  function checkSidecar() {
    return call('/skills/installed').then(function (d) { state.installed = d.installed || {}; state.sidecar = 'ok'; state.error = null; })
      .catch(function (e) { state.sidecar = (e.status === 403 || e.status === 404 || e.status === 502 || e.status === 503) ? 'unavailable' : 'ok'; state.error = e.message; });
  }

  function doSearch(q) {
    state.q = q; state.loading = true; state.error = null; render();
    return call('/skills/search?q=' + encodeURIComponent(q) + '&limit=30').then(function (d) {
      state.results = d.results || []; state.installed = d.installed || state.installed;
      if (d.timed_out && d.timed_out.length) state.error = null;
    }).catch(function (e) { state.results = []; state.error = 'Search failed: ' + e.message; })
      .then(function () { state.loading = false; render(); var i = document.getElementById('exlibQ'); if (i) i.focus(); });
  }

  function install(ident) {
    state.jobs[ident] = { status: 'running' }; render();
    call('/skills/install', { method: 'POST', body: { identifier: ident } }).then(function (job) {
      var tries = 0;
      (function poll() {
        call('/jobs/' + job.id).then(function (j) {
          if (j.status === 'running' && ++tries < 150) return setTimeout(poll, 2000);
          state.jobs[ident] = j;
          return checkSidecar().then(render);
        }).catch(function (e) { state.jobs[ident] = { status: 'failed', output: e.message }; render(); });
      })();
    }).catch(function (e) { state.jobs[ident] = { status: 'failed', output: e.message }; render(); });
  }

  function openPreview(ident, review) {
    state.preview = { identifier: ident, loading: true, review: !!review }; render();
    call('/skills/preview?identifier=' + encodeURIComponent(ident)).then(function (d) { state.preview = Object.assign({ identifier: ident }, d, { review: !!review }); })
      .catch(function (e) { state.preview = { identifier: ident, error: e.message }; }).then(render);
  }

  function onClick(e) {
    var t = e.target;
    var inst = t.closest('[data-install]');
    if (inst) { if (inst.dataset.closeAfter) state.preview = null; return install(inst.dataset.install); }
    var rv = t.closest('[data-review]'); if (rv) return openPreview(rv.dataset.review, true);
    var pv = t.closest('[data-preview]'); if (pv) return openPreview(pv.dataset.preview, false);
    if (t.closest('[data-close]') || t.classList.contains('exlib-preview')) {
      var back = state.preview && state.preview.identifier; state.preview = null; render();
      var again = back && state.root.querySelector('[data-preview="' + back.replace(/"/g, '') + '"]'); if (again) again.focus();
      return;
    }
    var act = t.closest('[data-act]'); if (!act) return;
    if (act.dataset.act === 'skills' && typeof switchPanel === 'function') return switchPanel('skills');
    if (typeof switchPanel === 'function') {
      switchPanel('settings');
      var tab = act.dataset.act === 'extensions' ? 'extensions' : 'mcp';
      setTimeout(function () {
        var item = document.querySelector('.side-menu-item[data-section="' + tab + '"], .side-menu-item[data-pane="' + tab + '"], [data-settings-section="' + tab + '"]');
        if (item) item.click();
      }, 200);
    }
  }

  function open(ev) {
    if (ev) { ev.preventDefault(); ev.stopPropagation(); }
    if (!window.Exnovo || !window.Exnovo.mountPage) return;
    window.Exnovo.mountPage('library', 'Module Library').then(function (root) {
      if (!root) return;
      state.root = root; state.preview = null;
      root.addEventListener('click', onClick);
      root.addEventListener('submit', function (e) { e.preventDefault(); var i = document.getElementById('exlibQ'); if (i && i.value.trim()) doSearch(i.value.trim()); });
      if (!state.escBound) {
        state.escBound = true;
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape' && state.preview && state.root && state.root.isConnected) { state.preview = null; render(); }
        });
      }
      render();
      checkSidecar().then(render);
    });
  }

  window.ExnovoLibrary = { open: open, _state: state };
  function boot() {
    if (window.Exnovo && window.Exnovo.addRailButton) {
      window.Exnovo.addRailButton('library', 'Module Library',
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6v4a2 2 0 1 0 0 4v2h4v6h-6v-2a2 2 0 1 0-4 0v2H3v-6h2a2 2 0 1 0 0-4H3V3h6z"/></svg>', open);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
