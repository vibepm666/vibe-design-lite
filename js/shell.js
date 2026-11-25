/**
 * 工作台壳：配置 + mountFrame（侧栏/顶栏）+ 抽屉 / 用户菜单 / 搜索
 * 业务页：侧栏列出全部 shell 样板页（含详情 / 表单 / 空状态 / 无权限）
 * 项目列表 CRUD：shell-data.js
 */
(function () {
  "use strict";

  var root = document.querySelector("[data-wa-app]");
  if (!root || !window.WA_APP_SHELL) return;

  var page = root.getAttribute("data-shell-page") || "dashboard";

  var SHELL_CONFIG = {
    active: page,
    root: root,
    brand: {
      name: "Vibe Design",
      href: "./index.html",
      icon: "fa-solid fa-table-columns",
      ariaLabel: "Vibe Design，返回首页",
    },
    /* 页脚文案默认见 app-shell.js DEFAULT_FOOTER；改字符串覆盖，false 关闭 */
    footer: true,
    navLabel: "主导航",
    nav: [
      {
        id: "dashboard",
        label: "工作概览",
        icon: "fa-solid fa-chart-pie",
        href: "./shell-dashboard.html",
      },
      {
        id: "data",
        label: "数据列表",
        icon: "fa-solid fa-table-list",
        href: "./shell-data.html",
      },
      {
        id: "cards",
        label: "卡片列表",
        icon: "fa-solid fa-clone",
        href: "./shell-cards.html",
      },
      {
        id: "detail",
        label: "详情页面",
        icon: "fa-solid fa-file-lines",
        href: "./shell-detail.html?id=t1",
      },
      {
        id: "form",
        label: "表单页面",
        icon: "fa-solid fa-file-pen",
        href: "./shell-form.html?mode=create",
      },
      {
        id: "empty",
        label: "提示页面",
        icon: "fa-solid fa-lightbulb",
        href: "./shell-empty.html",
      },
      {
        id: "exception",
        label: "异常页面",
        icon: "fa-solid fa-triangle-exclamation",
        href: "./shell-exception.html",
      },
      {
        id: "messages",
        label: "消息中心",
        icon: "fa-solid fa-comments",
        href: "./shell-messages.html",
      },
      {
        id: "settings",
        label: "系统设置",
        icon: "fa-solid fa-gear",
        href: "./shell-settings.html",
      },
    ],
    user: {
      name: "王丽青",
      email: "wanglq@vibepm.net",
      avatar: "./assets/images/avatar_01.jpg",
    },
    sideTip: {
      text:
        "访问 VibePM 官网可以获取更多配套设计资源与方案，包含可复用的主题、特效、案例模板等；",
      cta: "访问网站",
      href: "https://www.vibepm.net/",
      decoIcon: "fa-solid fa-palette",
    },
  };

  /* 切页前先恢复收起 / 主色导航，避免首帧闪一下 */
  var preferRailCollapsed = false;
  var preferRailPrimary = false;
  try {
    preferRailCollapsed = window.localStorage.getItem("wa-app-rail-collapsed") === "1";
    preferRailPrimary = window.localStorage.getItem("wa-app-rail-primary") === "1";
  } catch (err) {}
  if (preferRailCollapsed) root.classList.add("is-rail-collapsed");
  if (preferRailPrimary) root.classList.add("is-rail-primary");

  WA_APP_SHELL.mountFrame(SHELL_CONFIG);

  if (window.WA_PAGE_LOADING) {
    WA_PAGE_LOADING.bind(root);
  }

  function esc(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function findNavItem(id) {
    for (var i = 0; i < SHELL_CONFIG.nav.length; i++) {
      if (SHELL_CONFIG.nav[i].id === id) return SHELL_CONFIG.nav[i];
    }
    return null;
  }

  /** 全局面包屑：工作台 / 当前页 [/ 附加段] */
  function mountCrumbs() {
    var panel = root.querySelector(".wa-app__panel");
    if (!panel) return;

    panel.querySelectorAll(".wa-shell-crumb, [data-shell-crumbs]").forEach(function (el) {
      el.parentNode.removeChild(el);
    });

    var current = findNavItem(page);
    var label = (current && current.label) || "当前页";
    var href = (current && current.href) || "#";
    var baseHref = String(href).split("?")[0];
    var extra = String(root.getAttribute("data-crumb-extra") || "").trim();

    var html =
      '<nav class="wa-crumbs" data-shell-crumbs aria-label="面包屑">' +
      '<a href="./shell-dashboard.html" class="wa-crumbs__home">' +
      '<i class="fa-solid fa-house" aria-hidden="true"></i>' +
      "工作台" +
      "</a>" +
      '<span class="wa-crumbs__sep" aria-hidden="true">/</span>';

    if (extra) {
      html +=
        '<a href="' +
        esc(baseHref) +
        '">' +
        esc(label) +
        "</a>" +
        '<span class="wa-crumbs__sep" aria-hidden="true">/</span>' +
        '<span class="wa-crumbs__current" aria-current="page" data-shell-crumb-current>' +
        esc(extra) +
        "</span>";
    } else {
      html +=
        '<span class="wa-crumbs__current" aria-current="page">' + esc(label) + "</span>";
    }

    html += "</nav>";
    panel.insertAdjacentHTML("afterbegin", html);
  }

  mountCrumbs();

  window.WA_SHELL = window.WA_SHELL || {};
  window.WA_SHELL.setCrumbExtra = function (text) {
    var value = String(text == null ? "" : text).trim();
    if (value) root.setAttribute("data-crumb-extra", value);
    else root.removeAttribute("data-crumb-extra");
    var cur = root.querySelector("[data-shell-crumb-current]");
    if (cur && value) cur.textContent = value;
    else mountCrumbs();
  };

  function tip(text, type) {
    var kind = type || "info";
    if (window.WA_MESSAGE && typeof window.WA_MESSAGE[kind] === "function") {
      window.WA_MESSAGE[kind](text);
    }
  }

  function navMap() {
    return WA_APP_SHELL.getNavMap() || {};
  }

  function setRailOpen(open) {
    root.classList.toggle("is-rail-open", open);
    var toggle = document.querySelector("[data-rail-toggle]");
    var backdrop = document.querySelector("[data-rail-backdrop]");
    if (toggle) {
      var railLabel = open ? "关闭导航" : "打开导航";
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", railLabel);
      toggle.setAttribute("data-tip", railLabel);
      var icon = toggle.querySelector("i");
      if (icon) {
        icon.className = open ? "fa-solid fa-xmark" : "fa-solid fa-bars";
        icon.setAttribute("aria-hidden", "true");
      }
    }
    if (backdrop) {
      if (open) backdrop.removeAttribute("hidden");
      else backdrop.setAttribute("hidden", "");
    }
  }

  var railCollapseTimer = null;

  function setRailCollapsed(collapsed, opts) {
    var animate = !opts || opts.animate !== false;
    var wasCollapsed = root.classList.contains("is-rail-collapsed");
    if (animate) root.classList.add("is-rail-anim");

    /* 收起过程隐藏 tip；展开直接去掉 collapsing */
    if (railCollapseTimer) {
      window.clearTimeout(railCollapseTimer);
      railCollapseTimer = null;
    }
    if (animate && collapsed && !wasCollapsed) {
      root.classList.add("is-rail-collapsing");
      railCollapseTimer = window.setTimeout(function () {
        root.classList.remove("is-rail-collapsing");
        railCollapseTimer = null;
      }, 260);
    } else {
      root.classList.remove("is-rail-collapsing");
    }

    root.classList.toggle("is-rail-collapsed", !!collapsed);
    document.documentElement.classList.toggle("wa-pref-rail-collapsed", !!collapsed);
    var btn = document.querySelector("[data-rail-collapse]");
    if (btn) {
      var collapseLabel = collapsed ? "展开侧栏" : "收起侧栏";
      btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
      btn.setAttribute("aria-label", collapseLabel);
      btn.setAttribute("data-tip", collapseLabel);
      btn.removeAttribute("title");
      var icon = btn.querySelector("i");
      if (icon) {
        /* 展开态 sidebar-flip，收起态 sidebar */
        icon.className = collapsed ? "fa-solid fa-table-columns" : "fa-solid fa-table-columns";
        icon.setAttribute("aria-hidden", "true");
      }
    }
    try {
      window.localStorage.setItem("wa-app-rail-collapsed", collapsed ? "1" : "0");
    } catch (err) {}
  }

  document.querySelectorAll("[data-rail-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setRailOpen(!root.classList.contains("is-rail-open"));
    });
  });

  document.querySelectorAll("[data-rail-collapse]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setRailCollapsed(!root.classList.contains("is-rail-collapsed"), { animate: true });
    });
  });

  function setRailPrimary(primary) {
    root.classList.toggle("is-rail-primary", !!primary);
    document.documentElement.classList.toggle("wa-pref-rail-primary", !!primary);
    var btn = document.querySelector("[data-rail-primary]");
    if (btn) {
      var label = primary ? "切换为浅色导航" : "切换为主色导航";
      btn.setAttribute("aria-pressed", primary ? "true" : "false");
      btn.setAttribute("aria-label", label);
      btn.setAttribute("data-tip", label);
      var icon = btn.querySelector("i");
      if (icon) {
        icon.className = primary ? "fa-solid fa-swatchbook" : "fa-solid fa-fill-drip";
        icon.setAttribute("aria-hidden", "true");
      }
    }
    try {
      window.localStorage.setItem("wa-app-rail-primary", primary ? "1" : "0");
    } catch (err) {}
  }

  document.querySelectorAll("[data-rail-primary]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setRailPrimary(!root.classList.contains("is-rail-primary"));
    });
  });

  /* 恢复偏好时不播过渡动画 */
  if (preferRailCollapsed) setRailCollapsed(true, { animate: false });
  if (preferRailPrimary) setRailPrimary(true);

  var backdrop = document.querySelector("[data-rail-backdrop]");
  if (backdrop) {
    backdrop.addEventListener("click", function () {
      setRailOpen(false);
    });
  }

  window.addEventListener("resize", function () {
    if (window.matchMedia("(min-width: 901px)").matches) setRailOpen(false);
  });

  /* 无 href 的导航仍走单页面板切换（兼容旧用法） */
  function activateNav(key) {
    var item = navMap()[key];
    if (item && item.href) {
      window.location.href = item.href;
      return;
    }
    var map = navMap();
    document.querySelectorAll("[data-app-nav]").forEach(function (el) {
      var navId = el.getAttribute("data-app-nav");
      var on = navId === key;
      var navItem = map[navId];
      el.classList.toggle("is-current", on);
      if (on) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
      var iconEl = el.querySelector("i");
      if (iconEl && navItem && WA_APP_SHELL.iconClass) {
        iconEl.className = WA_APP_SHELL.iconClass(navItem.icon || "fa-solid fa-circle", on);
      }
    });
    document.querySelectorAll("[data-app-panel]").forEach(function (panel) {
      var on = panel.getAttribute("data-app-panel") === key;
      if (on) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", "");
    });
    var titleEl = document.querySelector("[data-app-title]");
    var titleIconEl = document.querySelector("[data-app-title-icon]");
    if (titleEl) titleEl.textContent = (item && item.label) || "工作台";
    if (titleIconEl) {
      var rawIcon = (item && item.icon) || "fa-solid fa-chart-pie";
      titleIconEl.className = WA_APP_SHELL.iconClass
        ? WA_APP_SHELL.iconClass(rawIcon, true)
        : rawIcon;
      titleIconEl.setAttribute("aria-hidden", "true");
    }
    var cfg = WA_APP_SHELL.getConfig();
    if (cfg) cfg.active = key;
    setRailOpen(false);
  }

  document.querySelectorAll("[data-app-nav]").forEach(function (el) {
    if (el.tagName === "A" && el.getAttribute("href")) {
      el.addEventListener("click", function () {
        setRailOpen(false);
      });
      return;
    }
    el.addEventListener("click", function () {
      activateNav(el.getAttribute("data-app-nav"));
    });
  });

  /* —— 页面搜索面板（对齐 Admin pro-page-search） —— */
  var pageSearchState = {
    open: false,
    activeIndex: 0,
    filtered: [],
    scrollLocked: false,
    prevOverflow: "",
    prevPaddingRight: "",
    /* 键盘切换后忽略鼠标悬停回写，避免「选中被拉回」 */
    ignorePointer: false,
  };
  var pageSearchEls = null;

  function isMacPlatform() {
    var platform = navigator.platform || "";
    var ua = navigator.userAgent || "";
    return /Mac|iPhone|iPad|iPod/.test(platform) || /Mac OS X/.test(ua);
  }

  function pageSearchShortcutLabel() {
    return isMacPlatform() ? "⌘+K" : "Ctrl+K";
  }

  document.querySelectorAll("[data-app-search-kbd]").forEach(function (el) {
    el.textContent = pageSearchShortcutLabel();
  });

  function pageSearchItems() {
    var group = SHELL_CONFIG.navLabel || "主导航";
    return (SHELL_CONFIG.nav || [])
      .filter(function (item) {
        return item && item.href;
      })
      .map(function (item) {
        return {
          id: item.id,
          href: item.href,
          title: item.label || item.id,
          group: group,
          icon: item.icon || "fa-solid fa-circle",
        };
      });
  }

  function filterPageSearchItems(query) {
    var q = String(query || "")
      .trim()
      .toLowerCase();
    var list = pageSearchItems();
    if (!q) return list;
    return list.filter(function (item) {
      var hay = [item.title, item.group, item.id].join(" ").toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  function ensurePageSearchDom() {
    if (pageSearchEls) return pageSearchEls;
    var overlay = document.createElement("div");
    overlay.className = "wa-page-search-overlay";
    overlay.setAttribute("data-page-search-overlay", "");
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="wa-page-search-dialog" role="dialog" aria-modal="true" aria-label="搜索页面" data-page-search-dialog>' +
      '<div class="wa-page-search-panel">' +
      '<div class="wa-field wa-field--icon wa-page-search-field" role="search">' +
      '<i class="fa-solid fa-magnifying-glass wa-field__icon" aria-hidden="true"></i>' +
      '<input class="wa-field__input" type="text" placeholder="搜索页面" data-page-search-input data-wa-field-input autocomplete="off" aria-label="搜索页面" />' +
      '<button type="button" class="wa-field__clear" data-wa-field-clear aria-label="清空" aria-hidden="true">' +
      '<i class="fa-solid fa-circle-xmark" aria-hidden="true"></i></button>' +
      "</div>" +
      '<div class="wa-page-search-list" role="listbox" data-page-search-list></div>' +
      '<div class="wa-page-search-footer">' +
      '<span class="wa-page-search-hint"><span class="wa-page-search-hint-keys">' +
      '<button type="button" class="wa-page-search-hint-key" data-page-search-hint="enter" aria-label="选择" title="回车选择">' +
      '<i class="fa-solid fa-arrow-turn-down" aria-hidden="true"></i></button></span>' +
      '<span class="wa-page-search-hint-label">选择</span></span>' +
      '<span class="wa-page-search-hint"><span class="wa-page-search-hint-keys">' +
      '<button type="button" class="wa-page-search-hint-key" data-page-search-hint="up" aria-label="上一项" title="上一项">' +
      '<i class="fa-solid fa-arrow-up" aria-hidden="true"></i></button>' +
      '<button type="button" class="wa-page-search-hint-key" data-page-search-hint="down" aria-label="下一项" title="下一项">' +
      '<i class="fa-solid fa-arrow-down" aria-hidden="true"></i></button></span>' +
      '<span class="wa-page-search-hint-label">切换</span></span>' +
      '<span class="wa-page-search-hint"><span class="wa-page-search-hint-keys">' +
      '<button type="button" class="wa-page-search-hint-key wa-page-search-hint-key--text" data-page-search-hint="esc" aria-label="关闭" title="Esc 关闭">ESC</button></span>' +
      '<span class="wa-page-search-hint-label">关闭</span></span>' +
      "</div></div></div>";
    document.body.appendChild(overlay);

    pageSearchEls = {
      overlay: overlay,
      dialog: overlay.querySelector("[data-page-search-dialog]"),
      input: overlay.querySelector("[data-page-search-input]"),
      list: overlay.querySelector("[data-page-search-list]"),
      field: overlay.querySelector(".wa-page-search-field"),
    };

    /* bindClearable 对 root 用 querySelectorAll，须传祖先才能绑到自身 .wa-field */
    if (window.WA_FIELD && typeof WA_FIELD.bindClearable === "function") {
      WA_FIELD.bindClearable(overlay);
    }

    function isBackdropTarget(target) {
      if (!target || !overlay.contains(target)) return false;
      return !target.closest("[data-page-search-dialog]");
    }

    overlay.addEventListener("mousedown", function (e) {
      if (isBackdropTarget(e.target)) closePageSearch();
    });
    overlay.addEventListener("click", function (e) {
      if (isBackdropTarget(e.target)) closePageSearch();
    });
    pageSearchEls.input.addEventListener("input", function () {
      pageSearchState.activeIndex = 0;
      pageSearchState.ignorePointer = false;
      renderPageSearchList();
    });
    /* 用户真正移动鼠标后，才重新允许悬停改选中 */
    pageSearchEls.list.addEventListener("mousemove", function () {
      pageSearchState.ignorePointer = false;
    });
    /* 底部快捷键提示可点（原型演示） */
    overlay.querySelectorAll("[data-page-search-hint]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var action = btn.getAttribute("data-page-search-hint");
        if (action === "up") movePageSearchActive(-1);
        else if (action === "down") movePageSearchActive(1);
        else if (action === "enter") {
          goToPageSearchItem(pageSearchState.filtered[pageSearchState.activeIndex]);
        } else if (action === "esc") closePageSearch();
      });
    });
    return pageSearchEls;
  }

  function lockPageScroll() {
    if (pageSearchState.scrollLocked) return;
    var sbw = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    pageSearchState.prevOverflow = document.body.style.overflow;
    pageSearchState.prevPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (sbw > 0) document.body.style.paddingRight = sbw + "px";
    document.documentElement.classList.add("is-page-search-open");
    pageSearchState.scrollLocked = true;
  }

  function unlockPageScroll() {
    if (!pageSearchState.scrollLocked) return;
    document.body.style.overflow = pageSearchState.prevOverflow || "";
    document.body.style.paddingRight = pageSearchState.prevPaddingRight || "";
    document.documentElement.classList.remove("is-page-search-open");
    pageSearchState.scrollLocked = false;
  }

  function syncPageSearchActive() {
    var els = pageSearchEls || ensurePageSearchDom();
    var items = els.list.querySelectorAll(".wa-page-search-item");
    items.forEach(function (node, i) {
      var on = i === pageSearchState.activeIndex;
      node.classList.toggle("is-active", on);
      node.setAttribute("aria-selected", on ? "true" : "false");
    });
    var activeEl = els.list.querySelector(".wa-page-search-item.is-active");
    if (activeEl && typeof activeEl.scrollIntoView === "function") {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }

  function renderPageSearchList() {
    var els = ensurePageSearchDom();
    var q = els.input.value;
    pageSearchState.filtered = filterPageSearchItems(q);
    if (pageSearchState.activeIndex >= pageSearchState.filtered.length) {
      pageSearchState.activeIndex = Math.max(0, pageSearchState.filtered.length - 1);
    }
    if (!pageSearchState.filtered.length) {
      els.list.innerHTML = '<div class="wa-page-search-empty">未找到匹配页面</div>';
      return;
    }
    els.list.innerHTML = pageSearchState.filtered
      .map(function (item, index) {
        var icon = WA_APP_SHELL.iconClass ? WA_APP_SHELL.iconClass(item.icon, false) : item.icon;
        var active = index === pageSearchState.activeIndex ? " is-active" : "";
        return (
          '<button type="button" class="wa-page-search-item' +
          active +
          '" role="option" aria-selected="' +
          (index === pageSearchState.activeIndex ? "true" : "false") +
          '" data-page-search-index="' +
          index +
          '">' +
          '<i class="' +
          esc(icon) +
          ' wa-page-search-item-icon" aria-hidden="true"></i>' +
          '<span class="wa-page-search-item-meta">' +
          '<span class="wa-page-search-item-title">' +
          esc(item.title) +
          "</span>" +
          '<span class="wa-page-search-item-group">' +
          esc(item.group) +
          "</span>" +
          "</span>" +
          '<span class="wa-page-search-item-enter" aria-hidden="true">' +
          '<i class="fa-solid fa-arrow-turn-down"></i>' +
          "</span>" +
          "</button>"
        );
      })
      .join("");

    els.list.querySelectorAll("[data-page-search-index]").forEach(function (btn) {
      var idx = Number(btn.getAttribute("data-page-search-index"));
      btn.addEventListener("mouseenter", function () {
        if (pageSearchState.ignorePointer) return;
        pageSearchState.activeIndex = idx;
        syncPageSearchActive();
      });
      btn.addEventListener("click", function () {
        goToPageSearchItem(pageSearchState.filtered[idx]);
      });
    });

    syncPageSearchActive();
  }

  function openPageSearch() {
    closeAllUserMenus();
    var els = ensurePageSearchDom();
    pageSearchState.open = true;
    pageSearchState.activeIndex = 0;
    pageSearchState.ignorePointer = false;
    els.input.value = "";
    els.overlay.hidden = false;
    els.overlay.classList.add("is-open");
    els.overlay.setAttribute("aria-hidden", "false");
    lockPageScroll();
    renderPageSearchList();
    window.setTimeout(function () {
      try {
        els.input.focus({ preventScroll: true });
        els.input.select();
      } catch (err) {
        els.input.focus();
      }
    }, 0);
  }

  function closePageSearch() {
    if (!pageSearchState.open && !(pageSearchEls && pageSearchEls.overlay.classList.contains("is-open"))) {
      unlockPageScroll();
      return;
    }
    pageSearchState.open = false;
    pageSearchState.activeIndex = 0;
    if (pageSearchEls) {
      pageSearchEls.overlay.hidden = true;
      pageSearchEls.overlay.classList.remove("is-open");
      pageSearchEls.overlay.setAttribute("aria-hidden", "true");
      pageSearchEls.input.value = "";
      try {
        pageSearchEls.input.blur();
      } catch (err) {}
    }
    unlockPageScroll();
  }

  function goToPageSearchItem(item) {
    if (!item || !item.href) return;
    closePageSearch();
    var current = window.location.pathname.split("/").pop() || "";
    var target = String(item.href).replace(/^\.\//, "");
    var targetFile = target.split("?")[0];
    if (targetFile === current) return;
    window.location.href = item.href;
  }

  function movePageSearchActive(delta) {
    var total = pageSearchState.filtered.length;
    if (!total) return;
    pageSearchState.activeIndex = (pageSearchState.activeIndex + delta + total) % total;
    /* 键盘导航只改高亮，不重绘列表，避免悬停项立刻把选中拉回去 */
    pageSearchState.ignorePointer = true;
    syncPageSearchActive();
    var els = pageSearchEls;
    if (els && els.input) {
      try {
        els.input.focus({ preventScroll: true });
      } catch (err) {
        try {
          els.input.focus();
        } catch (err2) {}
      }
    }
  }

  function pageSearchKeyId(e) {
    /* 优先用 code：中文输入法下 key 常为 Process，但 code 仍是 ArrowDown */
    var code = String(e.code || "");
    var key = String(e.key || "");
    if (code === "ArrowDown" || key === "ArrowDown" || key === "Down") return "down";
    if (code === "ArrowUp" || key === "ArrowUp" || key === "Up") return "up";
    if (code === "Enter" || code === "NumpadEnter" || key === "Enter") return "enter";
    if (code === "Escape" || key === "Escape" || key === "Esc") return "esc";
    return "";
  }

  function onPageSearchKeydown(e) {
    if (!pageSearchState.open) return;
    var id = pageSearchKeyId(e);
    if (!id) return;
    /* 仅在组字中跳过；勿用 keyCode===229（微软拼音未组字时方向键也会是 229） */
    if (e.isComposing) return;
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    if (id === "down") movePageSearchActive(1);
    else if (id === "up") movePageSearchActive(-1);
    else if (id === "enter") goToPageSearchItem(pageSearchState.filtered[pageSearchState.activeIndex]);
    else if (id === "esc") closePageSearch();
  }

  document.querySelectorAll("[data-app-search-open]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      openPageSearch();
    });
  });

  /* window 捕获阶段：比 document 更靠前，避免被其它监听抢走 */
  window.addEventListener(
    "keydown",
    function (e) {
      if (!pageSearchState.open) return;
      onPageSearchKeydown(e);
    },
    true
  );

  window.addEventListener("keydown", function (e) {
    if (!(e.metaKey || e.ctrlKey)) return;
    if (String(e.key || "").toLowerCase() !== "k" && String(e.code || "") !== "KeyK") return;
    e.preventDefault();
    if (pageSearchState.open) closePageSearch();
    else openPageSearch();
  });

  var userActionHref = {
    profile: "./shell-settings.html?tab=profile",
    notify: "./shell-settings.html?tab=notify",
    appearance: "./shell-settings.html?tab=appearance",
    security: "./shell-settings.html?tab=security",
  };

  function closeAllUserMenus() {
    document.querySelectorAll("[data-user-menu].is-open").forEach(function (wrap) {
      wrap.classList.remove("is-open");
      var toggle = wrap.querySelector("[data-user-menu-toggle]");
      var panel = wrap.querySelector("[data-user-panel]");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
      if (panel) panel.setAttribute("hidden", "");
    });
  }

  function openUserMenu(wrap) {
    closeAllUserMenus();
    if (!wrap) return;
    wrap.classList.add("is-open");
    var toggle = wrap.querySelector("[data-user-menu-toggle]");
    var panel = wrap.querySelector("[data-user-panel]");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    if (panel) panel.removeAttribute("hidden");
  }

  document.querySelectorAll("[data-user-menu]").forEach(function (wrap) {
    var toggle = wrap.querySelector("[data-user-menu-toggle]");
    if (!toggle) return;
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (wrap.classList.contains("is-open")) closeAllUserMenus();
      else openUserMenu(wrap);
    });
    wrap.querySelectorAll("[data-user-action]").forEach(function (item) {
      item.addEventListener("click", function () {
        var key = item.getAttribute("data-user-action");
        closeAllUserMenus();
        if (key === "logout") {
          function doLogout() {
            tip("已退出登录");
            window.setTimeout(function () {
              window.location.href = "./login.html";
            }, 400);
          }
          if (window.WA_CONFIRM && typeof window.WA_CONFIRM.open === "function") {
            WA_CONFIRM.open({
              title: "确认退出登录？",
              message: "退出后需要重新登录才能继续使用工作台。",
              confirmText: "退出登录",
              cancelText: "取消",
              danger: true,
            }).then(function (ok) {
              if (ok) doLogout();
            });
          } else {
            doLogout();
          }
          return;
        }
        var href = userActionHref[key];
        if (href) {
          window.location.href = href;
          return;
        }
        tip(key);
      });
    });
  });

  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("[data-user-menu]")) return;
    closeAllUserMenus();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" && e.key !== "Esc") return;
    if (pageSearchState.open) return;
    closeAllUserMenus();
  });

  /* 收起态与交互绑好后再显示，避免宽栏闪一下 */
  document.body.classList.add("is-shell-ready");
  if (window.WA_PAGE_LOADING) {
    WA_PAGE_LOADING.startIfPending();
  }
  /* 下一帧再允许侧栏过渡，避免首屏/切页恢复时动画闪动 */
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      root.classList.add("is-rail-anim");
    });
  });
})();
