/* Exnovo Agentic OS — Hermes WebUI extension (skin registration + small shell touches).
 * Safe to remove: uninstalling the extension or picking another skin restores stock WebUI. */
(function () {
  'use strict';
  var SKIN = {
    name: 'Exnovo', value: 'exnovo', label: 'Exnovo', scheme: 'dark',
    colors: ['#E0B062', '#5AB4EE', '#0A1120'],
    tokens: {
      '--bg': '#0A1120', '--sidebar': '#0F1829', '--surface': '#0F1829', '--surface2': '#142036',
      '--text': '#E8EEF7', '--text2': '#AEBBD0', '--muted': '#8392AB',
      '--accent': '#E0B062', '--accent-hover': '#F3CE8C', '--accent-text': '#F3CE8C',
      '--accent-bg': 'rgba(224,176,98,0.10)', '--accent-bg-strong': 'rgba(224,176,98,0.18)', '--accent-rgb': '224, 176, 98',
      '--border': '#22324D', '--border2': '#3A5279', '--hover-bg': 'rgba(90,180,238,0.08)',
      '--code-bg': '#0B1322', '--code-text': '#9AD4FA', '--link': '#9AD4FA',
      '--success': '#54E1D6', '--warning': '#F28C38', '--danger': '#F2687A', '--info': '#5AB4EE'
    }
  };

  function register() {
    if (typeof window.registerHermesSkin !== 'function') return false;
    return window.registerHermesSkin(SKIN);
  }

  function addMark() {
    var title = document.querySelector('.app-titlebar-title');
    if (!title || title.querySelector('.ex-mark')) return;
    var mark = document.createElement('span');
    mark.className = 'ex-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = 'EXNOVO';
    title.insertBefore(mark, title.firstChild);
  }

  var PANELS = ['deck', 'roundtable', 'library'];
  function loadPanels() {
    PANELS.forEach(function (name) {
      if (document.querySelector('script[data-exnovo="' + name + '"]')) return;
      var s = document.createElement('script');
      s.src = '/extensions/' + name + '.js?v=' + window.Exnovo.version; s.defer = true; s.dataset.exnovo = name;
      document.body.appendChild(s);
    });
  }

  /** Add a rail button for an Exnovo page. Leaving for any other rail view hands the highlight back to core. */
  function addRailButton(id, label, svg, onOpen) {
    var rail = document.querySelector('nav.rail'); if (!rail || rail.querySelector('[data-exnovo="' + id + '"]')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'rail-btn'; b.dataset.exnovo = id; b.title = label; b.setAttribute('aria-label', label);
    b.innerHTML = svg;
    b.addEventListener('click', onOpen);
    // Stable order regardless of which panel script loads first.
    var order = PANELS.indexOf(id); b.dataset.exOrder = String(order);
    var after = [].slice.call(rail.querySelectorAll('.rail-btn[data-ex-order]')).filter(function (x) { return +x.dataset.exOrder > order; })[0];
    rail.insertBefore(b, after || rail.querySelector('.rail-spacer') || null);
    rail.addEventListener('click', function (e) {
      if (e.target.closest('[data-exnovo="' + id + '"]')) return;
      b.classList.remove('active');
      if (!e.target.closest('[data-exnovo]')) document.body.classList.remove('ex-page-open');
    });
  }

  /** Show WebUI's plugin page area and give the caller an empty root element to render into. */
  function mountPage(id, label) {
    if (typeof window.switchPluginPage !== 'function') return Promise.resolve(null);
    return Promise.resolve(window.switchPluginPage(null, '/extensions/blank.html#' + id, label)).then(function () {
      var c = document.getElementById('pluginPageContainer'); if (!c) return null;
      c.innerHTML = '';
      var root = document.createElement('div'); root.className = 'exrt-root'; root.dataset.page = id; c.appendChild(root);
      document.body.classList.add('ex-page-open');
      document.querySelectorAll('.rail-btn.active').forEach(function (x) { x.classList.remove('active'); });
      var mine = document.querySelector('.rail-btn[data-exnovo="' + id + '"]'); if (mine) mine.classList.add('active');
      return root;
    });
  }

  // Leaving an Exnovo page by any route (rail, programmatic switchPanel, links) restores the core sidebar.
  function watchMainView() {
    var main = document.querySelector('main.main'); if (!main || !('MutationObserver' in window)) return;
    new MutationObserver(function () {
      if (!main.classList.contains('showing-plugin')) {
        document.body.classList.remove('ex-page-open');
        document.querySelectorAll('.rail-btn[data-exnovo].active').forEach(function (x) { x.classList.remove('active'); });
      }
    }).observe(main, { attributes: true, attributeFilter: ['class'] });
  }

  function boot() {
    loadPanels();
    watchMainView();
    if (!register()) {                     // core may load after us: retry briefly
      var n = 0, t = setInterval(function () { if (register() || ++n > 40) clearInterval(t); }, 100);
    }
    addMark();
    // The title text is re-rendered on view changes; keep the mark attached.
    var bar = document.querySelector('.app-titlebar');
    if (bar && 'MutationObserver' in window) new MutationObserver(addMark).observe(bar, { childList: true, subtree: true });
  }

  window.Exnovo = window.Exnovo || {};
  window.Exnovo.version = '0.4.0';
  window.Exnovo.addRailButton = addRailButton;
  window.Exnovo.mountPage = mountPage;
  /** One-shot pulse for state changes (respects reduced motion via CSS). */
  window.Exnovo.pulse = function (el) {
    if (!el) return; el.classList.remove('ex-pulse'); void el.offsetWidth; el.classList.add('ex-pulse');
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
