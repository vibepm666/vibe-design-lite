/**
 * 拖入上传：[data-wa-dropzone="inputId"]
 * 多选默认追加（不覆盖已选）；列表在区下方 .wa-dropzone-list。
 *
 * 配置（zone 或 input 均可；input 的 multiple / accept 优先）：
 *   multiple                 多选；缺省单选（再选则替换）
 *   accept / data-wa-accept  格式，如 .pdf,image/*,application/zip
 *   data-wa-max-size         单文件上限，如 5mb / 512kb / 1048576
 *   data-wa-max-files        最多文件数（仅 multiple）
 *   data-wa-replace="1"      多选时改为每次覆盖（默认追加）
 *
 *   WA_DROPZONE.bind()
 *   事件 wa-dropzone-change  detail: { files, count, input, zone, list }
 *   事件 wa-dropzone-reject  detail: { rejected: [{ file, reason }], options }
 */
(function () {
  "use strict";

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

  function parseSize(raw) {
    if (raw == null || raw === "") return 0;
    if (typeof raw === "number" && isFinite(raw)) return Math.max(0, raw);
    var s = String(raw).trim().toLowerCase();
    var m = s.match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
    if (!m) {
      var n = parseInt(s, 10);
      return isNaN(n) ? 0 : Math.max(0, n);
    }
    var num = parseFloat(m[1]);
    var unit = m[2] || "b";
    var mul = unit === "gb" ? 1024 * 1024 * 1024
      : unit === "mb" ? 1024 * 1024
      : unit === "kb" ? 1024
      : 1;
    return Math.round(num * mul);
  }

  function formatSize(bytes) {
    var n = Number(bytes) || 0;
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(n < 10 * 1024 ? 1 : 0) + " KB";
    return (n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 0) + " MB";
  }

  function attr(zone, input, name) {
    return (
      (zone && zone.getAttribute(name)) ||
      (input && input.getAttribute(name)) ||
      ""
    );
  }

  function readOptions(zone, input) {
    var accept = (input && input.accept) || attr(zone, input, "data-wa-accept") || "";
    if (accept && input && !input.accept) input.accept = accept;
    var maxFiles = parseInt(attr(zone, input, "data-wa-max-files"), 10);
    return {
      multiple: !!(input && input.multiple),
      accept: accept,
      maxSize: parseSize(attr(zone, input, "data-wa-max-size")),
      maxFiles: isNaN(maxFiles) ? 0 : Math.max(0, maxFiles),
      replace: attr(zone, input, "data-wa-replace") === "1",
    };
  }

  function fileKey(file) {
    return [file.name, file.size, file.lastModified || 0].join("\0");
  }

  function fileExt(name) {
    var n = String(name || "").toLowerCase();
    var i = n.lastIndexOf(".");
    return i >= 0 ? n.slice(i) : "";
  }

  function matchesAccept(file, accept) {
    if (!accept) return true;
    var type = (file.type || "").toLowerCase();
    var ext = fileExt(file.name);
    var tokens = String(accept).split(",").map(function (t) {
      return t.trim().toLowerCase();
    }).filter(Boolean);
    if (!tokens.length) return true;
    for (var i = 0; i < tokens.length; i += 1) {
      var t = tokens[i];
      if (t.charAt(0) === ".") {
        if (ext === t) return true;
        continue;
      }
      if (t.slice(-2) === "/*") {
        var prefix = t.slice(0, -1);
        if (type.indexOf(prefix) === 0) return true;
        continue;
      }
      if (type && type === t) return true;
    }
    return false;
  }

  function maxAllowed(options) {
    if (!options.multiple) return 1;
    return options.maxFiles > 0 ? options.maxFiles : 0; // 0 = 不限
  }

  function remainingSlots(options, currentCount) {
    var max = maxAllowed(options);
    if (max <= 0) return Infinity;
    return Math.max(0, max - currentCount);
  }

  function filterIncoming(files, options, currentCount) {
    var accepted = [];
    var rejected = [];
    var max = maxAllowed(options);

    for (var i = 0; i < files.length; i += 1) {
      var file = files[i];
      var used = currentCount + accepted.length;
      if (max > 0 && used >= max) {
        rejected.push({ file: file, reason: "max" });
        continue;
      }
      if (!matchesAccept(file, options.accept)) {
        rejected.push({ file: file, reason: "type" });
        continue;
      }
      if (options.maxSize > 0 && file.size > options.maxSize) {
        rejected.push({ file: file, reason: "size" });
        continue;
      }
      accepted.push(file);
    }
    return { accepted: accepted, rejected: rejected };
  }

  /* 轻提示宜短：不拼长文件名，避免 toast 折行难读 */
  function notifyReject(zone, rejected, options, meta) {
    if (!rejected.length) return;
    try {
      zone.dispatchEvent(
        new CustomEvent("wa-dropzone-reject", {
          bubbles: true,
          detail: { rejected: rejected, options: options, meta: meta || null },
        })
      );
    } catch (e) { /* ignore */ }

    var nMax = 0;
    var nType = 0;
    var nSize = 0;
    for (var i = 0; i < rejected.length; i += 1) {
      var reason = rejected[i].reason;
      if (reason === "max") nMax += 1;
      else if (reason === "type") nType += 1;
      else if (reason === "size") nSize += 1;
    }

    var parts = [];
    if (nMax) {
      parts.push("最多上传 " + maxAllowed(options) + " 个文件");
    }
    if (nType) {
      parts.push(nType === 1 ? "文件格式不支持" : "有 " + nType + " 个文件格式不支持");
    }
    if (nSize) {
      var lim = formatSize(options.maxSize);
      parts.push(
        nSize === 1
          ? "文件超过 " + lim + "，请压缩后重试"
          : "有 " + nSize + " 个文件超过 " + lim
      );
    }
    if (!parts.length) parts.push("部分文件未添加");
    flash("warning", parts.join("；"));
  }

  function cloneTransfer(from) {
    var dt = new DataTransfer();
    if (!from || !from.files) return dt;
    for (var i = 0; i < from.files.length; i += 1) {
      try {
        dt.items.add(from.files[i]);
      } catch (err) { /* ignore */ }
    }
    return dt;
  }

  function clampTransfer(from, max) {
    var dt = new DataTransfer();
    if (!from || !from.files) return dt;
    var limit = max > 0 ? Math.min(from.files.length, max) : from.files.length;
    for (var i = 0; i < limit; i += 1) {
      try {
        dt.items.add(from.files[i]);
      } catch (err) { /* ignore */ }
    }
    return dt;
  }

  function resolveList(zone, input) {
    var id = input && input.id ? input.id : "";
    var host = zone.closest(".wa-form-item") || zone.parentElement;
    var list = null;
    if (id) {
      list = document.querySelector('[data-wa-dropzone-list="' + id + '"]');
    }
    if (!list && host) {
      list = host.querySelector(".wa-dropzone-list");
    }
    if (!list) {
      list = document.createElement("ul");
      list.className = "wa-dropzone-list";
      if (id) list.setAttribute("data-wa-dropzone-list", id);
      zone.insertAdjacentElement("afterend", list);
    }
    return list;
  }

  function fileIconClass(file) {
    var name = (file && file.name ? file.name : "").toLowerCase();
    var type = (file && file.type ? file.type : "").toLowerCase();
    var ext = name.lastIndexOf(".") >= 0 ? name.slice(name.lastIndexOf(".") + 1) : "";
    if (type.indexOf("image/") === 0 || /^(png|jpe?g|gif|webp|svg|bmp|ico)$/.test(ext)) {
      return "fa-solid fa-image";
    }
    if (type.indexOf("video/") === 0 || /^(mp4|webm|mov|avi|mkv)$/.test(ext)) {
      return "fa-solid fa-film";
    }
    if (type.indexOf("audio/") === 0 || /^(mp3|wav|flac|aac|ogg|m4a)$/.test(ext)) {
      return "fa-solid fa-music";
    }
    if (type === "application/pdf" || ext === "pdf") return "fa-solid fa-file-pdf";
    if (/^(zip|rar|7z|tar|gz)$/.test(ext)) return "fa-solid fa-file-zipper";
    if (/^(xlsx?|csv)$/.test(ext)) return "fa-solid fa-file-excel";
    if (/^docx?$/.test(ext)) return "fa-solid fa-file-word";
    if (/^pptx?$/.test(ext)) return "fa-solid fa-file-powerpoint";
    if (/^(txt|md|json|xml|ya?ml|log)$/.test(ext) || type.indexOf("text/") === 0) {
      return "fa-solid fa-file-lines";
    }
    if (/^(js|ts|jsx|tsx|css|html?|py|java|go|rs)$/.test(ext)) {
      return "fa-solid fa-file-code";
    }
    return "fa-solid fa-file";
  }

  function renderList(list, store) {
    var files = store.files;
    var n = files.length;
    list.innerHTML = "";
    list.hidden = n === 0;
    list.setAttribute("aria-hidden", n === 0 ? "true" : "false");
    if (!n) return;
    for (var i = 0; i < n; i += 1) {
      var file = files[i];
      var li = document.createElement("li");
      li.className = "wa-dropzone-list__item";

      var icon = document.createElement("span");
      icon.className = "wa-dropzone-list__icon";
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = '<i class="' + fileIconClass(file) + '"></i>';

      var meta = document.createElement("div");
      meta.className = "wa-dropzone-list__meta";

      var name = document.createElement("span");
      name.className = "wa-dropzone-list__name";
      name.textContent = file.name;
      name.title = file.name;

      var size = document.createElement("span");
      size.className = "wa-dropzone-list__size";
      size.textContent = formatSize(file.size);

      meta.appendChild(name);
      meta.appendChild(size);

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wa-dropzone-list__remove";
      btn.setAttribute("data-wa-dropzone-remove", String(i));
      btn.setAttribute("aria-label", "移除 " + file.name);
      btn.innerHTML = '<i class="fa-light fa-xmark" aria-hidden="true"></i>';

      li.appendChild(icon);
      li.appendChild(meta);
      li.appendChild(btn);
      list.appendChild(li);
    }
  }

  function bindZone(zone) {
    if (!zone || zone.getAttribute("data-wa-dropzone-bound") === "1") return;
    var inputId = zone.getAttribute("data-wa-dropzone");
    var input = inputId ? document.getElementById(inputId) : null;
    if (!input) {
      var host = zone.closest(".wa-form-item") || zone.parentElement;
      input = host ? host.querySelector(".wa-file-input, input[type='file']") : null;
    }
    if (!input) return;
    zone.setAttribute("data-wa-dropzone-bound", "1");

    var options = readOptions(zone, input);
    var list = resolveList(zone, input);
    var store = new DataTransfer();
    var awaitingPick = false;
    var pickingGuard = false;

    function applyStore() {
      // 重新克隆，避免 input.files 与 store 引用牵连
      store = cloneTransfer(store);
      try {
        input.files = store.files;
      } catch (err) { /* ignore */ }
    }

    function sync() {
      var max = maxAllowed(options);
      if (max > 0 && store.files.length > max) {
        store = clampTransfer(store, max);
      }
      applyStore();
      var n = store.files.length;
      zone.classList.toggle("is-filled", n > 0);
      zone.classList.toggle("is-full", max > 0 && n >= max);
      renderList(list, store);
      try {
        zone.dispatchEvent(
          new CustomEvent("wa-dropzone-change", {
            bubbles: true,
            detail: {
              files: store.files,
              count: n,
              input: input,
              zone: zone,
              list: list,
            },
          })
        );
      } catch (e) { /* ignore */ }
    }

    function clearStore() {
      store = new DataTransfer();
      sync();
    }

    function isFull() {
      return remainingSlots(options, store.files.length) <= 0;
    }

    function commitFiles(fileList, mode) {
      var incoming = fileList ? Array.prototype.slice.call(fileList) : [];
      if (!incoming.length) return;

      options = readOptions(zone, input);
      var append = options.multiple && !options.replace && mode !== "replace";
      if (!append) {
        store = new DataTransfer();
      } else {
        store = cloneTransfer(store);
      }

      var currentCount = store.files.length;
      if (append && isFull()) {
        notifyReject(
          zone,
          incoming.map(function (f) {
            return { file: f, reason: "max" };
          }),
          options
        );
        sync();
        return;
      }

      var seen = {};
      for (var i = 0; i < store.files.length; i += 1) {
        seen[fileKey(store.files[i])] = true;
      }

      var unique = [];
      for (var j = 0; j < incoming.length; j += 1) {
        var f = incoming[j];
        var key = fileKey(f);
        if (seen[key]) continue;
        seen[key] = true;
        unique.push(f);
      }

      if (!unique.length) {
        sync();
        return;
      }

      var filtered = filterIncoming(unique, options, currentCount);
      notifyReject(zone, filtered.rejected, options, {
        current: currentCount,
        room: remainingSlots(options, currentCount),
      });

      var cap = maxAllowed(options);
      var next = cloneTransfer(store);
      for (var k = 0; k < filtered.accepted.length; k += 1) {
        if (cap > 0 && next.files.length >= cap) break;
        try {
          next.items.add(filtered.accepted[k]);
        } catch (err) { /* ignore */ }
      }
      store = cap > 0 ? clampTransfer(next, cap) : next;
      sync();
    }

    function removeAt(index) {
      var next = new DataTransfer();
      for (var i = 0; i < store.files.length; i += 1) {
        if (i !== index) next.items.add(store.files[i]);
      }
      store = next;
      sync();
    }

    function openPicker() {
      options = readOptions(zone, input);
      if (options.multiple && !options.replace && isFull()) {
        flash(
          "warning",
          "最多 " + maxAllowed(options) + " 个文件，请先移除再添加"
        );
        return;
      }
      awaitingPick = true;
      pickingGuard = true;
      var snapshot = cloneTransfer(store);
      try {
        input.value = "";
      } catch (err) { /* ignore */ }
      // value="" 可能触发 change；用快照护住已选，并短时忽略空 change
      store = snapshot;
      window.setTimeout(function () {
        pickingGuard = false;
      }, 0);
      input.click();
    }

    zone.addEventListener("click", openPicker);
    zone.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openPicker();
      }
    });
    ["dragenter", "dragover"].forEach(function (ev) {
      zone.addEventListener(ev, function (e) {
        e.preventDefault();
        zone.classList.add("is-dragover");
      });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      zone.addEventListener(ev, function (e) {
        e.preventDefault();
        zone.classList.remove("is-dragover");
      });
    });
    zone.addEventListener("drop", function (e) {
      awaitingPick = false;
      var files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length) commitFiles(files);
    });
    input.addEventListener("change", function () {
      var picked = input.files ? Array.prototype.slice.call(input.files) : [];
      if (!picked.length) {
        // 打开选择器前清空 value 触发的空 change：忽略，避免误清空已选
        if (awaitingPick || pickingGuard) {
          applyStore();
          return;
        }
        if (!input.value) clearStore();
        else applyStore();
        return;
      }
      awaitingPick = false;
      pickingGuard = false;
      commitFiles(picked);
    });
    window.addEventListener("focus", function () {
      window.setTimeout(function () {
        if (!awaitingPick) return;
        awaitingPick = false;
        applyStore();
      }, 280);
    });
    list.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest
        ? e.target.closest("[data-wa-dropzone-remove]")
        : null;
      if (!btn || !list.contains(btn)) return;
      e.preventDefault();
      e.stopPropagation();
      var idx = parseInt(btn.getAttribute("data-wa-dropzone-remove"), 10);
      if (!isNaN(idx)) removeAt(idx);
    });

    // 外部 reset：input value 被清后仍可能无 change，暴露清理钩子
    input.addEventListener("wa-dropzone-clear", clearStore);

    sync();
  }

  function bind(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll("[data-wa-dropzone]").forEach(bindZone);
  }

  window.WA_DROPZONE = {
    bind: bind,
    parseSize: parseSize,
    formatSize: formatSize,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      bind();
    });
  } else {
    bind();
  }
})();
