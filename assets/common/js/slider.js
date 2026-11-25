/**
 * 滑块（原生 range）：[data-wa-slider] 内 .wa-slider__input
 * 单值；--wa-slider-pct 驱动已选轨段；悬停/拖动显示数值气泡。
 * 可选常显数值：.wa-slider-head（与标题同行右对齐）或 .wa-slider-row；后缀用 data-wa-slider-suffix。
 *
 *   WA_SLIDER.bind()
 */
(function () {
  "use strict";

  function ensureTip(zone) {
    var tip = zone.querySelector(".wa-slider__tip");
    if (tip) return tip;
    tip = document.createElement("span");
    tip.className = "wa-slider__tip";
    tip.setAttribute("aria-hidden", "true");
    tip.hidden = true;
    zone.insertBefore(tip, zone.firstChild);
    return tip;
  }

  function findValueEl(zone) {
    if (!zone) return null;
    var el = zone.querySelector("[data-wa-slider-value], .wa-slider__value");
    if (el) return el;
    var row = zone.closest(".wa-slider-row");
    if (row) {
      el = row.querySelector("[data-wa-slider-value], .wa-slider__value");
      if (el) return el;
    }
    var item = zone.closest(".wa-form-item");
    if (item) {
      el = item.querySelector(".wa-slider-head [data-wa-slider-value], .wa-slider-head .wa-slider__value");
      if (el) return el;
      return item.querySelector("[data-wa-slider-value], .wa-slider__value");
    }
    return null;
  }

  function syncValueLabel(zone, val) {
    var label = findValueEl(zone);
    if (!label) return;
    var suffix = label.getAttribute("data-suffix");
    if (suffix == null) {
      suffix = zone.getAttribute("data-wa-slider-suffix");
      if (suffix == null) suffix = "";
    }
    label.textContent = String(val) + suffix;
  }

  function sync(input) {
    if (!input) return;
    var min = Number(input.min);
    var max = Number(input.max);
    if (!isFinite(min)) min = 0;
    if (!isFinite(max)) max = 100;
    var val = Number(input.value);
    if (!isFinite(val)) val = min;
    var ratio = max === min ? 0 : (val - min) / (max - min);
    var pct = ratio * 100;
    input.style.setProperty("--wa-slider-pct", pct + "%");
    input.setAttribute("aria-valuenow", String(val));

    var zone = input.closest("[data-wa-slider], .wa-slider");
    if (!zone) return;
    zone.style.setProperty("--wa-slider-pct", pct + "%");
    zone.style.setProperty("--wa-slider-ratio", String(ratio));
    var tip = ensureTip(zone);
    tip.textContent = String(val);
    syncValueLabel(zone, val);
  }

  function showTip(zone) {
    if (!zone) return;
    var tip = ensureTip(zone);
    tip.hidden = false;
    zone.classList.add("is-tip");
  }

  function hideTip(zone) {
    if (!zone) return;
    if (zone.classList.contains("is-dragging")) return;
    var tip = zone.querySelector(".wa-slider__tip");
    if (tip) tip.hidden = true;
    zone.classList.remove("is-tip");
  }

  function bindInput(input) {
    if (!input || input.getAttribute("data-wa-slider-bound") === "1") return;
    input.setAttribute("data-wa-slider-bound", "1");
    var zone = input.closest("[data-wa-slider], .wa-slider") || input.parentElement;
    if (zone && !zone.classList.contains("wa-slider")) {
      zone.classList.add("wa-slider");
    }
    sync(input);

    input.addEventListener("input", function () {
      sync(input);
      showTip(zone);
    });
    input.addEventListener("change", function () {
      sync(input);
    });
    input.addEventListener("pointerdown", function () {
      if (zone) zone.classList.add("is-dragging");
      showTip(zone);
    });
    input.addEventListener("pointerup", function () {
      if (zone) zone.classList.remove("is-dragging");
      if (!(zone && zone.matches(":hover"))) hideTip(zone);
    });
    input.addEventListener("pointercancel", function () {
      if (zone) zone.classList.remove("is-dragging");
      hideTip(zone);
    });
    input.addEventListener("mouseenter", function () {
      sync(input);
      showTip(zone);
    });
    input.addEventListener("mouseleave", function () {
      hideTip(zone);
    });
    input.addEventListener("focus", function () {
      sync(input);
      showTip(zone);
    });
    input.addEventListener("blur", function () {
      if (zone) zone.classList.remove("is-dragging");
      hideTip(zone);
    });
  }

  function bindZone(zone) {
    if (!zone) return;
    var input = zone.querySelector(".wa-slider__input, input[type='range']");
    bindInput(input);
  }

  function bind(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll("[data-wa-slider]").forEach(bindZone);
    scope.querySelectorAll("input.wa-slider__input[type='range']").forEach(bindInput);
  }

  window.WA_SLIDER = { bind: bind, sync: sync };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      bind();
    });
  } else {
    bind();
  }
})();
