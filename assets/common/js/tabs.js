/**
 * 分段 Tabs：[data-wa-tabs] + [data-wa-tab] / [data-wa-tab-panel]
 *
 *   WA_TABS.bind()
 */
(function () {
  "use strict";

  function bindRoot(root) {
    if (!root || root.getAttribute("data-wa-tabs-bound") === "1") return;
    var tabs = Array.prototype.slice.call(root.querySelectorAll("[data-wa-tab]"));
    var panels = Array.prototype.slice.call(root.querySelectorAll("[data-wa-tab-panel]"));
    if (!tabs.length) return;
    root.setAttribute("data-wa-tabs-bound", "1");

    function activate(key, focusTab) {
      tabs.forEach(function (tab) {
        var on = tab.getAttribute("data-wa-tab") === key;
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
        if (on && focusTab) tab.focus();
      });
      panels.forEach(function (panel) {
        var on = panel.getAttribute("data-wa-tab-panel") === key;
        panel.classList.toggle("is-active", on);
        if (on) panel.removeAttribute("hidden");
        else panel.setAttribute("hidden", "");
      });
    }

    root.addEventListener("click", function (e) {
      var tab = e.target.closest("[data-wa-tab]");
      if (!tab || !root.contains(tab)) return;
      activate(tab.getAttribute("data-wa-tab"), false);
    });

    root.addEventListener("keydown", function (e) {
      var tab = e.target.closest("[data-wa-tab]");
      if (!tab || !root.contains(tab)) return;
      var i = tabs.indexOf(tab);
      if (i < 0) return;
      var next = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = tabs.length - 1;
      if (next < 0) return;
      e.preventDefault();
      activate(tabs[next].getAttribute("data-wa-tab"), true);
    });
  }

  function bind(root) {
    var scope = root && root.querySelectorAll ? root : document;
    if (scope.matches && scope.matches("[data-wa-tabs]")) bindRoot(scope);
    scope.querySelectorAll("[data-wa-tabs]").forEach(bindRoot);
  }

  window.WA_TABS = { bind: bind };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      bind();
    });
  } else {
    bind();
  }
})();
