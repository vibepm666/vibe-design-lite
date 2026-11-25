/**
 * 自定义下拉：增强 select[data-wa-combo]
 * 列表挂 body + fixed，避免卡片 overflow 裁切。
 * 默认选中后可清除；data-wa-combo-clear="0" 关闭。
 *
 *   WA_COMBO.bind()
 *   WA_COMBO.closeAll()
 */
(function () {
  "use strict";

  var openComboApi = null;
  var comboPlaceRaf = 0;

  function scheduleComboPlace(fn) {
    if (comboPlaceRaf) return;
    comboPlaceRaf = window.requestAnimationFrame(function () {
      comboPlaceRaf = 0;
      fn();
    });
  }

  function findClearIndex(select) {
    var i;
    var disabledEmpty = -1;
    for (i = 0; i < select.options.length; i += 1) {
      if (select.options[i].value) continue;
      if (!select.options[i].disabled) return i;
      if (disabledEmpty < 0) disabledEmpty = i;
    }
    return disabledEmpty;
  }

  function isClearable(select) {
    /* 默认开启；仅 data-wa-combo-clear="0" 关闭 */
    return select.getAttribute("data-wa-combo-clear") !== "0";
  }

  function enhanceCombo(select) {
    if (!select || select.dataset.waComboReady === "1") return;
    select.dataset.waComboReady = "1";

    var field = select.closest(".wa-field") || select.parentNode;
    var combo = document.createElement("div");
    combo.className = "wa-combo";

    var control = document.createElement("div");
    control.className = "wa-combo__control";

    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "wa-combo__trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    var selectId = select.id;
    if (selectId) {
      trigger.id = selectId;
      select.setAttribute("data-wa-combo-for", selectId);
      select.removeAttribute("id");
    }
    if (select.getAttribute("aria-labelledby")) {
      trigger.setAttribute("aria-labelledby", select.getAttribute("aria-labelledby"));
    }
    if (select.getAttribute("aria-label")) {
      trigger.setAttribute("aria-label", select.getAttribute("aria-label"));
    }

    var valueEl = document.createElement("span");
    valueEl.className = "wa-combo__value";
    trigger.appendChild(valueEl);

    var trail = document.createElement("span");
    trail.className = "wa-combo__trail";

    var clearBtn = null;
    var clearable = isClearable(select);
    if (clearable) {
      clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.className = "wa-combo__clear";
      clearBtn.setAttribute("aria-label", "清空");
      clearBtn.setAttribute("aria-hidden", "true");
      clearBtn.innerHTML = '<i class="fa-solid fa-circle-xmark" aria-hidden="true"></i>';
      trail.appendChild(clearBtn);
    }

    var chevron = document.createElement("i");
    chevron.className = "fa-solid fa-chevron-down wa-combo__chevron";
    chevron.setAttribute("aria-hidden", "true");
    trail.appendChild(chevron);

    var list = document.createElement("ul");
    list.className = "wa-combo__list";
    list.setAttribute("role", "listbox");
    list.hidden = true;
    if (select.id) list.id = select.id + "-list";
    trigger.setAttribute("aria-controls", list.id);

    function placeholderText() {
      var i;
      for (i = 0; i < select.options.length; i += 1) {
        if (!select.options[i].value) {
          return select.options[i].textContent || "请选择";
        }
      }
      return select.getAttribute("data-placeholder") || "请选择";
    }

    function syncClear() {
      if (!clearBtn) return;
      var show = !!select.value;
      clearBtn.classList.toggle("is-visible", show);
      clearBtn.setAttribute("aria-hidden", show ? "false" : "true");
    }

    function syncLabel() {
      var isEmpty = !select.value;
      var opt = isEmpty ? null : select.options[select.selectedIndex];
      valueEl.textContent = isEmpty ? placeholderText() : (opt && opt.textContent) || placeholderText();
      valueEl.classList.toggle("is-placeholder", isEmpty);
      Array.prototype.forEach.call(list.querySelectorAll(".wa-combo__option"), function (btn) {
        btn.setAttribute("aria-selected", btn.getAttribute("data-value") === select.value ? "true" : "false");
      });
      syncClear();
    }

    Array.prototype.forEach.call(select.options, function (opt) {
      if (!opt.value) return;
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wa-combo__option";
      btn.setAttribute("role", "option");
      btn.setAttribute("data-value", opt.value);
      btn.textContent = opt.textContent;
      btn.addEventListener("click", function () {
        select.value = opt.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        syncLabel();
        setOpen(false);
        trigger.focus();
      });
      li.appendChild(btn);
      list.appendChild(li);
    });

    function placeList() {
      var anchor = field || trigger;
      var r = anchor.getBoundingClientRect();
      list.style.top = Math.round(r.bottom + 6) + "px";
      list.style.left = Math.round(r.left) + "px";
      list.style.width = Math.round(r.width) + "px";
    }

    function setOpen(open) {
      if (open) {
        if (openComboApi && openComboApi !== api) openComboApi.setOpen(false);
        if (window.WA_DROPDOWN && typeof window.WA_DROPDOWN.closeAll === "function") {
          window.WA_DROPDOWN.closeAll();
        }
        openComboApi = api;
      } else if (openComboApi === api) {
        openComboApi = null;
      }
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      list.hidden = !open;
      if (field && field.classList) field.classList.toggle("is-open", open);
      if (open) placeList();
    }

    var api = {
      setOpen: setOpen,
      place: placeList,
      isOpen: function () {
        return !list.hidden;
      },
      trigger: trigger,
      contains: function (node) {
        return combo.contains(node) || list.contains(node);
      },
    };

    function toggleOpen(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      setOpen(list.hidden);
    }

    trigger.addEventListener("click", toggleOpen);
    chevron.addEventListener("click", toggleOpen);
    list.addEventListener("click", function (ev) {
      ev.stopPropagation();
    });

    if (clearBtn) {
      clearBtn.addEventListener("mousedown", function (ev) {
        ev.preventDefault();
      });
      clearBtn.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var emptyIdx = findClearIndex(select);
        if (emptyIdx >= 0) select.selectedIndex = emptyIdx;
        else select.value = "";
        select.dispatchEvent(new Event("change", { bubbles: true }));
        syncLabel();
        setOpen(false);
        trigger.focus();
      });
    }

    select.classList.add("wa-combo__native");
    select.parentNode.insertBefore(combo, select);
    combo.appendChild(select);
    select.setAttribute("tabindex", "-1");
    select.setAttribute("aria-hidden", "true");
    control.appendChild(trigger);
    control.appendChild(trail);
    combo.appendChild(control);
    document.body.appendChild(list);
    if (!select.value) {
      for (var pi = 0; pi < select.options.length; pi += 1) {
        if (!select.options[pi].value) {
          select.selectedIndex = pi;
          break;
        }
      }
    }
    syncLabel();
    select.addEventListener("change", syncLabel);
  }

  function closeAll() {
    if (openComboApi) openComboApi.setOpen(false);
  }

  /** 校验聚焦：label for 挂在 trigger 上，firstBad 仍是隐藏 select */
  function focusTarget(field) {
    if (!field) return null;
    if (field.tagName === "SELECT" && field.dataset.waComboReady === "1") {
      var cid = field.getAttribute("data-wa-combo-for");
      if (cid) {
        var byId = document.getElementById(cid);
        if (byId) return byId;
      }
      var combo = field.closest(".wa-combo");
      if (combo) {
        var tr = combo.querySelector(".wa-combo__trigger");
        if (tr) return tr;
      }
    }
    return field;
  }

  /** 按原 select id 或按钮 id 取隐藏 select（筛选脚本用） */
  function getNativeSelect(ref) {
    if (!ref) return null;
    var el = typeof ref === "string" ? document.getElementById(ref) : ref;
    if (!el) return null;
    if (el.tagName === "SELECT") return el;
    if (el.classList && el.classList.contains("wa-combo__trigger")) {
      var host = el.closest(".wa-combo");
      return host ? host.querySelector("select.wa-combo__native") : null;
    }
    return el.tagName === "SELECT" ? el : null;
  }

  function bind(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll("select[data-wa-combo]").forEach(enhanceCombo);
  }

  document.addEventListener("click", function () {
    closeAll();
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "Escape") return;
    if (!openComboApi || !openComboApi.isOpen()) return;
    var t = openComboApi.trigger;
    closeAll();
    if (t) {
      try {
        t.focus();
      } catch (e) {}
    }
  });
  window.addEventListener("resize", function () {
    scheduleComboPlace(function () {
      if (openComboApi && openComboApi.isOpen()) openComboApi.place();
    });
  });
  window.addEventListener(
    "scroll",
    function () {
      scheduleComboPlace(function () {
        if (openComboApi && openComboApi.isOpen()) openComboApi.place();
      });
    },
    true
  );

  window.WA_COMBO = {
    bind: bind,
    closeAll: closeAll,
    focusTarget: focusTarget,
    getNativeSelect: getNativeSelect,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      bind();
    });
  } else {
    bind();
  }
})();
