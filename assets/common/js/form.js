/**
 * 表单校验：form[data-wa-validate]（及 #kit-form / #tool-form）
 * 项上 data-validate="required|email"、data-error="…"
 *
 *   WA_FORM.bindValidate()
 */
(function () {
  "use strict";

  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function flash(type, text) {
    if (typeof window.WA_FLASH === "function") {
      window.WA_FLASH(type, text);
      return;
    }
    if (window.WA_MESSAGE && typeof window.WA_MESSAGE[type] === "function") {
      window.WA_MESSAGE[type](text);
      return;
    }
    if (window.WA_TOAST && typeof window.WA_TOAST[type] === "function") {
      window.WA_TOAST[type](text);
    }
  }

  function setItemError(item, msg) {
    if (!item) return;
    var err = item.querySelector(".wa-field__error");
    item.classList.toggle("is-error", !!msg);
    if (err) err.textContent = msg || "";
  }

  function clearErrors(form) {
    if (!form) return;
    form.querySelectorAll(".wa-form-item.is-error").forEach(function (item) {
      setItemError(item, "");
    });
  }

  function isBad(rule, value) {
    if (rule === "required") return !value;
    if (rule === "email") return !value || !emailRe.test(value);
    return false;
  }

  function validate(form) {
    var ok = true;
    var firstBad = null;
    if (!form) return { ok: true, firstBad: null };
    form.querySelectorAll(".wa-form-item[data-validate]").forEach(function (item) {
      var input = item.querySelector("input, textarea, select");
      if (!input) return;
      var rule = item.getAttribute("data-validate");
      var message = item.getAttribute("data-error") || "请检查该项";
      var value = String(input.value || "").trim();
      var bad = isBad(rule, value);
      setItemError(item, bad ? message : "");
      if (bad) {
        ok = false;
        if (!firstBad) firstBad = input;
      }
    });
    return { ok: ok, firstBad: firstBad };
  }

  function bindForm(form) {
    if (!form || form.getAttribute("data-wa-form-bound") === "1") return;
    form.setAttribute("data-wa-form-bound", "1");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var result = validate(form);
      if (!result.ok) {
        flash("warning", "请完善标红的表单项");
        if (result.firstBad) {
          try {
            var focusEl =
              window.WA_COMBO && typeof window.WA_COMBO.focusTarget === "function"
                ? window.WA_COMBO.focusTarget(result.firstBad)
                : result.firstBad;
            if (focusEl) focusEl.focus();
          } catch (err) {}
        }
        return;
      }
      /* 业务页自行处理提交；演示表单给成功反馈 */
      if (form.getAttribute("data-wa-validate-demo") === "1" || form.id === "kit-form" || form.id === "tool-form") {
        flash("success", "提交成功");
      }
    });

    form.addEventListener("reset", function () {
      window.setTimeout(function () {
        clearErrors(form);
        if (window.WA_MESSAGE && typeof window.WA_MESSAGE.clear === "function") {
          window.WA_MESSAGE.clear();
        }
        form.querySelectorAll("select[data-wa-combo]").forEach(function (select) {
          select.dispatchEvent(new Event("change", { bubbles: true }));
        });
        form.querySelectorAll('input[type="file"]').forEach(function (input) {
          input.value = "";
          input.dispatchEvent(new Event("wa-dropzone-clear"));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        });
        form.querySelectorAll("input.wa-slider__input[type='range']").forEach(function (input) {
          if (window.WA_SLIDER && typeof window.WA_SLIDER.sync === "function") {
            window.WA_SLIDER.sync(input);
          } else {
            input.dispatchEvent(new Event("input", { bubbles: true }));
          }
        });
        form.querySelectorAll(".wa-dropzone").forEach(function (zone) {
          zone.classList.remove("is-filled");
        });
        form.querySelectorAll(".wa-dropzone-list").forEach(function (list) {
          list.innerHTML = "";
          list.hidden = true;
        });
        flash("info", "已重置");
      }, 0);
    });

    function clearItemErrorOnEdit(e) {
      var t = e.target;
      if (!t || !t.matches || !t.matches("input, textarea, select")) return;
      var item = t.closest(".wa-form-item");
      if (item && item.classList.contains("is-error")) setItemError(item, "");
    }

    form.addEventListener("input", clearItemErrorOnEdit);
    form.addEventListener("change", clearItemErrorOnEdit);
  }

  function bindValidate(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var forms = [];
    if (scope.matches && scope.matches("form")) forms.push(scope);
    scope
      .querySelectorAll("form[data-wa-validate], form#kit-form, form#tool-form, form#project-form")
      .forEach(function (f) {
        forms.push(f);
      });
    forms.forEach(bindForm);
  }

  window.WA_FORM = {
    bindValidate: bindValidate,
    validate: validate,
    clearErrors: clearErrors,
    setItemError: setItemError,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      bindValidate();
    });
  } else {
    bindValidate();
  }
})();
