/**
 * 标准弹窗（data-modal-open / data-modal-close）
 *
 *   WA_MODAL.open(modalElOrId, trigger?)
 *   WA_MODAL.close(modalEl)
 *   WA_MODAL.bind()
 *
 * 含焦点陷阱、Escape、关闭后回到触发器。
 */
(function () {
  "use strict";

  var modalFocusReturn = null;
  var modalKeyHandler = null;
  var bound = false;

  function resolveModal(target) {
    if (!target) return null;
    if (typeof target === "string") return document.getElementById(target);
    return target;
  }

  function getModalFocusables(modal) {
    return Array.prototype.slice
      .call(
        modal.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )
      .filter(function (el) {
        if (el.getAttribute("aria-hidden") === "true") return false;
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      });
  }

  function open(target, trigger) {
    var modal = resolveModal(target);
    if (!modal) return;
    if (trigger) modalFocusReturn = trigger;
    else modalFocusReturn = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("wa-modal-open");
    document.documentElement.classList.add("wa-modal-open");
    var panel = modal.querySelector(".wa-modal__panel");
    var closeBtn = modal.querySelector(".wa-modal__close");
    var focusTarget = closeBtn || panel;
    if (focusTarget) {
      try {
        focusTarget.focus();
      } catch (e) {}
    }
    if (modalKeyHandler) {
      document.removeEventListener("keydown", modalKeyHandler);
    }
    modalKeyHandler = function (ev) {
      if (!modal.classList.contains("is-open")) return;
      if (ev.key === "Escape") {
        ev.preventDefault();
        close(modal);
        return;
      }
      if (ev.key !== "Tab") return;
      var nodes = getModalFocusables(modal);
      if (!nodes.length) {
        ev.preventDefault();
        return;
      }
      var first = nodes[0];
      var last = nodes[nodes.length - 1];
      if (ev.shiftKey && document.activeElement === first) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", modalKeyHandler);
  }

  function close(target) {
    var modal = resolveModal(target);
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    var stillOpen = document.querySelector(".wa-modal.is-open");
    if (!stillOpen) {
      document.body.classList.remove("wa-modal-open");
      document.documentElement.classList.remove("wa-modal-open");
      if (modalKeyHandler) {
        document.removeEventListener("keydown", modalKeyHandler);
        modalKeyHandler = null;
      }
    }
    var ret = modalFocusReturn;
    modalFocusReturn = null;
    if (ret && typeof ret.focus === "function") {
      window.setTimeout(function () {
        try {
          ret.focus();
        } catch (e) {}
      }, 0);
    }
  }

  function bind() {
    if (bound) return;
    bound = true;

    document.querySelectorAll("[data-modal-open]").forEach(function (btn) {
      if (btn.getAttribute("data-wa-modal-bound") === "1") return;
      btn.setAttribute("data-wa-modal-bound", "1");
      btn.addEventListener("click", function (ev) {
        if (btn.tagName === "A") ev.preventDefault();
        open(btn.getAttribute("data-modal-open"), btn);
      });
    });

    document.querySelectorAll(".wa-modal").forEach(function (modal) {
      modal.querySelectorAll("[data-modal-close]").forEach(function (el) {
        if (el.getAttribute("data-wa-modal-bound") === "1") return;
        el.setAttribute("data-wa-modal-bound", "1");
        el.addEventListener("click", function () {
          close(modal);
        });
      });
    });
  }

  window.WA_MODAL = {
    open: open,
    close: close,
    bind: bind,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
