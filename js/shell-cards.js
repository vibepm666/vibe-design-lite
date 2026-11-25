(function () {
  var PAGE_SIZE = 15;
  var page = 1;
  var grid = document.getElementById("card-grid");
  var q = document.getElementById("card-filter");
  function comboSelect(id) {
    return (
      (window.WA_COMBO && window.WA_COMBO.getNativeSelect(id)) || document.getElementById(id)
    );
  }
  var type = comboSelect("card-type-filter");
  var priority = comboSelect("card-priority-filter");
  var channel = comboSelect("card-channel-filter");
  var refresh = document.getElementById("card-refresh");
  var pageInfo = document.querySelector("[data-card-page-info]");
  var pageControls = document.querySelector("[data-card-page-controls]");
  var emptyEl = document.querySelector("[data-card-empty]");
  var pager = document.querySelector("[data-card-pager]");

  function allCards() {
    return grid ? Array.prototype.slice.call(grid.querySelectorAll(".wa-shell-card")) : [];
  }

  function syncEmpty(total) {
    var isEmpty = total === 0;
    if (emptyEl) emptyEl.hidden = !isEmpty;
    if (grid) grid.hidden = isEmpty;
    if (grid) grid.classList.toggle("is-empty", isEmpty);
    if (pager) pager.hidden = isEmpty;
  }

  function resetSelect(el) {
    if (!el) return;
    el.value = "";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function filteredCards() {
    var keyword = String((q && q.value) || "").trim().toLowerCase();
    var kind = String((type && type.value) || "");
    var pri = String((priority && priority.value) || "");
    var ch = String((channel && channel.value) || "");
    return allCards().filter(function (card) {
      var title = String(card.getAttribute("data-card-title") || "").toLowerCase();
      var t = String(card.getAttribute("data-card-type") || "");
      var p = String(card.getAttribute("data-card-priority") || "");
      var c = String(card.getAttribute("data-card-channel") || "");
      var textBlob = (
        title +
        " " +
        String(card.textContent || "").toLowerCase()
      );
      var okType = !kind || t === kind;
      var okPri = !pri || p === pri;
      var okCh = !ch || c === ch;
      var okText = !keyword || textBlob.indexOf(keyword) >= 0;
      return okType && okPri && okCh && okText;
    });
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
          renderPage(targetPage);
        });
      }
      pageControls.appendChild(btn);
    }

    addBtn("", pageNum - 1, {
      disabled: pageNum <= 1,
      aria: "上一页",
      html: '<i class="fa-solid fa-chevron-left" aria-hidden="true"></i>',
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
      html: '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>',
    });
  }

  function renderPage(nextPage) {
    var list = filteredCards();
    var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    page = Math.min(Math.max(1, nextPage || page), pages);
    var start = (page - 1) * PAGE_SIZE;
    var end = start + PAGE_SIZE;
    var visible = {};
    list.slice(start, end).forEach(function (card) {
      visible[card.getAttribute("data-card-title") || ""] = true;
    });

    allCards().forEach(function (card) {
      var key = card.getAttribute("data-card-title") || "";
      card.hidden = !visible[key];
    });
    syncEmpty(list.length);
    if (list.length > 0) renderPager(list.length, page, pages);
  }

  if (q) q.addEventListener("input", function () { renderPage(1); });
  if (type) type.addEventListener("change", function () { renderPage(1); });
  if (priority) priority.addEventListener("change", function () { renderPage(1); });
  if (channel) channel.addEventListener("change", function () { renderPage(1); });
  if (refresh) {
    refresh.addEventListener("click", function () {
      if (q) q.value = "";
      resetSelect(type);
      resetSelect(priority);
      resetSelect(channel);
      renderPage(1);
      if (window.WA_MESSAGE) WA_MESSAGE.success("已刷新");
    });
  }

  renderPage(1);
})();
