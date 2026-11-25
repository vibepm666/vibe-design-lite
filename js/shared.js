/**
 * Lite 营销页公共壳脚本
 * 导航抽屉 / 通用反馈 / 聚光 / 顶栏滚动与回到顶部
 * 弹窗：assets/common/js/modal.js（WA_MODAL）
 */
(function () {
  /* —— 通用反馈 —— */
  function flashFeedback(type, text) {
    var kind = type || "info";
    var msg = String(text || "").trim();
    if (!msg) return;
    if (window.WA_MESSAGE && typeof window.WA_MESSAGE[kind] === "function") {
      window.WA_MESSAGE[kind](msg);
      return;
    }
    if (window.WA_MESSAGE && typeof window.WA_MESSAGE.show === "function") {
      window.WA_MESSAGE.show(msg, { type: kind });
      return;
    }
    if (window.WA_TOAST && typeof window.WA_TOAST[kind] === "function") {
      window.WA_TOAST[kind](msg);
      return;
    }
    if (window.WA_TOAST && typeof window.WA_TOAST.show === "function") {
      window.WA_TOAST.show(msg, { type: kind });
    }
  }

  window.WA_FLASH = flashFeedback;

  var messageCopy = {
    info: "信息提示",
    success: "操作成功",
    warning: "请注意检查",
    error: "操作失败",
  };

  document.querySelectorAll("[data-kit-message]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var type = btn.getAttribute("data-kit-message") || "info";
      var custom = btn.getAttribute("data-kit-message-text");
      var msg = (custom && custom.trim()) || messageCopy[type] || messageCopy.info;
      flashFeedback(type, msg);
    });
  });

  /* —— 导航 —— */
  var toggle = document.querySelector("[data-nav-toggle]");
  var drawer = document.querySelector("[data-nav-drawer]");
  if (toggle && drawer) {
    function setNavOpen(open) {
      drawer.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    toggle.addEventListener("click", function () {
      setNavOpen(!drawer.classList.contains("is-open"));
    });

    drawer.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setNavOpen(false);
      });
    });

    window.addEventListener("resize", function () {
      if (window.matchMedia("(min-width: 900px)").matches) setNavOpen(false);
    });
  }

  /* —— 卡片聚光 —— */
  (function spotlight() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var selector = [
      ".wa-nav--card",
      ".wa-feature",
      ".wa-value",
      ".wa-export-card",
      ".wa-step",
      ".wa-faq__item",
      ".wa-theme-studio",
      ".wa-kit__card",
      ".wa-gb-panel"
    ].join(",");
    var hosts = document.querySelectorAll(selector);
    if (!hosts.length) return;

    hosts.forEach(function (host) {
      if (host.querySelector(".wa-spotlight-glow")) return;
      host.classList.add("wa-spotlight-host");
      var glow = document.createElement("div");
      glow.className = "wa-spotlight-glow";
      glow.setAttribute("aria-hidden", "true");
      host.insertBefore(glow, host.firstChild);
      host.addEventListener("pointermove", function (e) {
        var rect = host.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        host.style.setProperty(
          "--mouse-x",
          ((e.clientX - rect.left) / rect.width * 100).toFixed(2) + "%"
        );
        host.style.setProperty(
          "--mouse-y",
          ((e.clientY - rect.top) / rect.height * 100).toFixed(2) + "%"
        );
      });
    });
  })();

  /* —— 顶栏滚动收紧 + 回到顶部 —— */
  (function chromeScroll() {
    var topNav = document.querySelector(".wa-nav--card");
    var backTop = document.querySelector("[data-back-top]");
    var scrolled = false;
    function sync() {
      var y = window.scrollY || 0;
      if (topNav) {
        if (!scrolled && y > 12) {
          scrolled = true;
          topNav.classList.add("is-scrolled");
        } else if (scrolled && y < 4) {
          scrolled = false;
          topNav.classList.remove("is-scrolled");
        }
      }
      if (backTop) backTop.classList.toggle("is-visible", y > 260);
    }
    window.addEventListener("scroll", sync, { passive: true });
    sync();

    if (backTop) {
      backTop.addEventListener("click", function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (history.replaceState) {
          try {
            history.replaceState(null, "", location.pathname + location.search);
          } catch (err) {}
        }
      });
    }
  })();
})();
