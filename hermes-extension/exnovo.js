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

  function boot() {
    if (!register()) {                     // core may load after us: retry briefly
      var n = 0, t = setInterval(function () { if (register() || ++n > 40) clearInterval(t); }, 100);
    }
    addMark();
    // The title text is re-rendered on view changes; keep the mark attached.
    var bar = document.querySelector('.app-titlebar');
    if (bar && 'MutationObserver' in window) new MutationObserver(addMark).observe(bar, { childList: true, subtree: true });
  }

  window.Exnovo = window.Exnovo || {};
  window.Exnovo.version = '0.1.0';
  /** One-shot pulse for state changes (respects reduced motion via CSS). */
  window.Exnovo.pulse = function (el) {
    if (!el) return; el.classList.remove('ex-pulse'); void el.offsetWidth; el.classList.add('ex-pulse');
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
