/**
 * 选项交互：Chip 单选组 [data-wa-chip-group]、分段 [data-wa-segment]
 *
 *   WA_CHOICE.bind()
 */
(function () {
  "use strict";

  function bindChipGroup(group) {
    if (!group || group.getAttribute("data-wa-choice-bound") === "1") return;
    var chips = Array.prototype.slice.call(group.querySelectorAll('[role="radio"]'));
    if (!chips.length) return;
    group.setAttribute("data-wa-choice-bound", "1");
    group.addEventListener("click", function (e) {
      var chip = e.target.closest('[role="radio"]');
      if (!chip || !group.contains(chip)) return;
      chips.forEach(function (item) {
        var selected = item === chip;
        item.classList.toggle("is-active", selected);
        item.classList.toggle("wa-chip--accent", selected);
        item.classList.toggle("wa-chip--marked", !selected);
        item.setAttribute("aria-checked", selected ? "true" : "false");
      });
    });
  }

  function bindSegment(root) {
    if (!root || root.getAttribute("data-wa-choice-bound") === "1") return;
    var items = Array.prototype.slice.call(root.querySelectorAll("[data-wa-segment-item]"));
    if (!items.length) return;
    root.setAttribute("data-wa-choice-bound", "1");

    function activate(target) {
      items.forEach(function (item) {
        var on = item === target;
        item.classList.toggle("is-active", on);
        item.setAttribute("aria-checked", on ? "true" : "false");
      });
    }

    root.addEventListener("click", function (e) {
      var item = e.target.closest("[data-wa-segment-item]");
      if (!item || !root.contains(item)) return;
      activate(item);
    });
  }

  function bind(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll("[data-wa-chip-group]").forEach(bindChipGroup);
    scope.querySelectorAll("[data-wa-segment]").forEach(bindSegment);
  }

  window.WA_CHOICE = { bind: bind };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      bind();
    });
  } else {
    bind();
  }
})();
