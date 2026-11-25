/**
 * 全局轻提示
 *   WA_TOAST.show('已提交')
 *   WA_TOAST.success / .error / .warning / .info
 */
(function () {
  "use strict";

  var HOST_ID = "wa-toast-host";
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
    host.className = "wa-toast-host";
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
    el.className = "wa-toast wa-toast--" + type;
    el.setAttribute("role", type === "error" || type === "warning" ? "alert" : "status");
    el.innerHTML =
      '<i class="' +
      ICONS[type] +
      ' wa-toast__icon" aria-hidden="true"></i>' +
      '<span class="wa-toast__text"></span>';
    el.querySelector(".wa-toast__text").textContent = text;
    host.appendChild(el);

    var closed = false;
    function close() {
      if (closed) return;
      closed = true;
      el.classList.add("is-leaving");
      window.setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 180);
    }

    if (duration > 0) window.setTimeout(close, duration);
    return { close: close, el: el };
  }

  window.WA_TOAST = {
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
