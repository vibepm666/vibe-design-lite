/**
 * 通用文本输入 .wa-field
 * - 清除钮在「有内容」时标记可显示；悬停/聚焦输入区时露出（多行文本不加清除钮）
 * - 多行：有 maxlength / data-wa-maxlength 时右下角显示字数统计
 * - WA_FIELD.bindClearable() / WA_FIELD.bindTextareaCount()
 */
(function () {
  "use strict";

  function syncClear(field) {
    if (!field) return;
    var input = field.querySelector("[data-wa-field-input]");
    var clearBtn = field.querySelector("[data-wa-field-clear]");
    if (!clearBtn) return;
    var hasValue = !!(input && String(input.value || "").length);
    clearBtn.classList.toggle("is-visible", hasValue);
    clearBtn.setAttribute("aria-hidden", hasValue ? "false" : "true");
  }

  function isDateInput(input) {
    if (!input) return false;
    var t = String(input.type || "").toLowerCase();
    return t === "date" || t === "datetime-local" || t === "time";
  }

  function openDatePicker(input) {
    if (!input || typeof input.showPicker !== "function") return;
    try {
      input.showPicker();
    } catch (err) {}
  }

  function bindField(field) {
    if (!field || field.getAttribute("data-wa-field-bound") === "1") return;
    if (field.classList.contains("wa-field--textarea") || field.classList.contains("wa-field--select")) {
      return;
    }
    var input = field.querySelector("[data-wa-field-input]");
    var clearBtn = field.querySelector("[data-wa-field-clear]");
    if (!input) return;
    field.setAttribute("data-wa-field-bound", "1");
    syncClear(field);
    input.addEventListener("input", function () {
      syncClear(field);
    });
    input.addEventListener("change", function () {
      syncClear(field);
    });
    input.addEventListener("focus", function () {
      syncClear(field);
    });
    input.addEventListener("blur", function () {
      window.setTimeout(function () {
        syncClear(field);
      }, 120);
    });
    if (isDateInput(input)) {
      input.addEventListener("click", function () {
        openDatePicker(input);
      });
      field.addEventListener("click", function (e) {
        if (e.target.closest("[data-wa-field-clear]")) return;
        if (e.target === input || e.target.closest(".wa-field__icon")) {
          openDatePicker(input);
        }
      });
    }
    if (clearBtn) {
      clearBtn.addEventListener("mousedown", function (e) {
        e.preventDefault();
      });
      clearBtn.addEventListener("click", function () {
        input.value = "";
        syncClear(field);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.focus();
      });
    }
  }

  function bindClearable(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(".wa-field").forEach(bindField);
  }

  function maxLengthOf(textarea) {
    if (!textarea) return 0;
    var raw =
      textarea.getAttribute("maxlength") ||
      textarea.getAttribute("data-wa-maxlength") ||
      "";
    var n = parseInt(raw, 10);
    return n > 0 ? n : 0;
  }

  function syncTextareaCount(field) {
    if (!field) return;
    var textarea = field.querySelector("textarea.wa-field__textarea, textarea");
    var countEl = field.querySelector("[data-wa-field-count]");
    if (!textarea || !countEl) return;
    var max = maxLengthOf(textarea);
    if (!max) return;
    var n = String(textarea.value || "").length;
    countEl.textContent = n + " / " + max;
    countEl.classList.toggle("is-limit", n >= max);
  }

  function bindTextareaCount(field) {
    if (!field || field.getAttribute("data-wa-count-bound") === "1") return;
    if (!field.classList.contains("wa-field--textarea")) return;
    var textarea = field.querySelector("textarea.wa-field__textarea, textarea");
    if (!textarea) return;
    var max = maxLengthOf(textarea);
    if (!max) return;
    if (!textarea.getAttribute("maxlength")) {
      textarea.setAttribute("maxlength", String(max));
    }
    var countEl = field.querySelector("[data-wa-field-count]");
    if (!countEl) {
      countEl = document.createElement("span");
      countEl.className = "wa-field__count";
      countEl.setAttribute("data-wa-field-count", "");
      countEl.setAttribute("aria-live", "polite");
      field.appendChild(countEl);
    }
    field.setAttribute("data-wa-count-bound", "1");
    textarea.addEventListener("input", function () {
      syncTextareaCount(field);
    });
    syncTextareaCount(field);
  }

  function bindTextareaCounts(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(".wa-field--textarea").forEach(bindTextareaCount);
  }

  window.WA_FIELD = {
    bindClearable: bindClearable,
    bindTextareaCount: bindTextareaCounts,
    syncClear: syncClear,
    syncTextareaCount: syncTextareaCount,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      bindClearable();
      bindTextareaCounts();
    });
  } else {
    bindClearable();
    bindTextareaCounts();
  }
})();
