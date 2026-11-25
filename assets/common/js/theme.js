/**
 * Lite 明暗 + 主色偏好记忆
 * - html[data-theme=dark|default]
 * - localStorage: 默认 starter-theme-mode / starter-theme-color
 *   复制到 <slug> 后请改 MODE_KEY、COLOR_KEY
 * - URL: ?theme=dark|light
 * - 顶栏按钮：data-wa-theme-toggle
 * - 主色须在本脚本（CSS 之前）恢复，避免刷新闪默认色
 */
;(function () {
  var MODE_KEY = "starter-theme-mode";
  var COLOR_KEY = "starter-theme-color";

  function getInitialDark() {
    try {
      var q = new URLSearchParams(window.location.search || "").get("theme");
      if (q === "dark") return true;
      if (q === "light" || q === "default") return false;
      return localStorage.getItem(MODE_KEY) === "dark";
    } catch (e) {
      return false;
    }
  }

  function applyDark(dark) {
    var html = document.documentElement;
    if (dark) {
      html.dataset.theme = "dark";
      html.classList.add("theme-dark");
    } else {
      html.dataset.theme = "default";
      html.classList.remove("theme-dark");
    }
    try {
      html.style.colorScheme = dark ? "dark" : "light";
    } catch (e) {
      /* ignore */
    }

    var body = document.body;
    if (body) {
      if (dark) body.classList.add("theme-dark");
      else body.classList.remove("theme-dark");
    }

    syncToggleButtons(dark);
    try {
      window.dispatchEvent(new CustomEvent("wa-theme-change", { detail: { dark: !!dark } }));
    } catch (e) {
      /* ignore */
    }
  }

  function persistDark(dark) {
    try {
      localStorage.setItem(MODE_KEY, dark ? "dark" : "light");
    } catch (e) {
      /* ignore */
    }
  }

  function isDark() {
    return document.documentElement.dataset.theme === "dark";
  }

  function hexToRgb(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
    if (!m) return null;
    return parseInt(m[1], 16) + ", " + parseInt(m[2], 16) + ", " + parseInt(m[3], 16);
  }

  function normalizeHex(hex) {
    var m = /^#?([a-f\d]{6})$/i.exec(String(hex || "").trim());
    if (!m) return null;
    return "#" + m[1];
  }

  function getSavedPrimary() {
    try {
      return normalizeHex(localStorage.getItem(COLOR_KEY));
    } catch (e) {
      return null;
    }
  }

  function persistPrimary(color) {
    try {
      localStorage.setItem(COLOR_KEY, color);
    } catch (e) {
      /* ignore */
    }
  }

  function syncThemeColorMeta(color) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", color);
  }

  /* 落地背景 bg.png 色相基准（与 index 色板联动） */
  var LANDING_BG_BASE_HUE = 212;

  function hexToHue(hex) {
    var h = String(hex || "").replace("#", "").trim();
    if (h.length === 3) {
      h = h
        .split("")
        .map(function (c) {
          return c + c;
        })
        .join("");
    }
    if (h.length !== 6) return LANDING_BG_BASE_HUE;
    var r = parseInt(h.slice(0, 2), 16) / 255;
    var g = parseInt(h.slice(2, 4), 16) / 255;
    var b = parseInt(h.slice(4, 6), 16) / 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var d = max - min;
    if (d === 0) return 0;
    var hue = 0;
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
    return hue;
  }

  function syncLandingBgHue(hex) {
    var body = document.body;
    if (!body || !body.classList.contains("wa-landing-cover")) return;
    var color =
      normalizeHex(hex) ||
      normalizeHex(document.documentElement.style.getPropertyValue("--wa-color-primary")) ||
      getSavedPrimary() ||
      "#13c7c2";
    var delta = Math.round(hexToHue(color) - LANDING_BG_BASE_HUE);
    body.style.setProperty("--wa-landing-hue", delta + "deg");
  }

  function applyPrimary(color, persist) {
    var hex = normalizeHex(color);
    var rgb = hex ? hexToRgb(hex) : null;
    if (!hex || !rgb) return false;
    var root = document.documentElement;
    root.style.setProperty("--wa-color-primary", hex);
    root.style.setProperty("--wa-color-primary-rgb", rgb);
    root.style.setProperty(
      "--wa-color-primary-strong",
      "color-mix(in srgb, " + hex + " 82%, #000)"
    );
    root.style.setProperty(
      "--wa-color-primary-soft",
      "color-mix(in srgb, " + hex + " 15%, transparent)"
    );
    root.style.setProperty(
      "--wa-shadow-cta",
      "0 0 20px 2px color-mix(in srgb, " + hex + " 15%, transparent)"
    );
    root.style.setProperty(
      "--wa-shadow-button-hover",
      "0 10px 25px color-mix(in srgb, " + hex + " 30%, transparent)"
    );
    syncThemeColorMeta(hex);
    syncLandingBgHue(hex);
    if (persist) persistPrimary(hex);
    try {
      window.dispatchEvent(new CustomEvent("wa-primary-change", { detail: { color: hex } }));
    } catch (e) {
      /* ignore */
    }
    return true;
  }

  function getPrimary() {
    var inline = normalizeHex(
      document.documentElement.style.getPropertyValue("--wa-color-primary")
    );
    return inline || getSavedPrimary();
  }

  function syncToggleButtons(dark) {
    var nodes = document.querySelectorAll("[data-wa-theme-toggle]");
    for (var i = 0; i < nodes.length; i += 1) {
      var el = nodes[i];
      el.setAttribute("aria-pressed", dark ? "true" : "false");
      el.setAttribute("aria-label", dark ? "切换为亮色" : "切换为暗色");
      if (el.hasAttribute("data-tip") || el.classList.contains("wa-tip")) {
        el.setAttribute("data-tip", dark ? "切换为亮色" : "切换为暗色");
        el.removeAttribute("title");
      } else {
        el.setAttribute("title", "切换主题");
      }
      var icons = el.querySelectorAll("i");
      for (var j = 0; j < icons.length; j += 1) {
        var ic = icons[j];
        if (
          !ic.classList.contains("fa-moon") &&
          !ic.classList.contains("fa-sun") &&
          !ic.classList.contains("fa-lightbulb")
        ) {
          continue;
        }
        // Free FA 须保留 fa-solid；勿再 remove 同名样式类（曾误把 fa-light→fa-solid 后剥掉）
        ic.classList.remove("fa-regular", "fa-brands", "fa-sun");
        ic.classList.add("fa-solid");
        ic.classList.toggle("fa-moon", !dark);
        ic.classList.toggle("fa-lightbulb", !!dark);
      }
    }
  }

  function themeSwitchDurationMs() {
    var fallback = 720;
    try {
      var v = getComputedStyle(document.documentElement)
        .getPropertyValue("--wa-theme-switch-duration")
        .trim();
      if (!v) return fallback;
      if (v.slice(-2) === "ms") return parseFloat(v) || fallback;
      if (v.slice(-1) === "s") return (parseFloat(v) || 0.72) * 1000;
    } catch (e) {
      /* ignore */
    }
    return fallback;
  }

  function canUseViewTransition() {
    try {
      if (window.location.protocol === "file:") return false;
      return typeof document.startViewTransition === "function";
    } catch (e) {
      return false;
    }
  }

  function runThemeTransitionFallback(commit, x, y, r) {
    var host = document.body || document.documentElement;
    var oldBg = host ? getComputedStyle(host).backgroundColor : "";
    var overlay = document.createElement("div");
    overlay.className = "wa-theme-switch-fallback";
    overlay.setAttribute("aria-hidden", "true");
    if (oldBg) overlay.style.background = oldBg;
    host.appendChild(overlay);

    var from = "circle(" + r + "px at " + x + "px " + y + "px)";
    var to = "circle(0px at " + x + "px " + y + "px)";
    overlay.style.clipPath = from;
    commit();

    var duration = themeSwitchDurationMs();
    var easing = "cubic-bezier(0.22, 1, 0.36, 1)";
    if (overlay.animate) {
      var anim = overlay.animate([{ clipPath: from }, { clipPath: to }], {
        duration: duration,
        easing: easing,
        fill: "forwards",
      });
      function removeOverlay() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }
      anim.onfinish = removeOverlay;
      anim.oncancel = removeOverlay;
    } else {
      overlay.style.transition = "clip-path " + duration + "ms " + easing;
      requestAnimationFrame(function () {
        overlay.style.clipPath = to;
      });
      window.setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, duration + 48);
    }
  }

  function runThemeTransition(commit, opts) {
    opts = opts || {};
    if (opts.instant) {
      commit();
      return;
    }
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        commit();
        return;
      }
    } catch (e) {
      /* ignore */
    }

    var x = typeof opts.x === "number" ? opts.x : window.innerWidth * 0.5;
    var y = typeof opts.y === "number" ? opts.y : window.innerHeight * 0.5;
    var r =
      Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 8;
    var root = document.documentElement;
    root.style.setProperty("--wa-theme-switch-x", x + "px");
    root.style.setProperty("--wa-theme-switch-y", y + "px");
    root.style.setProperty("--wa-theme-switch-r", r + "px");

    if (!canUseViewTransition()) {
      runThemeTransitionFallback(commit, x, y, r);
      return;
    }

    root.classList.add("wa-theme-switching");

    function finishSwitching() {
      root.classList.remove("wa-theme-switching");
    }

    try {
      var vt = document.startViewTransition(commit);
      if (vt && vt.finished && typeof vt.finished.then === "function") {
        vt.finished.then(finishSwitching, finishSwitching);
      } else {
        window.setTimeout(finishSwitching, themeSwitchDurationMs() + 80);
      }
    } catch (e) {
      finishSwitching();
      runThemeTransitionFallback(commit, x, y, r);
    }
  }

  function bindToggles() {
    document.addEventListener("click", function (ev) {
      var t = ev.target;
      if (!t || !t.closest) return;
      var btn = t.closest("[data-wa-theme-toggle]");
      if (!btn) return;
      ev.preventDefault();
      var rect = btn.getBoundingClientRect();
      window.WA_THEME.toggle({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    });
  }

  window.WA_THEME = {
    storageKey: MODE_KEY,
    colorKey: COLOR_KEY,
    isDark: isDark,
    applyDark: applyDark,
    persistDark: persistDark,
    applyPrimary: applyPrimary,
    persistPrimary: persistPrimary,
    getPrimary: getPrimary,
    getSavedPrimary: getSavedPrimary,
    syncLandingBgHue: syncLandingBgHue,
    runTransition: runThemeTransition,
    toggle: function (opts) {
      opts = opts || {};
      var next = typeof opts.dark === "boolean" ? opts.dark : !isDark();
      if (next === isDark()) return next;
      runThemeTransition(
        function () {
          applyDark(next);
          persistDark(next);
        },
        opts
      );
      return next;
    },
  };

  applyDark(getInitialDark());
  var bootColor = getSavedPrimary();
  if (bootColor) applyPrimary(bootColor, false);

  function bootLandingHue() {
    syncLandingBgHue(getPrimary() || bootColor || "#13c7c2");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      applyDark(isDark());
      var color = getPrimary();
      if (color) applyPrimary(color, false);
      else bootLandingHue();
      bindToggles();
    });
  } else {
    bootLandingHue();
    bindToggles();
  }

  try {
    window.addEventListener("storage", function (ev) {
      if (!ev) return;
      if (ev.key === MODE_KEY) applyDark(ev.newValue === "dark");
      if (ev.key === COLOR_KEY) {
        var next = normalizeHex(ev.newValue);
        if (next) applyPrimary(next, false);
      }
    });
  } catch (e) {
    /* ignore */
  }
})();
