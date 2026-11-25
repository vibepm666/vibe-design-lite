/**
 * Lite 首页页级脚本（依赖 js/shared.js）
 * FAQ / 主题色板
 */
(function () {
  /* —— FAQ：默认可多开；根节点加 data-faq-accordion 则互斥 —— */
  document.querySelectorAll("[data-faq]").forEach(function (root) {
    var accordion = root.hasAttribute("data-faq-accordion");

    root.querySelectorAll(".wa-faq__item").forEach(function (item) {
      var btn = item.querySelector(".wa-faq__q");
      if (!btn) return;

      function sync() {
        var open = item.classList.contains("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      }
      sync();

      btn.addEventListener("click", function () {
        var willOpen = !item.classList.contains("is-open");
        if (accordion && willOpen) {
          root.querySelectorAll(".wa-faq__item.is-open").forEach(function (other) {
            if (other === item) return;
            other.classList.remove("is-open");
            var ob = other.querySelector(".wa-faq__q");
            if (ob) ob.setAttribute("aria-expanded", "false");
          });
        }
        item.classList.toggle("is-open", willOpen);
        sync();
      });
    });
  });

  /* 落地背景色相：theme.js 统一同步；色板切换时再推一次 */
  function syncLandingBgHue(hex) {
    if (window.WA_THEME && typeof window.WA_THEME.syncLandingBgHue === "function") {
      window.WA_THEME.syncLandingBgHue(hex);
    }
  }

  /* —— 主题色板预览（主色由 theme.js 尽早恢复；此处只同步色板 UI） —— */
  var swatchRoot = document.querySelector("[data-theme-swatches]");
  if (swatchRoot) {
    var labelEl = document.querySelector("[data-swatch-label]");
    var hexEl = document.querySelector("[data-preview-hex]");

    function colorEquals(a, b) {
      if (!a || !b) return false;
      return String(a).replace(/^#/, "").toLowerCase() === String(b).replace(/^#/, "").toLowerCase();
    }

    function findSwatchByColor(color) {
      if (!color) return null;
      var nodes = swatchRoot.querySelectorAll(".wa-swatch[data-color]");
      for (var i = 0; i < nodes.length; i += 1) {
        if (colorEquals(nodes[i].getAttribute("data-color"), color)) return nodes[i];
      }
      return null;
    }

    function applySwatch(btn, persist) {
      var color = btn.getAttribute("data-color");
      var name = btn.getAttribute("data-label") || "主题色";
      if (!color) return;
      if (window.WA_THEME && typeof WA_THEME.applyPrimary === "function") {
        WA_THEME.applyPrimary(color, persist !== false);
      }
      syncLandingBgHue(color);
      swatchRoot.querySelectorAll(".wa-swatch").forEach(function (el) {
        el.classList.toggle("is-active", el === btn);
      });
      if (labelEl) labelEl.textContent = "当前：" + name + " · " + color;
      if (hexEl) hexEl.textContent = color;
    }

    var savedColor =
      (window.WA_THEME && WA_THEME.getPrimary && WA_THEME.getPrimary()) || null;
    var initialBtn = findSwatchByColor(savedColor);
    if (!initialBtn) {
      initialBtn = swatchRoot.querySelector(".wa-swatch.is-active") || swatchRoot.querySelector(".wa-swatch");
    }
    if (initialBtn) applySwatch(initialBtn, false);

    swatchRoot.addEventListener("click", function (ev) {
      var btn = ev.target.closest(".wa-swatch");
      if (!btn || !swatchRoot.contains(btn)) return;
      applySwatch(btn, true);
    });
  }

})();
