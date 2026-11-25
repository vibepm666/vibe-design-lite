/**
 * 工作台壳 chrome 挂载
 *
 *   WA_APP_SHELL.mount(options)       — 注入侧栏导航 + 顶栏品牌（页内已有壳骨架时）
 *   WA_APP_SHELL.mountFrame(options)  — 用 JS 生成整壳（侧栏 + 顶栏 + 页脚），再塞入 [data-shell-content]
 *
 * 单页：nav 无 href → 按钮；多页：nav 带 href → 链接，active 高亮
 *
 * 页脚：对齐 Admin pro-footer；文案改 DEFAULT_FOOTER 即可全站统一。
 * options.footer = 字符串覆盖文案；false 关闭。
 */
(function () {
  "use strict";

  /** 壳页脚默认文案 / 首页链接（统一改这里） */
  var DEFAULT_FOOTER = "© VibePM 产品协作与设计资产分享平台";
  var DEFAULT_FOOTER_HREF = "https://www.vibepm.net";

  var cfg = null;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** 选中项：Light/Regular/Thin → Solid；未选中保持原样 */
  function iconClass(icon, solid) {
    var s = String(icon == null || icon === "" ? "fa-solid fa-circle" : icon);
    if (!solid) return s;
    return s
      .replace(/\bfa-light\b/g, "fa-solid")
      .replace(/\bfa-regular\b/g, "fa-solid")
      .replace(/\bfa-thin\b/g, "fa-solid");
  }

  function brandHtml(brand) {
    var href = esc(brand.href || "./index.html");
    var name = esc(brand.name || "Vibe Design");
    var icon = esc(brand.icon || "fa-solid fa-wand-magic-sparkles");
    var aria = esc(brand.ariaLabel || name + "，返回首页");
    return (
      '<a class="wa-app__brand" href="' +
      href +
      '" aria-label="' +
      aria +
      '">' +
      '<span class="wa-app__brand-mark" aria-hidden="true"><i class="' +
      icon +
      '"></i></span>' +
      '<span class="wa-app__brand-text">' +
      name +
      "</span>" +
      "</a>"
    );
  }

  function barBrandHtml(brand) {
    var href = esc(brand.href || "./index.html");
    var name = esc(brand.name || "Vibe Design");
    var icon = esc(brand.icon || "fa-solid fa-wand-magic-sparkles");
    var aria = esc(brand.ariaLabel || name + "，返回首页");
    return (
      '<a class="wa-app__bar-brand" href="' +
      href +
      '" aria-label="' +
      aria +
      '">' +
      '<span class="wa-app__brand-mark" aria-hidden="true"><i class="' +
      icon +
      '"></i></span>' +
      '<span class="wa-app__brand-text">' +
      name +
      "</span>" +
      "</a>"
    );
  }

  function navItemHtml(item, active) {
    var id = esc(item.id);
    var label = esc(item.label || item.id);
    var on = item.id === active;
    var icon = esc(iconClass(item.icon || "fa-solid fa-circle", on));
    var tipClass = ' class="wa-tip wa-tip--right' + (on ? " is-current" : "") + '"';
    var tipAttr = ' data-tip="' + label + '"';
    if (item.href) {
      return (
        '<a href="' +
        esc(item.href) +
        '" data-app-nav="' +
        id +
        '"' +
        tipClass +
        tipAttr +
        (on ? ' aria-current="page"' : "") +
        ">" +
        '<i class="' +
        icon +
        '" aria-hidden="true"></i>' +
        '<span class="wa-app__nav-label">' +
        label +
        "</span>" +
        "</a>"
      );
    }
    return (
      '<button type="button" data-app-nav="' +
      id +
      '"' +
      tipClass +
      tipAttr +
      (on ? ' aria-current="page"' : "") +
      ">" +
      '<i class="' +
      icon +
      '" aria-hidden="true"></i>' +
      '<span class="wa-app__nav-label">' +
      label +
      "</span>" +
      "</button>"
    );
  }

  function sideTipHtml(options) {
    if (options && options.sideTip === false) return "";
    var tip = (options && options.sideTip) || {};
    var body = esc(
      tip.text ||
        "访问 VibePM 官网可以获取更多配套设计资源与方案，包含可复用的主题、特效、案例模板等；"
    );
    var ctaLabel = esc(tip.cta || "访问网站");
    var ctaHref = esc(tip.href || "https://www.vibepm.net/");
    var deco = esc(tip.decoIcon || "fa-solid fa-palette");
    var aria = esc(tip.ariaLabel || "官网资源引导");
    return (
      '<aside class="wa-app__rail-tip" aria-label="' +
      aria +
      '">' +
      '<div class="wa-app__rail-tip-scene" aria-hidden="true">' +
      '<span class="wa-app__rail-tip-grid"></span>' +
      '<span class="wa-app__rail-tip-swatch is-1"></span>' +
      '<span class="wa-app__rail-tip-swatch is-2"></span>' +
      '<span class="wa-app__rail-tip-swatch is-3"></span>' +
      '<i class="' +
      deco +
      ' wa-app__rail-tip-deco"></i>' +
      "</div>" +
      '<div class="wa-app__rail-tip-body">' +
      '<p class="wa-app__rail-tip-text">' +
      body +
      "</p>" +
      '<a class="wa-app__rail-tip-cta" href="' +
      ctaHref +
      '" target="_blank" rel="noopener noreferrer">' +
      ctaLabel +
      "</a>" +
      "</div>" +
      "</aside>"
    );
  }

  function railHtml(options) {
    var brand = options.brand || {};
    var nav = options.nav || [];
    var active = options.active || (nav[0] && nav[0].id) || "";
    var label = esc(options.navLabel || "主导航");
    var items = nav
      .map(function (item) {
        return navItemHtml(item, active);
      })
      .join("");
    return (
      brandHtml(brand) +
      '<div class="wa-app__rail-block wa-app__rail-block--grow">' +
      '<p class="wa-app__label">' +
      label +
      "</p>" +
      '<div class="wa-app__rail-scroll">' +
      '<nav class="wa-app__nav" aria-label="' +
      label +
      '">' +
      items +
      "</nav>" +
      "</div>" +
      "</div>" +
      '<div class="wa-app__rail-block wa-app__rail-block--tip">' +
      sideTipHtml(options) +
      "</div>"
    );
  }

  function resolveActive(options) {
    var active = options.active;
    if (!active && options.root && options.root.getAttribute) {
      active = options.root.getAttribute("data-shell-page");
    }
    if (!active && options.nav && options.nav.length) active = options.nav[0].id;
    return active || "";
  }

  function footerHtml(options) {
    if (options && options.footer === false) return "";
    var text =
      options && typeof options.footer === "string" && options.footer
        ? options.footer
        : DEFAULT_FOOTER;
    var href =
      options && typeof options.footerHref === "string" && options.footerHref
        ? options.footerHref
        : DEFAULT_FOOTER_HREF;
    return (
      '<footer class="wa-app__footer">' +
      '<a href="' +
      esc(href) +
      '" target="_blank" rel="noopener noreferrer">' +
      esc(text) +
      "</a>" +
      "</footer>"
    );
  }

  function frameHtml(options, bodyInner) {
    var user = options.user || {};
    var avatar = esc(user.avatar || "./assets/images/avatar_01.jpg");
    var userName = esc(user.name || "王丽青");
    var userEmail = esc(user.email || "wanglq@vibepm.net");
    var title = esc(options.title || "");
    var titleIcon = esc(options.titleIcon || "fa-solid fa-table-cells");
    return (
      '<button type="button" class="wa-app__backdrop" data-rail-backdrop aria-label="关闭侧栏" hidden></button>' +
      '<aside class="wa-app__rail" id="wa-app-rail" data-app-rail aria-label="工作台导航"></aside>' +
      '<div class="wa-app__stage">' +
      '<header class="wa-app__bar">' +
      '<span data-app-bar-brand></span>' +
      '<h1 class="wa-app__bar-title">' +
      '<i class="' +
      titleIcon +
      '" data-app-title-icon aria-hidden="true"></i> ' +
      '<span data-app-title>' +
      title +
      "</span>" +
      "</h1>" +
      '<button type="button" class="wa-app__search-trigger wa-tip wa-tip--below" data-app-search-open data-tip="搜索页面" aria-label="搜索页面">' +
      '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
      '<span class="wa-app__search-trigger-text">搜索页面</span>' +
      '<kbd class="wa-app__search-kbd" data-app-search-kbd>Ctrl+K</kbd>' +
      "</button>" +
      '<div class="wa-app__actions">' +
      '<button type="button" class="wa-app__icon-btn wa-app__rail-toggle wa-tip wa-tip--below" data-rail-toggle data-tip="打开导航" aria-expanded="false" aria-controls="wa-app-rail" aria-label="打开导航">' +
      '<i class="fa-solid fa-bars" aria-hidden="true"></i>' +
      "</button>" +
      '<button type="button" class="wa-app__icon-btn wa-app__rail-collapse wa-tip wa-tip--below" data-rail-collapse data-tip="收起侧栏" aria-expanded="true" aria-controls="wa-app-rail" aria-label="收起侧栏">' +
      '<i class="fa-solid fa-table-columns" aria-hidden="true"></i>' +
      "</button>" +
      '<button type="button" class="wa-app__icon-btn wa-app__search-trigger--icon wa-tip wa-tip--below" data-app-search-open data-tip="搜索页面" aria-label="搜索页面">' +
      '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
      "</button>" +
      '<button type="button" class="wa-app__icon-btn wa-tip wa-tip--below" data-wa-theme-toggle data-tip="切换主题" aria-pressed="false" aria-label="切换主题">' +
      '<i class="fa-solid fa-moon" aria-hidden="true"></i>' +
      "</button>" +
      '<button type="button" class="wa-app__icon-btn wa-tip wa-tip--below" data-rail-primary data-tip="切换为主色导航" aria-pressed="false" aria-label="切换为主色导航">' +
      '<i class="fa-solid fa-fill-drip" aria-hidden="true"></i>' +
      "</button>" +
      '<a class="wa-app__icon-btn wa-app__icon-btn--badge wa-tip wa-tip--below" href="./shell-messages.html" data-app-messages data-tip="消息中心" aria-label="消息中心，5 条未读">' +
      '<i class="fa-solid fa-bell" aria-hidden="true"></i>' +
      '<span class="wa-app__badge" data-app-msg-badge aria-hidden="true">5</span>' +
      "</a>" +
      '<div class="wa-app__user wa-app__user--bar" data-user-menu>' +
      '<button type="button" class="wa-app__user-chip" data-user-menu-toggle aria-expanded="false" aria-haspopup="menu" aria-label="用户菜单">' +
      '<span class="wa-app__avatar" aria-hidden="true"><img src="' +
      avatar +
      '" alt="" /></span>' +
      '<span class="wa-app__user-chip-name">' +
      userName +
      "</span>" +
      '<span class="wa-app__user-caret" aria-hidden="true">' +
      '<i class="fa-solid fa-chevron-up"></i><i class="fa-solid fa-chevron-down"></i>' +
      "</span>" +
      "</button>" +
      '<div class="wa-app__user-panel wa-app__user-panel--bar" data-user-panel role="menu" hidden>' +
      '<div class="wa-app__user-panel-head">' +
      '<span class="wa-app__avatar wa-app__avatar--lg" aria-hidden="true"><img src="' +
      avatar +
      '" alt="" /></span>' +
      '<span class="wa-app__user-meta">' +
      '<span class="wa-app__user-name">' +
      userName +
      "</span>" +
      '<span class="wa-app__user-email">' +
      userEmail +
      "</span>" +
      "</span>" +
      "</div>" +
      '<div class="wa-app__user-menu" role="none">' +
      '<button type="button" class="wa-app__user-item" role="menuitem" data-user-action="profile"><i class="fa-solid fa-user" aria-hidden="true"></i><span>账号资料</span></button>' +
      '<button type="button" class="wa-app__user-item" role="menuitem" data-user-action="notify"><i class="fa-solid fa-bell" aria-hidden="true"></i><span>通知偏好</span></button>' +
      '<button type="button" class="wa-app__user-item" role="menuitem" data-user-action="appearance"><i class="fa-solid fa-palette" aria-hidden="true"></i><span>外观主题</span></button>' +
      '<button type="button" class="wa-app__user-item" role="menuitem" data-user-action="security"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i><span>账号安全</span></button>' +
      "</div>" +
      '<div class="wa-app__user-sep" role="separator"></div>' +
      '<button type="button" class="wa-app__user-item is-danger" role="menuitem" data-user-action="logout"><i class="fa-solid fa-power-off" aria-hidden="true"></i><span>退出登录</span></button>' +
      "</div>" +
      "</div>" +
      "</div>" +
      "</header>" +
      '<div class="wa-app__body" data-app-body>' +
      (bodyInner || "") +
      footerHtml(options) +
      "</div>" +
      "</div>"
    );
  }

  function mount(options) {
    options = options || {};
    cfg = options;
    options.active = resolveActive(options);

    var rail = document.querySelector("[data-app-rail]");
    if (rail) rail.innerHTML = railHtml(options);

    var barBrandHost = document.querySelector("[data-app-bar-brand]");
    if (barBrandHost) {
      barBrandHost.outerHTML = barBrandHtml(options.brand || {});
    }

    return cfg;
  }

  /**
   * 生成整壳：读取 root 内 [data-shell-content]，替换为侧栏+顶栏+业务区
   */
  function mountFrame(options) {
    options = options || {};
    var root =
      options.root ||
      document.querySelector("[data-wa-app]") ||
      document.getElementById("wa-app");
    if (!root) return null;

    options.root = root;
    options.active = resolveActive(options);

    var contentHost = root.querySelector("[data-shell-content]");
    var bodyInner = contentHost ? contentHost.innerHTML : root.innerHTML;

    var activeItem = null;
    (options.nav || []).forEach(function (item) {
      if (item.id === options.active) activeItem = item;
    });
    if (!options.title && activeItem) options.title = activeItem.label || "";
    if (!options.titleIcon && activeItem) {
      options.titleIcon = iconClass(activeItem.icon || "", true);
    }

    root.innerHTML = frameHtml(options, bodyInner);
    return mount(options);
  }

  function getConfig() {
    return cfg;
  }

  function getNavMap() {
    var map = {};
    if (!cfg || !cfg.nav) return map;
    cfg.nav.forEach(function (item) {
      map[item.id] = item;
    });
    return map;
  }

  window.WA_APP_SHELL = {
    mount: mount,
    mountFrame: mountFrame,
    getConfig: getConfig,
    getNavMap: getNavMap,
    iconClass: iconClass,
    DEFAULT_FOOTER: DEFAULT_FOOTER,
    DEFAULT_FOOTER_HREF: DEFAULT_FOOTER_HREF,
  };
})();
