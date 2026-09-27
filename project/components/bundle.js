/* @ds-bundle: {"format":4,"namespace":"SewAndSo","components":[{"name":"Backdrop"},{"name":"AppBar"},{"name":"Button"},{"name":"ThemeSwitch"},{"name":"Tile"},{"name":"ProjectCard"},{"name":"StageTrack"},{"name":"Field"},{"name":"Swatches"}]} */
(function () {
  var THEMES = ['light', 'colorful', 'dark'];
  var STORE_KEY = 'sewandso-theme';
  /* icons:start */
  var ICONS = {
    "needle": "<path d=\"M3.5 20.5 15 9\"/><path d=\"M15 9l3.6-3.6a1.8 1.8 0 0 1 2.5 2.5L17.5 11.5z\"/><path d=\"M18.4 7.6l.9-.9\"/>",
    "spool": "<rect x=\"5\" y=\"3\" width=\"14\" height=\"3\" rx=\"1.5\"/><rect x=\"5\" y=\"18\" width=\"14\" height=\"3\" rx=\"1.5\"/><path d=\"M7.5 6v12M16.5 6v12M7.5 9.5h9M7.5 12h9M7.5 14.5h9\"/>",
    "scissors": "<circle cx=\"6.5\" cy=\"17.5\" r=\"2.5\"/><circle cx=\"17.5\" cy=\"17.5\" r=\"2.5\"/><path d=\"M8.3 15.7 18 4M15.7 15.7 6 4\"/>",
    "pattern": "<path d=\"M6 3h8l4 4v14H6z\"/><path d=\"M14 3v4h4\"/><path d=\"M9 12h6M9 16h6\" stroke-dasharray=\"2 2\"/>",
    "tape": "<rect x=\"2.5\" y=\"8\" width=\"19\" height=\"8\" rx=\"2\"/><path d=\"M6 8v3M9.5 8v4.5M13 8v3M16.5 8v4.5\"/>",
    "pin": "<circle cx=\"8\" cy=\"8\" r=\"3.5\"/><path d=\"M10.5 10.5 20 20\"/>",
    "button": "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><circle cx=\"10\" cy=\"10\" r=\".9\"/><circle cx=\"14\" cy=\"10\" r=\".9\"/><circle cx=\"10\" cy=\"14\" r=\".9\"/><circle cx=\"14\" cy=\"14\" r=\".9\"/>",
    "fabric": "<path d=\"M4 4h16v13l-2 2-2-2-2 2-2-2-2 2-2-2-2 2-2-2z\"/><path d=\"M4 9.5h16\" stroke-dasharray=\"2 2.5\"/>",
    "iron": "<path d=\"M3.5 18.5h17V11H11a7.5 7.5 0 0 0-7.5 7.5z\"/><path d=\"M9.5 11V8.5A1.5 1.5 0 0 1 11 7h9.5v4\"/>",
    "hanger": "<path d=\"M10 6a2 2 0 1 1 2 2v2l-8.6 6.4c-.8.6-.4 1.6.5 1.6h16.2c.9 0 1.3-1 .5-1.6L12 10\"/>",
    "camera": "<rect x=\"3\" y=\"7\" width=\"18\" height=\"13\" rx=\"2.5\"/><path d=\"M8.5 7 10 4h4l1.5 3\"/><circle cx=\"12\" cy=\"13.5\" r=\"3.5\"/>",
    "home": "<path d=\"M4 11 12 4l8 7\"/><path d=\"M6 9.5V20h12V9.5\"/>",
    "plus": "<path d=\"M12 5v14M5 12h14\"/>",
    "check": "<path d=\"M5 12.5l4.5 4.5L19 7.5\"/>",
    "close": "<path d=\"M6 6l12 12M18 6 6 18\"/>",
    "arrow-right": "<path d=\"M5 12h14M13 6l6 6-6 6\"/>",
    "arrow-left": "<path d=\"M19 12H5M11 6l-6 6 6 6\"/>",
    "alert": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7.5V13\"/><path d=\"M12 16.5v.01\" stroke-width=\"2.5\"/>"
  };
/* icons:end */

  function icon(name, opts) {
    opts = opts || {};
    if (!ICONS[name]) throw new Error('SewAndSo: no icon named ' + name);
    var cls = 'sas-icon' + (opts.large ? ' sas-icon--lg' : '');
    var a11y = opts.label ? ' role="img" aria-label="' + opts.label.replace(/"/g, '&quot;') + '"' : ' aria-hidden="true"';
    return '<svg class="' + cls + '" viewBox="0 0 24 24"' + a11y + '>' + ICONS[name] + '</svg>';
  }

  function getTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    return THEMES.indexOf(t) >= 0 ? t : THEMES[0];
  }

  function syncSwitches() {
    var current = getTheme();
    var options = document.querySelectorAll('[data-sas-theme]');
    for (var i = 0; i < options.length; i++) {
      var on = options[i].getAttribute('data-sas-theme') === current;
      options[i].setAttribute('aria-checked', String(on));
      options[i].tabIndex = on ? 0 : -1;
    }
  }

  function setTheme(id, opts) {
    opts = opts || {};
    if (THEMES.indexOf(id) < 0) throw new Error('SewAndSo: unknown theme ' + id);
    var root = document.documentElement;
    var apply = function () { root.setAttribute('data-theme', id); syncSwitches(); };
    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (id !== getTheme() && !calm && document.startViewTransition) document.startViewTransition(apply);
    else apply();
    if (opts.remember !== false) { try { localStorage.setItem(STORE_KEY, id); } catch (e) {} }
  }

  function restoreTheme() {
    var saved = null;
    try { saved = localStorage.getItem(STORE_KEY); } catch (e) {}
    if (THEMES.indexOf(saved) >= 0) setTheme(saved, { remember: false });
    else syncSwitches();
  }

  function setBackdrops(map) {
    var style = document.documentElement.style;
    THEMES.forEach(function (t) {
      if (map[t]) style.setProperty('--sas-backdrop-' + t, 'url("' + String(map[t]).replace(/"/g, '%22') + '")');
    });
  }

  function selectRadio(group, radio) {
    var radios = group.querySelectorAll('[role="radio"]');
    for (var i = 0; i < radios.length; i++) {
      var on = radios[i] === radio;
      radios[i].setAttribute('aria-checked', String(on));
      radios[i].tabIndex = on ? 0 : -1;
    }
    group.dispatchEvent(new CustomEvent('sas-change', { bubbles: true, detail: { value: radio.getAttribute('data-value') } }));
  }

  function hydrate(scope) {
    scope = scope || document;
    var slots = scope.querySelectorAll('svg[data-sas-icon]');
    for (var i = 0; i < slots.length; i++) {
      var svg = slots[i];
      var name = svg.getAttribute('data-sas-icon');
      if (!ICONS[name]) continue;
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.classList.add('sas-icon');
      if (!svg.hasAttribute('aria-label')) svg.setAttribute('aria-hidden', 'true');
      svg.innerHTML = ICONS[name];
    }
    var groups = scope.querySelectorAll('[role="radiogroup"]');
    for (var g = 0; g < groups.length; g++) {
      var radios = groups[g].querySelectorAll('[role="radio"]');
      var anyOn = false;
      for (var r = 0; r < radios.length; r++) {
        var on = radios[r].getAttribute('aria-checked') === 'true';
        anyOn = anyOn || on;
        radios[r].tabIndex = on ? 0 : -1;
      }
      if (!anyOn && radios.length) radios[0].tabIndex = 0;
    }
    syncSwitches();
  }

  document.addEventListener('click', function (e) {
    var themeOption = e.target.closest && e.target.closest('[data-sas-theme]');
    if (themeOption) { setTheme(themeOption.getAttribute('data-sas-theme')); return; }
    var radio = e.target.closest && e.target.closest('[role="radio"]');
    var group = radio && radio.closest('[role="radiogroup"]');
    if (group) selectRadio(group, radio);
  });

  document.addEventListener('keydown', function (e) {
    var radio = e.target.closest && e.target.closest('[role="radio"]');
    var group = radio && radio.closest('[role="radiogroup"]');
    if (!group) return;
    var step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    var radios = Array.prototype.slice.call(group.querySelectorAll('[role="radio"]'));
    var next = radios[(radios.indexOf(radio) + step + radios.length) % radios.length];
    next.focus();
    next.click();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { hydrate(document); });
  else hydrate(document);

  window.SewAndSo = {
    themes: THEMES.slice(),
    icons: Object.keys(ICONS),
    icon: icon,
    getTheme: getTheme,
    setTheme: setTheme,
    restoreTheme: restoreTheme,
    setBackdrops: setBackdrops,
    hydrate: hydrate,
  };
})();
