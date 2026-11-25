/**
 * 通知提示（自右侧滑出，几秒后自动隐藏）
 *   WA_NOTIFY.show('已保存', { title: '成功', type: 'success' })
 *   WA_NOTIFY.success / .error / .warning / .info
 *
 * 按需引入：<script src="./assets/common/js/notify.js"></script>
 */
(function () {
  "use strict";

  var HOST_ID = "wa-notify-host";
  var ICONS = {
    info: "fa-solid fa-circle-info",
    success: "fa-solid fa-circle-check",
    warning: "fa-solid fa-circle-exclamation",
    error: "fa-solid fa-circle-xmark",
  };
  var DEFAULT_TITLE = {
    info: "提示",
    success: "成功",
    warning: "警告",
    error: "错误",
  };

  function ensureHost() {
    var host = document.getElementById(HOST_ID);
    if (host) return host;
    host = document.createElement("div");
    host.id = HOST_ID;
    host.className = "wa-notify-host";
    host.setAttribute("aria-live", "polite");
    host.setAttribute("aria-relevant", "additions");
    (document.body || document.documentElement).appendChild(host);
    return host;
  }

  function show(message, opts) {
    var options = opts || {};
    var type = options.type || "info";
    if (!ICONS[type]) type = "info";
    var duration = options.duration;
    if (duration == null) duration = 4200;
    var text = String(message || "").trim();
    var title = String(options.title != null ? options.title : DEFAULT_TITLE[type] || "").trim();
    if (!text && !title) return null;

    var host = ensureHost();
    var el = document.createElement("div");
    el.className = "wa-notify wa-notify--" + type;
    el.setAttribute("role", type === "error" || type === "warning" ? "alert" : "status");
    el.innerHTML =
      '<i class="' +
      ICONS[type] +
      ' wa-notify__icon" aria-hidden="true"></i>' +
      '<div class="wa-notify__body">' +
      (title ? '<p class="wa-notify__title"></p>' : "") +
      (text ? '<p class="wa-notify__text"></p>' : "") +
      "</div>" +
      '<button type="button" class="wa-notify__close" aria-label="关闭">' +
      '<i class="fa-light fa-xmark" aria-hidden="true"></i>' +
      "</button>";

    var titleEl = el.querySelector(".wa-notify__title");
    var textEl = el.querySelector(".wa-notify__text");
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;
    host.appendChild(el);

    var closed = false;
    function close() {
      if (closed) return;
      closed = true;
      el.classList.add("is-leaving");
      window.setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 220);
    }

    var closeBtn = el.querySelector(".wa-notify__close");
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (duration > 0) window.setTimeout(close, duration);
    return { close: close, el: el };
  }

  window.WA_NOTIFY = {
    show: show,
    info: function (msg, opts) {
      return show(msg, Object.assign({}, opts, { type: "info" }));
    },
    success: function (msg, opts) {
      return show(msg, Object.assign({}, opts, { type: "success" }));
    },
    warning: function (msg, opts) {
      return show(msg, Object.assign({}, opts, { type: "warning" }));
    },
    error: function (msg, opts) {
      return show(msg, Object.assign({}, opts, { type: "error" }));
    },
  };
})();
