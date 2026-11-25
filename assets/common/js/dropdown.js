/**
 * 下拉菜单（操作菜单）
 *
 *   <div class="wa-dropdown" data-wa-dropdown>
 *     <button type="button" data-wa-dropdown-trigger aria-expanded="false" aria-haspopup="menu">…</button>
 *     <ul class="wa-dropdown__menu" role="menu" hidden data-wa-dropdown-menu>…</ul>
 *   </div>
 *   WA_DROPDOWN.bind()
 *
 * 菜单挂到 body + position:fixed，避免被卡片 overflow / stacking 裁切。
 */
(function () {
  "use strict";

  var openRoot = null;
  var menuMap = typeof WeakMap !== "undefined" ? new WeakMap() : null;
  var placeRaf = 0;

  function getMenu(root) {
    if (menuMap && menuMap.has(root)) return menuMap.get(root);
    return root.querySelector("[data-wa-dropdown-menu]");
  }

  function placeMenu(root) {
    var trigger = root.querySelector("[data-wa-dropdown-trigger]");
    var menu = getMenu(root);
    if (!trigger || !menu || menu.hidden) return;
    var r = trigger.getBoundingClientRect();
    var end = menu.classList.contains("wa-dropdown__menu--end");
    /* 按内容测宽，不强制拉齐触发器 */
    menu.style.minWidth = "";
    menu.style.width = "";
    var w = Math.ceil(menu.getBoundingClientRect().width) || 120;
    var left = end ? r.right - w : r.left;
    if (left + w > window.innerWidth - 8) left = Math.max(8, window.innerWidth - w - 8);
    if (left < 8) left = 8;
    menu.style.top = Math.round(r.bottom + 12) + "px";
    menu.style.left = Math.round(left) + "px";
  }

  function schedulePlace() {
    if (placeRaf) return;
    placeRaf = window.requestAnimationFrame(function () {
      placeRaf = 0;
      if (openRoot) placeMenu(openRoot);
    });
  }

  function setOpen(root, open) {
    if (!root) return;
    var trigger = root.querySelector("[data-wa-dropdown-trigger]");
    var menu = getMenu(root);
    if (!trigger || !menu) return;
    root.classList.toggle("is-open", open);
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
    menu.hidden = !open;
    if (open) {
      openRoot = root;
      placeMenu(root);
    } else if (openRoot === root) {
      openRoot = null;
    }
  }

  function closeAll(except) {
    document.querySelectorAll("[data-wa-dropdown].is-open").forEach(function (root) {
      if (except && root === except) return;
      setOpen(root, false);
    });
  }

  function bindOne(root) {
    if (!root || root.getAttribute("data-wa-dropdown-bound") === "1") return;
    var trigger = root.querySelector("[data-wa-dropdown-trigger]");
    var menu = root.querySelector("[data-wa-dropdown-menu]");
    if (!trigger || !menu) return;
    root.setAttribute("data-wa-dropdown-bound", "1");
    if (menuMap) menuMap.set(root, menu);
    if (menu.parentNode !== document.body) {
      /* 挂到 body 前，把行上 data-* 拷到菜单，便于菜单项点击后仍能读到行数据 */
      var row = root.closest("tr");
      if (row && row.attributes) {
        Array.prototype.forEach.call(row.attributes, function (attr) {
          if (attr && attr.name && attr.name.indexOf("data-") === 0) {
            menu.setAttribute(attr.name, attr.value);
          }
        });
      }
      document.body.appendChild(menu);
    }

    trigger.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      var willOpen = menu.hidden;
      closeAll();
      setOpen(root, willOpen);
    });

    menu.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var item = ev.target.closest("[role='menuitem']");
      if (!item || !menu.contains(item)) return;
      setOpen(root, false);
    });
  }

  function bind(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    root.querySelectorAll("[data-wa-dropdown]").forEach(bindOne);
  }

  document.addEventListener("click", function () {
    closeAll();
  });

  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "Escape") return;
    if (!openRoot) return;
    var trigger = openRoot.querySelector("[data-wa-dropdown-trigger]");
    closeAll();
    if (trigger) {
      try {
        trigger.focus();
      } catch (e) {}
    }
  });

  window.addEventListener("resize", schedulePlace);
  window.addEventListener("scroll", schedulePlace, true);

  window.WA_DROPDOWN = {
    bind: bind,
    closeAll: closeAll,
    place: function (root) {
      placeMenu(root || openRoot);
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      bind();
    });
  } else {
    bind();
  }
})();
