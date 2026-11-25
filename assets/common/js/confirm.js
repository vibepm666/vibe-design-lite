/**
 * 确认对话框（Promise）
 *
 *   WA_CONFIRM.open({
 *     title: '确认删除？',
 *     message: '删除后不可恢复。',
 *     confirmText: '删除',
 *     cancelText: '取消',
 *     danger: true,       // 或 type: 'danger' | 'warning' | 'info'
 *   }).then(function (ok) { if (ok) { … } });
 */
(function () {
  "use strict";

  var ROOT_ID = "wa-confirm-root";
  var active = null;
  var ICONS = {
    info: "fa-solid fa-circle-info",
    warning: "fa-solid fa-circle-exclamation",
    danger: "fa-solid fa-circle-exclamation",
  };

  function resolveType(options) {
    if (options.type && ICONS[options.type]) return options.type;
    if (options.danger) return "danger";
    return "warning";
  }

  function ensureRoot() {
    var root = document.getElementById(ROOT_ID);
    if (root) return root;
    root = document.createElement("div");
    root.id = ROOT_ID;
    root.className = "wa-modal wa-modal--confirm";
    root.setAttribute("role", "alertdialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-hidden", "true");
    root.innerHTML =
      '<div class="wa-modal__overlay" aria-hidden="true"></div>' +
      '<div class="wa-modal__panel" tabindex="-1" role="document">' +
      '  <button type="button" class="wa-modal__close wa-modal__close--corner" data-wa-confirm-cancel aria-label="关闭">' +
      '    <i class="fa-solid fa-xmark" aria-hidden="true"></i>' +
      "  </button>" +
      '  <div class="wa-modal__body wa-modal__body--confirm">' +
      '    <div class="wa-modal__icon" aria-hidden="true"><i></i></div>' +
      '    <div class="wa-modal__copy">' +
      '      <h2 class="wa-modal__title" id="wa-confirm-title"></h2>' +
      '      <p class="wa-modal__message" id="wa-confirm-message"></p>' +
      "    </div>" +
      "  </div>" +
      '  <div class="wa-modal__footer">' +
      '    <button type="button" class="wa-btn wa-btn--secondary" data-wa-confirm-cancel>取消</button>' +
      '    <button type="button" class="wa-btn wa-btn--primary" data-wa-confirm-ok>确定</button>' +
      "  </div>" +
      "</div>";
    ;(document.body || document.documentElement).appendChild(root);
    return root;
  }

  function setOpen(root, open) {
    root.classList.toggle("is-open", open);
    root.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.classList.toggle("wa-modal-open", open);
    document.documentElement.classList.toggle("wa-modal-open", open);
  }

  function finish(ok) {
    if (!active) return;
    var ctx = active;
    active = null;
    setOpen(ctx.root, false);
    document.removeEventListener("keydown", ctx.onKey);
    if (ctx.prevFocus && typeof ctx.prevFocus.focus === "function") {
      try {
        ctx.prevFocus.focus();
      } catch (e) {}
    }
    ctx.resolve(!!ok);
  }

  function open(opts) {
    var options = opts || {};
    var title = String(options.title || "确认操作").trim() || "确认操作";
    var message = String(options.message || "").trim();
    var confirmText = String(options.confirmText || "确定").trim() || "确定";
    var cancelText = String(options.cancelText || "取消").trim() || "取消";
    var type = resolveType(options);
    var danger = type === "danger" || !!options.danger;

    if (active) {
      finish(false);
    }

    return new Promise(function (resolve) {
      var root = ensureRoot();
      var titleEl = root.querySelector("#wa-confirm-title");
      var msgEl = root.querySelector("#wa-confirm-message");
      var iconWrap = root.querySelector(".wa-modal__icon");
      var iconEl = iconWrap.querySelector("i");
      var okBtn = root.querySelector("[data-wa-confirm-ok]");
      var cancelBtns = root.querySelectorAll("[data-wa-confirm-cancel]");

      root.className = "wa-modal wa-modal--confirm wa-modal--confirm-" + type;
      titleEl.textContent = title;
      root.setAttribute("aria-labelledby", "wa-confirm-title");
      iconEl.className = ICONS[type] || ICONS.warning;

      if (message) {
        msgEl.hidden = false;
        msgEl.textContent = message;
        root.setAttribute("aria-describedby", "wa-confirm-message");
      } else {
        msgEl.hidden = true;
        msgEl.textContent = "";
        root.removeAttribute("aria-describedby");
      }

      okBtn.textContent = confirmText;
      okBtn.className = "wa-btn " + (danger ? "wa-btn--danger" : "wa-btn--primary");
      cancelBtns.forEach(function (btn) {
        if (btn.tagName === "BUTTON" && !btn.classList.contains("wa-modal__close")) {
          btn.textContent = cancelText;
        }
      });

      function onKey(ev) {
        if (ev.key === "Escape") {
          ev.preventDefault();
          finish(false);
        }
      }

      active = {
        root: root,
        resolve: resolve,
        onKey: onKey,
        prevFocus: document.activeElement,
      };

      root.onclick = function (ev) {
        var t = ev.target;
        if (!t || !t.closest) return;
        if (t.closest("[data-wa-confirm-ok]")) {
          finish(true);
          return;
        }
        if (t.closest("[data-wa-confirm-cancel]")) {
          finish(false);
        }
      };

      document.addEventListener("keydown", onKey);
      setOpen(root, true);
      window.setTimeout(function () {
        var cancelBtn = root.querySelector(".wa-modal__footer [data-wa-confirm-cancel]");
        var focusEl = danger && cancelBtn ? cancelBtn : okBtn;
        try {
          focusEl.focus();
        } catch (e) {}
      }, 0);
    });
  }

  window.WA_CONFIRM = {
    open: open,
  };
})();
