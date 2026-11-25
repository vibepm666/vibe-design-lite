/**
 * Lite 展示区块页级脚本（依赖 js/shared.js）
 * 步骤胶囊单选
 */
(function () {
  document.querySelectorAll(".wa-step-grid").forEach(function (grid) {
    var pills = Array.prototype.slice.call(grid.querySelectorAll("[data-step-pill]"));
    if (!pills.length) return;
    grid.setAttribute("role", "radiogroup");
    if (!grid.getAttribute("aria-label")) grid.setAttribute("aria-label", "步骤选择");

    function sync(active) {
      pills.forEach(function (el) {
        var on = el === active;
        el.classList.toggle("is-active", on);
        el.setAttribute("role", "radio");
        el.setAttribute("aria-checked", on ? "true" : "false");
        el.tabIndex = on ? 0 : -1;
      });
    }

    var initial = pills.find(function (el) {
      return el.classList.contains("is-active");
    }) || pills[0];
    sync(initial);

    pills.forEach(function (pill) {
      pill.addEventListener("click", function () {
        sync(pill);
      });
      pill.addEventListener("keydown", function (ev) {
        var idx = pills.indexOf(pill);
        var next = -1;
        if (ev.key === "ArrowRight" || ev.key === "ArrowDown") next = (idx + 1) % pills.length;
        else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") next = (idx - 1 + pills.length) % pills.length;
        else if (ev.key === "Home") next = 0;
        else if (ev.key === "End") next = pills.length - 1;
        else if (ev.key === " " || ev.key === "Enter") {
          ev.preventDefault();
          sync(pill);
          return;
        } else return;
        ev.preventDefault();
        sync(pills[next]);
        pills[next].focus();
      });
    });
  });
})();
