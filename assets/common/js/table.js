/**
 * 表格：筛选 / 全选 / 空状态 / 导出触发
 *
 * 根节点：table[data-wa-table] 或 table[data-kit-table]
 * 相关属性（同前缀 wa- / kit-）：
 *   data-*-table-body | tbody
 *   data-*-table-filter
 *   data-*-table-check-all
 *   data-*-table-export（可选 data-wa-table-export-msg）
 *   data-*-table-empty
 *
 * API：
 *   WA_TABLE.bind(root?, options?)
 *   WA_TABLE.get(tableEl) → 实例
 *
 * 实例：refresh / applyFilter / getVisibleRows / getCheckedRows
 *
 * 事件（bubbles，挂在 table 上）：
 *   wa-table-filter   { query, visible }
 *   wa-table-selection { checked, visible }
 *   wa-table-export   { table, button }  — 监听里 preventDefault() 可取消默认成功提示
 *
 * 扩展方式：
 *   1) 页级监听事件（推荐）
 *   2) bind 时传 options.filterRow / options.onExport
 *   3) 行增删后调 instance.refresh()
 */
(function () {
  "use strict";

  var instances = typeof WeakMap !== "undefined" ? new WeakMap() : null;
  var instanceList = [];

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

  function qs(scope, selectors) {
    for (var i = 0; i < selectors.length; i += 1) {
      var el = scope.querySelector(selectors[i]);
      if (el) return el;
    }
    return null;
  }

  function emit(table, name, detail, cancelable) {
    var ev;
    try {
      ev = new CustomEvent(name, {
        bubbles: true,
        cancelable: !!cancelable,
        detail: detail || {},
      });
    } catch (e) {
      ev = document.createEvent("CustomEvent");
      ev.initCustomEvent(name, true, !!cancelable, detail || {});
    }
    return table.dispatchEvent(ev);
  }

  function defaultFilterRow(tr, query) {
    if (!query) return true;
    return (tr.textContent || "").toLowerCase().indexOf(query) !== -1;
  }

  function bindTable(table, options) {
    if (!table) return null;
    options = options || {};

    var existing = get(table);
    if (existing) {
      if (options.filterRow) existing.options.filterRow = options.filterRow;
      if (options.onExport) existing.options.onExport = options.onExport;
      existing.refresh();
      return existing;
    }

    var host =
      table.closest(".wa-table-shell, .wa-kit__card, .wa-table-host, [data-wa-table-host]") ||
      document;
    var tbody =
      qs(table, ["[data-wa-table-body]", "[data-kit-table-body]"]) ||
      table.querySelector("tbody");
    var filter = qs(host, ["[data-wa-table-filter]", "[data-kit-table-filter]"]);
    var checkAll = qs(host, ["[data-wa-table-check-all]", "[data-kit-table-check-all]"]);
    var exportBtn = qs(host, ["[data-wa-table-export]", "[data-kit-table-export]"]);
    var emptyEl = qs(host, ["[data-wa-table-empty]", "[data-kit-table-empty]"]);
    var tableWrap = table.closest(".wa-table-wrap");

    var api = {
      table: table,
      tbody: tbody,
      options: {
        filterRow: options.filterRow || null,
        onExport: options.onExport || null,
      },
      refresh: refresh,
      applyFilter: applyFilter,
      getVisibleRows: getVisibleRows,
      getCheckedRows: getCheckedRows,
      syncScrollEdge: syncScrollEdge,
    };

    function syncScrollEdge() {
      if (!tableWrap) return;
      var max = tableWrap.scrollWidth - tableWrap.clientWidth;
      var left = tableWrap.scrollLeft;
      var eps = 1;
      tableWrap.classList.toggle("is-stuck-left", left > eps);
      tableWrap.classList.toggle("is-stuck-right", max > eps && left < max - eps);
    }

    function rowChecks() {
      return tbody ? Array.prototype.slice.call(tbody.querySelectorAll('input[type="checkbox"]')) : [];
    }

    function getVisibleRows() {
      if (!tbody) return [];
      return Array.prototype.slice.call(tbody.querySelectorAll("tr")).filter(function (tr) {
        return !tr.hidden;
      });
    }

    function getCheckedRows() {
      return getVisibleRows().filter(function (tr) {
        var cb = tr.querySelector('input[type="checkbox"]');
        return cb && cb.checked;
      });
    }

    function visibleRowChecks() {
      return rowChecks().filter(function (cb) {
        var tr = cb.closest("tr");
        return tr && !tr.hidden;
      });
    }

    function syncRowSelected() {
      if (!tbody) return;
      Array.prototype.forEach.call(tbody.querySelectorAll("tr"), function (tr) {
        var cb = tr.querySelector('input[type="checkbox"]');
        tr.classList.toggle("is-selected", !!(cb && cb.checked));
      });
    }

    function syncCheckAll() {
      syncRowSelected();
      if (!checkAll) return;
      var list = visibleRowChecks();
      var checked = 0;
      list.forEach(function (cb) {
        if (cb.checked) checked += 1;
      });
      checkAll.checked = list.length > 0 && checked === list.length;
      checkAll.indeterminate = checked > 0 && checked < list.length;
      emit(table, "wa-table-selection", {
        checked: checked,
        visible: list.length,
        rows: getCheckedRows(),
      });
    }

    function syncEmpty(visibleCount) {
      var isEmpty = visibleCount === 0;
      if (emptyEl) emptyEl.hidden = !isEmpty;
      table.hidden = isEmpty;
      if (tableWrap) tableWrap.classList.toggle("is-empty", isEmpty);
      if (checkAll) checkAll.disabled = isEmpty;
    }

    function applyFilter() {
      if (!tbody) return;
      var q = filter ? String(filter.value || "").trim().toLowerCase() : "";
      var filterRow = api.options.filterRow || defaultFilterRow;
      var visible = 0;
      Array.prototype.forEach.call(tbody.querySelectorAll("tr"), function (tr) {
        var show = !!filterRow(tr, q);
        tr.hidden = !show;
        if (show) visible += 1;
      });
      syncEmpty(visible);
      syncCheckAll();
      emit(table, "wa-table-filter", { query: q, visible: visible });
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(syncScrollEdge);
      } else {
        syncScrollEdge();
      }
    }

    function refresh() {
      // 动态增删行后：重绑行勾选监听并重新筛选
      rowChecks().forEach(function (cb) {
        if (cb.getAttribute("data-wa-table-row-bound") === "1") return;
        cb.setAttribute("data-wa-table-row-bound", "1");
        cb.addEventListener("change", syncCheckAll);
      });
      applyFilter();
    }

    if (filter) {
      filter.addEventListener("input", applyFilter);
      filter.addEventListener("search", applyFilter);
      filter.addEventListener("change", applyFilter);
    }

    if (checkAll) {
      checkAll.addEventListener("change", function () {
        var on = !!checkAll.checked;
        checkAll.indeterminate = false;
        visibleRowChecks().forEach(function (cb) {
          cb.checked = on;
        });
        syncCheckAll();
      });
    }

    rowChecks().forEach(function (cb) {
      cb.setAttribute("data-wa-table-row-bound", "1");
      cb.addEventListener("change", syncCheckAll);
    });

    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        var detail = {
          table: table,
          button: exportBtn,
          rows: getCheckedRows().length ? getCheckedRows() : getVisibleRows(),
        };
        if (typeof api.options.onExport === "function") {
          if (api.options.onExport(detail) === false) return;
        }
        var allowed = emit(table, "wa-table-export", detail, true);
        if (!allowed) return;
        var msg =
          exportBtn.getAttribute("data-wa-table-export-msg") ||
          exportBtn.getAttribute("data-kit-table-export-msg") ||
          "已触发导出";
        flash("success", msg);
      });
    }

    if (tableWrap && tableWrap.getAttribute("data-wa-table-scroll-bound") !== "1") {
      tableWrap.setAttribute("data-wa-table-scroll-bound", "1");
      tableWrap.addEventListener("scroll", syncScrollEdge, { passive: true });
      if (typeof ResizeObserver !== "undefined") {
        var ro = new ResizeObserver(syncScrollEdge);
        ro.observe(tableWrap);
        if (table) ro.observe(table);
      }
      window.addEventListener("resize", syncScrollEdge);
    }

    table.setAttribute("data-wa-table-bound", "1");
    if (instances) instances.set(table, api);
    else instanceList.push({ table: table, api: api });

    applyFilter();
    syncScrollEdge();
    return api;
  }

  function get(table) {
    if (!table) return null;
    if (instances) return instances.get(table) || null;
    for (var i = 0; i < instanceList.length; i += 1) {
      if (instanceList[i].table === table) return instanceList[i].api;
    }
    return null;
  }

  function bind(root, options) {
    var scope = root && root.querySelectorAll ? root : document;
    var list = [];
    if (scope.matches && (scope.matches("[data-wa-table]") || scope.matches("[data-kit-table]"))) {
      list.push(bindTable(scope, options));
    }
    scope.querySelectorAll("[data-wa-table], [data-kit-table]").forEach(function (table) {
      list.push(bindTable(table, options));
    });
    return list.filter(Boolean);
  }

  window.WA_TABLE = {
    bind: bind,
    get: get,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      bind();
    });
  } else {
    bind();
  }
})();
