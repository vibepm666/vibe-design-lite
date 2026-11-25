/**
 * 页面加载进度条（spin-page）
 *
 *   WA_PAGE_LOADING.start()
 *   WA_PAGE_LOADING.bind(scope)  — 壳内跳转时打标；落地页再 start（不拦截导航）
 *   WA_PAGE_LOADING.startIfPending() — 若由壳内跳转入页则播放
 *
 * 样式：assets/common/css/components.css → .wa-page-loading
 */
(function () {
  "use strict";

  var FLAG = "wa-page-loading";
  var phase = "idle";
  var pct = 0;
  var t1 = null;
  var t2 = null;
  var t3 = null;
  var navBound = false;

  function barEl() {
    var el = document.querySelector(".wa-page-loading");
    if (el) return el;
    el = document.createElement("div");
    el.className = "wa-page-loading";
    el.setAttribute("role", "progressbar");
    el.setAttribute("aria-valuemin", "0");
    el.setAttribute("aria-valuemax", "100");
    el.setAttribute("aria-label", "页面加载");
    document.body.appendChild(el);
    return el;
  }

  function sync() {
    var el = barEl();
    var cls = "wa-page-loading";
    if (phase === "running") cls += " is-running";
    else if (phase === "done") cls += " is-done";
    else if (phase === "reset") cls += " is-reset";
    el.className = cls;
    el.style.transform = "scaleX(" + pct / 100 + ")";
    el.setAttribute("aria-valuenow", String(Math.round(pct)));
  }

  function clearTimers() {
    if (t1) clearTimeout(t1);
    if (t2) clearTimeout(t2);
    if (t3) clearTimeout(t3);
    t1 = t2 = t3 = null;
  }

  function start() {
    if (phase === "running" || phase === "done") return;
    clearTimers();
    phase = "reset";
    pct = 0;
    sync();
    requestAnimationFrame(function () {
      phase = "running";
      pct = 4;
      sync();
      requestAnimationFrame(function () {
        pct = 82;
        sync();
      });
    });
    t1 = setTimeout(function () {
      pct = 100;
      sync();
      t2 = setTimeout(function () {
        phase = "done";
        sync();
        t3 = setTimeout(function () {
          phase = "reset";
          pct = 0;
          sync();
          requestAnimationFrame(function () {
            phase = "idle";
            sync();
          });
        }, 340);
      }, 160);
    }, 1000);
  }

  function markPending() {
    try {
      sessionStorage.setItem(FLAG, "1");
    } catch (err) {}
  }

  function startIfPending() {
    var pending = false;
    try {
      pending = sessionStorage.getItem(FLAG) === "1";
      if (pending) sessionStorage.removeItem(FLAG);
    } catch (err) {}
    if (pending) start();
  }

  function bind(scope) {
    var root = scope && scope.nodeType === 1 ? scope : document;
    if (navBound) return;
    navBound = true;
    document.addEventListener(
      "click",
      function (ev) {
        if (ev.defaultPrevented) return;
        if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
        var a = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
        if (!a || !root.contains(a)) return;
        if (a.target && a.target !== "_self") return;
        if (a.hasAttribute("download")) return;
        var href = a.getAttribute("href") || "";
        if (!href || href.charAt(0) === "#" || href.indexOf("javascript:") === 0) return;
        try {
          var url = new URL(href, window.location.href);
          if (url.origin !== window.location.origin) return;
          if (url.pathname === window.location.pathname && url.search === window.location.search) {
            return;
          }
        } catch (err) {
          return;
        }
        markPending();
        start();
      },
      true
    );
  }

  window.WA_PAGE_LOADING = {
    start: start,
    bind: bind,
    startIfPending: startIfPending,
  };
})();
