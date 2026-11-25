/**
 * 工作台 · 项目列表：内存样例 + 分页渲染 + 新建/编辑写回
 */
(function () {
  "use strict";

  var PAGE_SIZE = 15;

  function tip(text, type) {
    var kind = type || "info";
    if (window.WA_MESSAGE && typeof window.WA_MESSAGE[kind] === "function") {
      window.WA_MESSAGE[kind](text);
      return;
    }
    if (window.WA_MESSAGE && typeof window.WA_MESSAGE.info === "function") {
      window.WA_MESSAGE.info(text);
    }
  }

  function confirmDanger(opts) {
    if (window.WA_CONFIRM && typeof window.WA_CONFIRM.open === "function") {
      return WA_CONFIRM.open(opts);
    }
    return Promise.resolve(window.confirm(opts.message || opts.title || "确认？"));
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function nowStamp() {
    var d = new Date();
    function pad(n) {
      return n < 10 ? "0" + n : String(n);
    }
    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      " " +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes())
    );
  }

  /** 列表展示 "YYYY-MM-DD HH:mm" → datetime-local "YYYY-MM-DDTHH:mm" */
  function toDatetimeLocal(stamp) {
    var s = String(stamp || "").trim();
    if (!s) return "";
    return s.replace(" ", "T").slice(0, 16);
  }

  /** datetime-local → 列表展示 */
  function fromDatetimeLocal(val) {
    var s = String(val || "").trim();
    if (!s) return "";
    return s.replace("T", " ").slice(0, 16);
  }

  function statusBadgeClass(status) {
    if (status === "已完成") return "wa-badge wa-badge--ok";
    if (status === "待启动") return "wa-badge wa-badge--warn";
    return "wa-badge wa-badge--run";
  }

  /* 类型：官网 / 活动 / 落地页 / 产品 / 工具 / 文档 / 表单 / 门户 / 资源 / 专题 / 展示 / 原型 */
  var SEED = [
    { name: "品牌官网改版", type: "官网", city: "上海", owner: "王立群", priority: "高", progress: "68", status: "进行中", updated: "2026-11-20 14:30" },
    { name: "双十一活动页", type: "活动", city: "杭州", owner: "李晓雯", priority: "中", progress: "12", status: "待启动", updated: "2026-11-18 09:15" },
    { name: "小工具页模板", type: "工具", city: "深圳", owner: "陈可", priority: "低", progress: "100", status: "已完成", updated: "2026-11-12 15:10" },
    { name: "资源包上架", type: "资源", city: "北京", owner: "赵宁", priority: "高", progress: "54", status: "进行中", updated: "2026-11-21 11:00" },
    { name: "会员中心改版", type: "产品", city: "广州", owner: "周倩", priority: "高", progress: "41", status: "进行中", updated: "2026-11-19 18:05" },
    { name: "帮助文档站点", type: "文档", city: "成都", owner: "孙浩", priority: "中", progress: "100", status: "已完成", updated: "2026-11-08 09:45" },
    { name: "春季促销落地页", type: "活动", city: "南京", owner: "吴佳", priority: "中", progress: "8", status: "待启动", updated: "2026-11-17 12:15" },
    { name: "APP 下载页", type: "落地页", city: "武汉", owner: "郑宇", priority: "高", progress: "73", status: "进行中", updated: "2026-11-20 14:30" },
    { name: "合作伙伴门户", type: "门户", city: "苏州", owner: "冯蕾", priority: "低", progress: "100", status: "已完成", updated: "2026-11-05 11:20" },
    { name: "内部门禁原型", type: "原型", city: "西安", owner: "韩雪", priority: "中", progress: "62", status: "进行中", updated: "2026-11-16 08:30" },
    { name: "设计资源库迭代", type: "资源", city: "上海", owner: "曹明", priority: "中", progress: "18", status: "待启动", updated: "2026-11-15 17:50" },
    { name: "报价计算器", type: "工具", city: "杭州", owner: "邓岚", priority: "低", progress: "100", status: "已完成", updated: "2026-11-03 16:40" },
    { name: "活动报名表单", type: "表单", city: "深圳", owner: "蒋峰", priority: "高", progress: "47", status: "进行中", updated: "2026-11-19 18:05" },
    { name: "品牌故事专题", type: "专题", city: "北京", owner: "沈悦", priority: "中", progress: "5", status: "待启动", updated: "2026-11-14 13:25" },
    { name: "客户案例墙", type: "展示", city: "广州", owner: "姚鑫", priority: "低", progress: "100", status: "已完成", updated: "2026-11-01 10:05" },
  ];

  var EXTRA = [
    ["官网导航改版", "官网", "上海", "林舟", "中"],
    ["黑五专题页", "活动", "杭州", "何敏", "高"],
    ["线索收集表", "表单", "成都", "许晴", "中"],
    ["知识库迁移", "文档", "北京", "马超", "低"],
    ["渠道落地页 A", "落地页", "深圳", "唐宁", "高"],
    ["渠道落地页 B", "落地页", "广州", "蒋一", "中"],
    ["运营数据看板", "产品", "上海", "卢方", "高"],
    ["客服话术库", "资源", "武汉", "程远", "低"],
    ["试用申请页", "落地页", "南京", "白露", "中"],
    ["年终汇报页", "专题", "西安", "顾言", "中"],
    ["插件下载中心", "门户", "苏州", "沈川", "低"],
    ["邀请裂变页", "活动", "杭州", "叶岚", "高"],
    ["合同模板库", "资源", "北京", "金硕", "中"],
    ["灰度发布页", "产品", "深圳", "周昂", "高"],
    ["FAQ 聚合站", "文档", "成都", "苏未", "低"],
    ["城市分站样板", "官网", "重庆", "任可", "中"],
    ["直播预约页", "活动", "上海", "方晴", "高"],
    ["积分商城壳", "产品", "广州", "丁夏", "中"],
    ["埋点说明页", "文档", "杭州", "裴野", "低"],
    ["招聘专题", "专题", "北京", "安然", "中"],
    ["合作申请表", "表单", "深圳", "莫凡", "中"],
    ["版本对比页", "落地页", "武汉", "纪恒", "高"],
    ["物料中心", "资源", "南京", "温乔", "低"],
    ["试点城市页", "官网", "苏州", "齐衡", "中"],
    ["峰会报名", "活动", "上海", "夏侯", "高"],
    ["权限说明", "文档", "北京", "柳青", "低"],
    ["续费引导页", "落地页", "杭州", "欧阳明", "高"],
    ["样板间专题", "专题", "成都", "霍然", "中"],
    ["工单入口页", "门户", "广州", "言蹊", "中"],
    ["Demo 预约", "表单", "深圳", "云舒", "高"],
    ["开源镜像页", "资源", "西安", "凌川", "低"],
    ["校园合作", "专题", "南京", "楚天", "中"],
    ["迁移手册", "文档", "武汉", "江岚", "低"],
  ];

  /* 类型前缀 + 6 位：YYMM(年月) + 两位流水（同类型同月按更新时间递增） */
  var TYPE_PREFIX = {
    官网: "GW",
    活动: "HD",
    落地页: "LD",
    产品: "CP",
    工具: "GJ",
    文档: "WD",
    表单: "BD",
    门户: "MH",
    资源: "ZY",
    专题: "ZT",
    展示: "ZS",
    原型: "YX",
  };

  function prefixForType(type) {
    return TYPE_PREFIX[String(type || "").trim()] || "PJ";
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function yymmFromStamp(stamp) {
    var s = String(stamp || "").trim();
    var m = s.match(/^(\d{4})-(\d{2})/);
    if (m) return m[1].slice(2) + m[2];
    var d = new Date();
    return String(d.getFullYear()).slice(2) + pad2(d.getMonth() + 1);
  }

  function byUpdatedDesc(a, b) {
    var c = String(b.updated || "").localeCompare(String(a.updated || ""));
    if (c) return c;
    return String(a.id || "").localeCompare(String(b.id || ""));
  }

  function byUpdatedAsc(a, b) {
    var c = String(a.updated || "").localeCompare(String(b.updated || ""));
    if (c) return c;
    return String(a.id || "").localeCompare(String(b.id || ""));
  }

  /** 按「类型 + 年月」分组，更新时间升序赋 01、02… 流水 */
  function assignBizCodes(list) {
    var counters = {};
    list
      .slice()
      .sort(byUpdatedAsc)
      .forEach(function (item) {
        var prefix = prefixForType(item.type);
        var yymm = yymmFromStamp(item.updated);
        var key = prefix + yymm;
        var seq = (counters[key] || 0) + 1;
        if (seq > 99) seq = 99;
        counters[key] = seq;
        item.code = prefix + yymm + pad2(seq);
      });
  }

  function cloneItem(raw, id, code) {
    return {
      id: id,
      code: code || raw.code || "",
      name: raw.name,
      type: raw.type,
      city: raw.city,
      owner: raw.owner,
      priority: raw.priority || "中",
      progress: String(raw.progress != null ? raw.progress : "0"),
      status: raw.status || "进行中",
      updated: raw.updated || nowStamp(),
    };
  }

  function buildStore() {
    var list = [];
    var i;
    for (i = 0; i < SEED.length; i++) {
      list.push(cloneItem(SEED[i], "p" + (i + 1)));
    }
    var statuses = ["进行中", "待启动", "已完成"];
    for (i = 0; i < EXTRA.length; i++) {
      var e = EXTRA[i];
      var day = 1 + ((i * 3) % 20);
      var hour = 8 + (i % 10);
      var min = (i * 7) % 60;
      function pad(n) {
        return n < 10 ? "0" + n : String(n);
      }
      list.push(
        cloneItem(
          {
            name: e[0],
            type: e[1],
            city: e[2],
            owner: e[3],
            priority: e[4],
            progress: String((i * 13) % 101),
            status: statuses[i % 3],
            updated: "2026-11-" + pad(day) + " " + pad(hour) + ":" + pad(min),
          },
          "p" + (SEED.length + i + 1)
        )
      );
    }
    assignBizCodes(list);
    list.sort(byUpdatedDesc);
    return list;
  }

  var projectModal = document.getElementById("project-modal");
  if (!projectModal) return;

  var projectTitle = document.getElementById("project-modal-title");
  var projectSubmit = document.getElementById("project-submit");
  var projectViewEdit = document.getElementById("project-view-edit");
  var projectForm = document.getElementById("project-form");
  var projectView = projectModal.querySelector("[data-project-view]");
  var statusModal = document.getElementById("status-modal");
  var batchStatus = document.getElementById("batch-status");
  var statusSubmit = document.getElementById("status-submit");
  var tbody = document.querySelector("[data-kit-table-body]");
  var filterInput = document.querySelector("[data-shell-project-filter]");
  var filterStatus = document.querySelector("[data-shell-filter-status]");
  var filterType = document.querySelector("[data-shell-filter-type]");
  var filterPriority = document.querySelector("[data-shell-filter-priority]");
  var filterReset = document.querySelector("[data-shell-filter-reset]");
  var pageInfo = document.querySelector("[data-shell-page-info]");
  var pageControls = document.querySelector("[data-shell-page-controls]");

  var store = buildStore();
  var page = 1;
  var filterQuery = "";
  var filterStatusVal = "";
  var filterTypeVal = "";
  var filterPriorityVal = "";
  var editingId = null;
  var viewingId = null;
  var rowActionsBound = false;
  /* 跨页勾选：以项目 id 为键 */
  var selectedMap = {};
  var selectionEl = document.querySelector("[data-shell-selection]");
  var selectionCountEl = document.querySelector("[data-shell-selection-count]");
  var clearSelectionBtn = document.querySelector("[data-shell-clear-selection]");
  var kitTable = document.querySelector("[data-kit-table]");

  var projectFields = {
    name: document.getElementById("project-name"),
    type:
      (window.WA_COMBO && window.WA_COMBO.getNativeSelect("project-type")) ||
      document.querySelector("#project-form select[name='type']"),
    city: document.getElementById("project-city"),
    owner: document.getElementById("project-owner"),
    priority:
      (window.WA_COMBO && window.WA_COMBO.getNativeSelect("project-priority")) ||
      document.querySelector("#project-form select[name='priority']"),
    progress: document.getElementById("project-progress"),
    status:
      (window.WA_COMBO && window.WA_COMBO.getNativeSelect("project-status")) ||
      document.querySelector("#project-form select[name='status']"),
    updated: document.getElementById("project-updated"),
  };

  function setFieldValue(el, value) {
    if (!el) return;
    el.value = value == null ? "" : String(value);
    if (el.tagName === "SELECT") {
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (el.type === "range" && window.WA_SLIDER && typeof window.WA_SLIDER.sync === "function") {
      window.WA_SLIDER.sync(el);
    }
    if (el.type === "datetime-local" || el.type === "date" || el.type === "time") {
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function setViewField(key, htmlOrText, asHtml) {
    if (!projectView) return;
    var el = projectView.querySelector('[data-view-field="' + key + '"]');
    if (!el) return;
    if (asHtml) el.innerHTML = htmlOrText;
    else el.textContent = htmlOrText;
  }

  function fillProjectView(data) {
    data = data || {};
    var progress = String(data.progress != null && data.progress !== "" ? data.progress : "0").replace(
      /%/g,
      ""
    );
    var status = String(data.status || "进行中").trim() || "进行中";
    setViewField("name", data.name || "—");
    setViewField("type", data.type || "—");
    setViewField("city", data.city || "—");
    setViewField("owner", data.owner || "—");
    setViewField("priority", data.priority || "—");
    setViewField("progress", progress + "%");
    setViewField(
      "status",
      '<span class="' + statusBadgeClass(status) + '">' + esc(status) + "</span>",
      true
    );
    setViewField("updated", data.updated || "—");
  }

  function setProjectMode(mode) {
    projectModal.setAttribute("data-project-mode", mode);
    var isView = mode === "view";
    if (projectView) {
      if (isView) projectView.removeAttribute("hidden");
      else projectView.setAttribute("hidden", "");
    }
    if (projectForm) {
      if (isView) projectForm.setAttribute("hidden", "");
      else projectForm.removeAttribute("hidden");
    }
    if (projectTitle) {
      projectTitle.textContent =
        mode === "create" ? "新建项目" : mode === "edit" ? "编辑项目" : "查看项目";
    }
    if (projectSubmit) {
      if (isView) projectSubmit.setAttribute("hidden", "");
      else {
        projectSubmit.removeAttribute("hidden");
        projectSubmit.textContent = mode === "edit" ? "保存" : "创建";
      }
    }
    if (projectViewEdit) {
      if (isView) projectViewEdit.removeAttribute("hidden");
      else projectViewEdit.setAttribute("hidden", "");
    }
    var cancelBtn = projectModal.querySelector(".wa-modal__footer [data-modal-close]");
    if (cancelBtn) cancelBtn.textContent = isView ? "关闭" : "取消";
  }

  function fillProjectForm(data) {
    data = data || {};
    setFieldValue(projectFields.name, data.name || "");
    setFieldValue(projectFields.type, data.type || "");
    setFieldValue(projectFields.city, data.city || "");
    setFieldValue(projectFields.owner, data.owner || "");
    setFieldValue(projectFields.priority, data.priority || "中");
    setFieldValue(
      projectFields.progress,
      data.progress != null && data.progress !== "" ? data.progress : "0"
    );
    setFieldValue(projectFields.status, data.status || "进行中");
    setFieldValue(projectFields.updated, toDatetimeLocal(data.updated || ""));
  }

  function readFormProject() {
    var updatedRaw = projectFields.updated
      ? String(projectFields.updated.value || "").trim()
      : "";
    return {
      name: projectFields.name ? String(projectFields.name.value || "").trim() : "",
      type: projectFields.type ? String(projectFields.type.value || "").trim() : "",
      city: projectFields.city ? String(projectFields.city.value || "").trim() : "",
      owner: projectFields.owner ? String(projectFields.owner.value || "").trim() : "",
      priority: projectFields.priority
        ? String(projectFields.priority.value || "中").trim()
        : "中",
      progress: projectFields.progress
        ? String(projectFields.progress.value || "0").trim()
        : "0",
      status: projectFields.status
        ? String(projectFields.status.value || "进行中").trim()
        : "进行中",
      updated: fromDatetimeLocal(updatedRaw) || nowStamp(),
    };
  }

  function filteredStore() {
    var q = String(filterQuery || "").trim().toLowerCase();
    return store
      .filter(function (item) {
        if (filterStatusVal && String(item.status) !== filterStatusVal) return false;
        if (filterTypeVal && String(item.type) !== filterTypeVal) return false;
        if (filterPriorityVal && String(item.priority) !== filterPriorityVal) return false;
        if (!q) return true;
        return (
          String(item.code || "").toLowerCase().indexOf(q) >= 0 ||
          String(item.name).toLowerCase().indexOf(q) >= 0 ||
          String(item.city).toLowerCase().indexOf(q) >= 0 ||
          String(item.owner).toLowerCase().indexOf(q) >= 0
        );
      })
      .sort(byUpdatedDesc);
  }

  function pageCount(total) {
    return Math.max(1, Math.ceil(total / PAGE_SIZE));
  }

  function findById(id) {
    for (var i = 0; i < store.length; i++) {
      if (store[i].id === id) return store[i];
    }
    return null;
  }

  function opsHtml() {
    return (
      '<td class="wa-table__ops" data-col="ops">' +
      '<div class="wa-dropdown" data-wa-dropdown>' +
      '<button type="button" class="wa-btn wa-btn--ghost wa-dropdown__trigger" data-wa-dropdown-trigger aria-expanded="false" aria-haspopup="menu" aria-label="更多">' +
      '<i class="fa-regular fa-ellipsis" aria-hidden="true"></i>' +
      "</button>" +
      '<ul class="wa-dropdown__menu wa-dropdown__menu--end" role="menu" hidden data-wa-dropdown-menu>' +
      '<li role="none"><button type="button" class="wa-dropdown__item" role="menuitem" data-shell-row="view"><i class="fa-regular fa-eye" aria-hidden="true"></i> 查看</button></li>' +
      '<li role="none"><button type="button" class="wa-dropdown__item" role="menuitem" data-shell-row="edit"><i class="fa-regular fa-pen" aria-hidden="true"></i> 编辑</button></li>' +
      '<li role="none"><hr class="wa-dropdown__sep" /></li>' +
      '<li role="none"><button type="button" class="wa-dropdown__item wa-dropdown__item--danger" role="menuitem" data-shell-row="delete"><i class="fa-regular fa-trash" aria-hidden="true"></i> 删除</button></li>' +
      "</ul></div></td>"
    );
  }

  function applyRow(tr, data) {
    if (!tr || !data) return;
    var name = String(data.name || "").trim();
    var type = String(data.type || "").trim();
    var city = String(data.city || "").trim();
    var owner = String(data.owner || "").trim();
    var priority = String(data.priority || "中").trim() || "中";
    var progress = String(data.progress != null ? data.progress : "0").replace(/%/g, "");
    var status = String(data.status || "进行中").trim() || "进行中";
    var updated = String(data.updated || nowStamp()).trim() || nowStamp();
    var id = data.id || tr.getAttribute("data-project-id") || "";
    var code = String(data.code || "").trim();

    tr.setAttribute("data-project-id", id);
    tr.setAttribute("data-project-code", code);
    tr.setAttribute("data-project-name", name);
    tr.setAttribute("data-project-type", type);
    tr.setAttribute("data-project-city", city);
    tr.setAttribute("data-project-owner", owner);
    tr.setAttribute("data-project-priority", priority);
    tr.setAttribute("data-project-progress", progress);
    tr.setAttribute("data-project-status", status);
    tr.setAttribute("data-project-updated", updated);

    var check = tr.querySelector('.wa-table__check input[type="checkbox"]');
    if (check) check.setAttribute("aria-label", "选择" + name);

    var indexEl = tr.querySelector('[data-col="index"]');
    if (indexEl) indexEl.textContent = code || "—";
    var nameEl = tr.querySelector('[data-col="name"]');
    if (nameEl) nameEl.textContent = name;
    var statusEl = tr.querySelector('[data-col="status"]');
    if (statusEl) {
      statusEl.innerHTML =
        '<span class="' + statusBadgeClass(status) + '">' + esc(status) + "</span>";
    }
    var typeEl = tr.querySelector('[data-col="type"]');
    if (typeEl) typeEl.textContent = type;
    var cityEl = tr.querySelector('[data-col="city"]');
    if (cityEl) cityEl.textContent = city;
    var ownerEl = tr.querySelector('[data-col="owner"]');
    if (ownerEl) ownerEl.textContent = owner;
    var priorityEl = tr.querySelector('[data-col="priority"]');
    if (priorityEl) priorityEl.textContent = priority;
    var progressEl = tr.querySelector('[data-col="progress"]');
    if (progressEl) progressEl.textContent = progress + "%";
    var updatedEl = tr.querySelector('[data-col="updated"]');
    if (updatedEl) updatedEl.textContent = updated;

    var menu = tr.querySelector("[data-wa-dropdown-menu]");
    if (menu) {
      menu.setAttribute("data-project-id", id);
      [
        "code",
        "name",
        "type",
        "city",
        "owner",
        "priority",
        "progress",
        "status",
        "updated",
      ].forEach(function (key) {
        menu.setAttribute("data-project-" + key, tr.getAttribute("data-project-" + key) || "");
      });
    }
  }

  function buildRow(data) {
    var tr = document.createElement("tr");
    tr.innerHTML =
      '<td class="wa-table__check"><label class="wa-check"><input type="checkbox" aria-label="选择" /></label></td>' +
      '<td class="wa-table__index" data-col="index" data-label="编号"></td>' +
      '<td data-col="name" data-label="名称"></td>' +
      '<td data-col="type" data-label="类型"></td>' +
      '<td data-col="city" data-label="城市"></td>' +
      '<td data-col="owner" data-label="负责人"></td>' +
      '<td data-col="status" data-label="状态"></td>' +
      '<td data-col="priority" data-label="优先级"></td>' +
      '<td data-col="progress" data-label="进度"></td>' +
      '<td data-col="updated" data-label="最后更新"></td>' +
      opsHtml();
    applyRow(tr, data);
    return tr;
  }

  function selectedCount() {
    return Object.keys(selectedMap).length;
  }

  function updateSelectionHint() {
    var n = selectedCount();
    if (selectionCountEl) selectionCountEl.textContent = String(n);
    if (selectionEl) {
      if (n > 0) selectionEl.removeAttribute("hidden");
      else selectionEl.setAttribute("hidden", "");
    }
  }

  function syncSelectionFromDom() {
    if (!tbody) return;
    Array.prototype.forEach.call(tbody.querySelectorAll("tr"), function (tr) {
      var id = tr.getAttribute("data-project-id");
      var cb = tr.querySelector('td.wa-table__check input[type="checkbox"]');
      if (!id || !cb) return;
      if (cb.checked && !cb.disabled) selectedMap[id] = true;
      else delete selectedMap[id];
    });
    updateSelectionHint();
  }

  function applySelectionToDom() {
    if (!tbody) return;
    Array.prototype.forEach.call(tbody.querySelectorAll("tr"), function (tr) {
      var id = tr.getAttribute("data-project-id");
      var cb = tr.querySelector('td.wa-table__check input[type="checkbox"]');
      var on = !!(id && selectedMap[id]);
      if (cb) cb.checked = on;
      tr.classList.toggle("is-selected", on);
    });
  }

  function clearSelection() {
    selectedMap = {};
    applySelectionToDom();
    refreshTableApi();
    updateSelectionHint();
  }

  function nextBizCode(type, stamp) {
    var prefix = prefixForType(type);
    var yymm = yymmFromStamp(stamp || nowStamp());
    var head = prefix + yymm;
    var max = 0;
    store.forEach(function (x) {
      if (!x.code || x.code.indexOf(head) !== 0 || x.code.length !== head.length + 2) return;
      var n = parseInt(x.code.slice(head.length), 10);
      if (!isNaN(n) && n > max) max = n;
    });
    return head + pad2(Math.min(99, max + 1));
  }

  function refreshTableApi() {
    var table = document.querySelector("[data-kit-table]");
    if (!table || !window.WA_TABLE || typeof window.WA_TABLE.get !== "function") return;
    var inst = WA_TABLE.get(table);
    if (inst && typeof inst.refresh === "function") inst.refresh();
  }

  function renderPager(total, pageNum, pages) {
    if (pageInfo) {
      pageInfo.textContent = "共 " + total + " 条 · 第 " + pageNum + " / " + pages + " 页";
    }
    if (!pageControls) return;
    pageControls.innerHTML = "";

    function addBtn(label, targetPage, opts) {
      opts = opts || {};
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wa-pagination__btn" + (opts.active ? " is-active" : "");
      if (opts.disabled) btn.disabled = true;
      if (opts.aria) btn.setAttribute("aria-label", opts.aria);
      if (opts.active) btn.setAttribute("aria-current", "page");
      if (opts.html) btn.innerHTML = opts.html;
      else btn.textContent = label;
      if (!opts.disabled && targetPage) {
        btn.addEventListener("click", function () {
          goPage(targetPage);
        });
      }
      pageControls.appendChild(btn);
    }

    addBtn("", pageNum - 1, {
      disabled: pageNum <= 1,
      aria: "上一页",
      html: '<i class="fa-regular fa-chevron-left" aria-hidden="true"></i>',
    });

    var windowSize = 3;
    var start = Math.max(1, pageNum - 1);
    var end = Math.min(pages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);

    if (start > 1) {
      addBtn("1", 1, { active: pageNum === 1 });
      if (start > 2) {
        var dots = document.createElement("span");
        dots.className = "wa-pagination__ellipsis";
        dots.setAttribute("aria-hidden", "true");
        dots.textContent = "…";
        pageControls.appendChild(dots);
      }
    }

    for (var p = start; p <= end; p++) {
      addBtn(String(p), p, { active: p === pageNum });
    }

    if (end < pages) {
      if (end < pages - 1) {
        var dots2 = document.createElement("span");
        dots2.className = "wa-pagination__ellipsis";
        dots2.setAttribute("aria-hidden", "true");
        dots2.textContent = "…";
        pageControls.appendChild(dots2);
      }
      addBtn(String(pages), pages, { active: pageNum === pages });
    }

    addBtn("", pageNum + 1, {
      disabled: pageNum >= pages,
      aria: "下一页",
      html: '<i class="fa-regular fa-chevron-right" aria-hidden="true"></i>',
    });
  }

  function renderPage(nextPage) {
    if (!tbody) return;
    syncSelectionFromDom();
    var list = filteredStore();
    var pages = pageCount(list.length);
    page = Math.min(Math.max(1, nextPage || page), pages);
    var start = (page - 1) * PAGE_SIZE;
    var slice = list.slice(start, start + PAGE_SIZE);

    tbody.innerHTML = "";
    slice.forEach(function (item) {
      tbody.appendChild(buildRow(item));
    });
    applySelectionToDom();

    if (window.WA_DROPDOWN && typeof window.WA_DROPDOWN.bind === "function") {
      WA_DROPDOWN.bind(tbody);
    }
    renderPager(list.length, page, pages);
    refreshTableApi();
    updateSelectionHint();
  }

  function goPage(n) {
    renderPage(n);
  }

  function clearProjectFormErrors() {
    if (projectForm && window.WA_FORM && typeof window.WA_FORM.clearErrors === "function") {
      window.WA_FORM.clearErrors(projectForm);
    }
  }

  function openProjectModal(mode, data, trigger) {
    if (!window.WA_MODAL) return;
    editingId = mode === "edit" && data ? data.id : null;
    viewingId = mode === "view" && data ? data.id : null;
    setProjectMode(mode);
    clearProjectFormErrors();
    if (mode === "view") {
      fillProjectView(data || {});
    } else {
      fillProjectForm(
        mode === "create"
          ? {
              type: "官网",
              priority: "中",
              status: "待启动",
              progress: "0",
              updated: nowStamp(),
            }
          : data
      );
    }
    WA_MODAL.open(projectModal, trigger || null);
  }

  function selectedIds() {
    syncSelectionFromDom();
    return Object.keys(selectedMap);
  }

  function bindRowActions() {
    if (rowActionsBound) return;
    rowActionsBound = true;
    // 菜单会被 WA_DROPDOWN 挂到 body，且 menu 内 stopPropagation；须捕获阶段委托
    document.addEventListener(
      "click",
      function (ev) {
      var item = ev.target && ev.target.closest ? ev.target.closest("[data-shell-row]") : null;
      if (!item) return;
      var key = item.getAttribute("data-shell-row") || "";
      var host = item.closest("[data-wa-dropdown-menu]") || item.closest("tr") || item;
      var id = host.getAttribute("data-project-id") || "";
      var data = findById(id) || {
        id: id,
        name: host.getAttribute("data-project-name") || "",
        type: host.getAttribute("data-project-type") || "",
        city: host.getAttribute("data-project-city") || "",
        owner: host.getAttribute("data-project-owner") || "",
        priority: host.getAttribute("data-project-priority") || "中",
        progress: host.getAttribute("data-project-progress") || "",
        status: host.getAttribute("data-project-status") || "进行中",
        updated: host.getAttribute("data-project-updated") || "",
      };
      if (key === "view") {
        openProjectModal("view", data, item);
        return;
      }
      if (key === "edit") {
        openProjectModal("edit", data, item);
        return;
      }
      if (key === "delete") {
        var name = data.name || "该项目";
        confirmDanger({
          title: "确认删除？",
          message: "删除「" + name + "」后不可恢复。",
          confirmText: "删除",
          cancelText: "取消",
          danger: true,
        }).then(function (ok) {
          if (!ok) return;
          store = store.filter(function (x) {
            return x.id !== data.id;
          });
          delete selectedMap[data.id];
          renderPage(page);
          tip("已删除：" + name, "success");
        });
      }
    },
      true
    );
  }

  if (kitTable) {
    kitTable.addEventListener("wa-table-selection", function () {
      syncSelectionFromDom();
    });
  }

  if (clearSelectionBtn) {
    clearSelectionBtn.addEventListener("click", function () {
      clearSelection();
    });
  }

  function selectCurrentPage() {
    if (!tbody) return;
    Array.prototype.forEach.call(tbody.querySelectorAll("tr"), function (tr) {
      var id = tr.getAttribute("data-project-id");
      if (id) selectedMap[id] = true;
    });
    applySelectionToDom();
    refreshTableApi();
    updateSelectionHint();
  }

  function selectAllFiltered() {
    filteredStore().forEach(function (item) {
      if (item && item.id) selectedMap[item.id] = true;
    });
    applySelectionToDom();
    refreshTableApi();
    updateSelectionHint();
  }

  document.querySelectorAll("[data-shell-select]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-shell-select") || "";
      if (key === "page") {
        selectCurrentPage();
        tip("已全选当页", "success");
        return;
      }
      if (key === "all") {
        selectAllFiltered();
        tip("已全选当前筛选结果（" + selectedCount() + " 项）", "success");
      }
    });
  });

  var createBtn = document.querySelector("[data-shell-create]");
  if (createBtn) {
    createBtn.addEventListener("click", function () {
      openProjectModal("create", null, createBtn);
    });
  }

  if (projectViewEdit) {
    projectViewEdit.addEventListener("click", function () {
      var data = viewingId ? findById(viewingId) : null;
      if (!data) {
        tip("未找到项目", "warning");
        return;
      }
      openProjectModal("edit", data, projectViewEdit);
    });
  }

  document.querySelectorAll("[data-shell-batch]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-shell-batch") || "";
      var ids = selectedIds();
      if (!ids.length) {
        tip(key === "status" ? "请先勾选要设置状态的行" : "请先勾选要删除的行", "warning");
        return;
      }
      if (key === "delete") {
        confirmDanger({
          title: "确认删除选中项目？",
          message: "将删除 " + ids.length + " 条记录。",
          confirmText: "删除",
          cancelText: "取消",
          danger: true,
        }).then(function (ok) {
          if (!ok) return;
          var map = {};
          ids.forEach(function (id) {
            map[id] = true;
          });
          store = store.filter(function (x) {
            return !map[x.id];
          });
          ids.forEach(function (id) {
            delete selectedMap[id];
          });
          renderPage(page);
          tip("已删除 " + ids.length + " 条", "success");
        });
        return;
      }
      if (key === "status") {
        if (!statusModal || !window.WA_MODAL) {
          tip("状态弹层不可用");
          return;
        }
        if (batchStatus) setFieldValue(batchStatus, "进行中");
        statusModal.setAttribute("data-status-ids", ids.join(","));
        WA_MODAL.open(statusModal, btn);
      }
    });
  });

  if (statusSubmit) {
    statusSubmit.addEventListener("click", function () {
      var raw = statusModal ? statusModal.getAttribute("data-status-ids") || "" : "";
      var ids = raw ? raw.split(",").filter(Boolean) : selectedIds();
      if (!ids.length) {
        tip("请先勾选要设置状态的行", "warning");
        return;
      }
      var status = batchStatus ? String(batchStatus.value || "").trim() : "";
      if (!status) {
        tip("请选择状态", "warning");
        return;
      }
      var stamp = nowStamp();
      var map = {};
      ids.forEach(function (id) {
        map[id] = true;
      });
      store.forEach(function (item) {
        if (!map[item.id]) return;
        item.status = status;
        item.updated = stamp;
      });
      if (window.WA_MODAL && statusModal) WA_MODAL.close(statusModal);
      renderPage(page);
      tip("已将 " + ids.length + " 条设为「" + status + "」", "success");
    });
  }

  if (projectSubmit) {
    projectSubmit.addEventListener("click", function () {
      var mode = projectModal.getAttribute("data-project-mode") || "create";
      if (mode === "view") return;
      if (projectForm && window.WA_FORM && typeof window.WA_FORM.validate === "function") {
        var check = window.WA_FORM.validate(projectForm);
        if (!check.ok) {
          tip("请完善标红的表单项", "warning");
          if (check.firstBad && window.WA_FORM && typeof WA_FORM.focusValidatedField === "function") {
            WA_FORM.focusValidatedField(projectForm, check.firstBad);
          } else if (check.firstBad) {
            try {
              check.firstBad.focus();
            } catch (e) {}
          }
          return;
        }
      }
      var data = readFormProject();
      if (!data.name) {
        return;
      }
      if (mode === "edit") data.updated = nowStamp();
      else if (!data.updated) data.updated = nowStamp();

      if (mode === "create") {
        var id = "p" + Date.now();
        store.unshift(
          cloneItem(
            {
              name: data.name,
              type: data.type,
              city: data.city,
              owner: data.owner,
              priority: data.priority,
              progress: data.progress,
              status: data.status,
              updated: data.updated,
            },
            id,
            nextBizCode(data.type, data.updated)
          )
        );
        filterQuery = "";
        filterStatusVal = "";
        filterTypeVal = "";
        filterPriorityVal = "";
        if (filterInput) filterInput.value = "";
        if (filterStatus) setFieldValue(filterStatus, "");
        if (filterType) setFieldValue(filterType, "");
        if (filterPriority) setFieldValue(filterPriority, "");
        renderPage(1);
        tip("已创建：" + data.name, "success");
      } else if (mode === "edit" && editingId) {
        var item = findById(editingId);
        if (item) {
          item.name = data.name;
          item.type = data.type;
          item.city = data.city;
          item.owner = data.owner;
          item.priority = data.priority;
          item.progress = String(data.progress || "0").replace(/%/g, "");
          item.status = data.status;
          item.updated = data.updated;
        }
        renderPage(page);
        tip("已保存：" + data.name, "success");
      }
      editingId = null;
      viewingId = null;
      if (window.WA_MODAL) WA_MODAL.close(projectModal);
    });
  }

  function syncFiltersFromUi() {
    filterQuery = filterInput ? String(filterInput.value || "") : "";
    filterStatusVal = filterStatus ? String(filterStatus.value || "").trim() : "";
    filterTypeVal = filterType ? String(filterType.value || "").trim() : "";
    filterPriorityVal = filterPriority ? String(filterPriority.value || "").trim() : "";
  }

  function onFilterChange() {
    syncFiltersFromUi();
    renderPage(1);
  }

  if (filterInput) {
    filterInput.addEventListener("input", onFilterChange);
    filterInput.addEventListener("search", onFilterChange);
    filterInput.addEventListener("change", onFilterChange);
  }

  [filterStatus, filterType, filterPriority].forEach(function (el) {
    if (!el) return;
    el.addEventListener("change", onFilterChange);
  });

  var clearBtn = filterInput && filterInput.parentNode
    ? filterInput.parentNode.querySelector("[data-wa-field-clear]")
    : null;
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      window.setTimeout(function () {
        onFilterChange();
      }, 0);
    });
  }

  if (filterReset) {
    filterReset.addEventListener("click", function () {
      filterQuery = "";
      filterStatusVal = "";
      filterTypeVal = "";
      filterPriorityVal = "";
      if (filterInput) filterInput.value = "";
      if (filterStatus) setFieldValue(filterStatus, "");
      if (filterType) setFieldValue(filterType, "");
      if (filterPriority) setFieldValue(filterPriority, "");
      renderPage(1);
    });
  }

  bindRowActions();
  renderPage(1);
})();
