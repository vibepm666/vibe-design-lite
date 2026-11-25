/**
 * 吐司提示（页面正中弹出；图标在上、文字在下；始终暗色；几秒后自动隐藏）
 *   WA_MESSAGE.show('已提交')
 *   WA_MESSAGE.success / .error / .warning / .info
 *
 * 按需引入：<script src="./assets/common/js/message.js"></script>
 */
(function () {
  "use strict";

  var HOST_ID = "wa-message-host";
  var ICONS = {
    info: "fa-solid fa-circle-info",
    success: "fa-solid fa-circle-check",
    warning: "fa-solid fa-circle-exclamation",
    error: "fa-solid fa-circle-xmark",
  };

  function ensureHost() {
    var host = document.getElementById(HOST_ID);
    if (host) return host;
    host = document.createElement("div");
    host.id = HOST_ID;
    host.className = "wa-message-host";
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
    if (duration == null) duration = 2800;
    var text = String(message || "").trim();
    if (!text) return null;

    var host = ensureHost();
    var el = document.createElement("div");
    el.className = "wa-message wa-message--" + type;
    el.setAttribute("role", type === "error" || type === "warning" ? "alert" : "status");
    el.innerHTML =
      '<i class="' +
      ICONS[type] +
      ' wa-message__icon" aria-hidden="true"></i>' +
      '<span class="wa-message__text"></span>';
    el.querySelector(".wa-message__text").textContent = text;
    host.appendChild(el);

    var closed = false;
    function close() {
      if (closed) return;
      closed = true;
      el.classList.add("is-leaving");
      window.setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 200);
    }

    if (duration > 0) window.setTimeout(close, duration);
    return { close: close, el: el };
  }

  function clear() {
    var host = document.getElementById(HOST_ID);
    if (!host) return;
    Array.prototype.slice.call(host.querySelectorAll(".wa-message")).forEach(function (el) {
      el.classList.add("is-leaving");
      window.setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 200);
    });
  }

  window.WA_MESSAGE = {
    show: show,
    clear: clear,
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
