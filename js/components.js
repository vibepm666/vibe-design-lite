/**
 * Lite 常用组件橱窗页级脚本（依赖 js/shared.js + assets 控件库）
 * 仅保留橱窗演示接线；combo / tabs / form / dropzone / choice / modal 见 assets/js
 */
(function () {
  function flashFeedback(type, text) {
    if (typeof window.WA_FLASH === "function") {
      window.WA_FLASH(type, text);
      return;
    }
    var kind = type || "info";
    var msg = String(text || "").trim();
    if (!msg) return;
    if (window.WA_MESSAGE && typeof window.WA_MESSAGE[kind] === "function") {
      window.WA_MESSAGE[kind](msg);
    } else if (window.WA_TOAST && typeof window.WA_TOAST[kind] === "function") {
      window.WA_TOAST[kind](msg);
    }
  }

  /* —— 组件预览：轻提示 / 吐司 / 右侧通知 —— */
  var toastCopy = {
    info: "这是一条信息提示",
    success: "操作成功",
    warning: "请注意检查输入",
    error: "操作失败，请重试",
  };
  var notifyCopy = {
    info: { title: "系统提示", text: "有一条新的产品动态可查看。" },
    success: { title: "保存成功", text: "你的修改已同步到云端。" },
    warning: { title: "容量将满", text: "建议清理不用的草稿后再继续。" },
    error: { title: "同步失败", text: "网络异常，请稍后重试。" },
  };

  document.querySelectorAll("[data-kit-toast]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var type = btn.getAttribute("data-kit-toast") || "info";
      var msg = toastCopy[type] || toastCopy.info;
      if (window.WA_TOAST && typeof window.WA_TOAST[type] === "function") {
        window.WA_TOAST[type](msg);
      } else if (window.WA_TOAST) {
        window.WA_TOAST.show(msg, { type: type });
      }
    });
  });

  document.querySelectorAll("[data-kit-notify]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var type = btn.getAttribute("data-kit-notify") || "info";
      var pack = notifyCopy[type] || notifyCopy.info;
      if (window.WA_NOTIFY && typeof window.WA_NOTIFY[type] === "function") {
        window.WA_NOTIFY[type](pack.text, { title: pack.title });
      } else if (window.WA_NOTIFY) {
        window.WA_NOTIFY.show(pack.text, { type: type, title: pack.title });
      }
    });
  });

  /* —— 组件预览：下拉菜单项 —— */
  var dropdownCopy = {
    edit: "已选择：编辑",
    view: "已选择：查看",
    copy: "链接已复制",
    delete: "已选择：删除",
    pdf: "开始导出 PDF",
    png: "开始导出图片",
  };
  document.querySelectorAll("[data-kit-dropdown-action]").forEach(function (item) {
    item.addEventListener("click", function () {
      var key = item.getAttribute("data-kit-dropdown-action") || "";
      var msg = dropdownCopy[key] || "已选择操作";
      flashFeedback("info", msg);
    });
  });

  /* —— 组件预览：秒杀倒计时 —— */
  (function initKitCountdown() {
    var el = document.querySelector("[data-kit-countdown]");
    if (!el) return;
    var parts = String(el.textContent || "0:0:0").split(":").map(function (n) {
      return parseInt(n, 10) || 0;
    });
    var left = parts[0] * 3600 + parts[1] * 60 + parts[2];
    function pad(n) {
      return n < 10 ? "0" + n : String(n);
    }
    function tick() {
      if (left < 0) left = 0;
      var h = Math.floor(left / 3600);
      var m = Math.floor((left % 3600) / 60);
      var s = left % 60;
      el.textContent = pad(h) + ":" + pad(m) + ":" + pad(s);
      if (left > 0) left -= 1;
    }
    tick();
    setInterval(tick, 1000);
  })();

  /* —— 组件预览：确认框 —— */
  document.querySelectorAll("[data-kit-confirm]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!window.WA_CONFIRM || typeof window.WA_CONFIRM.open !== "function") return;
      window.WA_CONFIRM.open({
        title: "确认删除？",
        message: "删除后不可恢复，是否继续？",
        confirmText: "删除",
        cancelText: "取消",
        danger: true,
      }).then(function (ok) {
        if (ok) flashFeedback("success", "已确认删除");
        else flashFeedback("info", "已取消");
      });
    });
  });

  /* —— 组件预览：表格底栏批量 / 分页 —— */
  var batchCopy = {
    delete: "批量删除（演示）：请先勾选行",
    status: "设置状态（演示）：请先勾选行",
  };
  document.querySelectorAll("[data-kit-batch]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-kit-batch") || "";
      flashFeedback("info", batchCopy[key] || "批量操作（演示）");
    });
  });

  document.querySelectorAll("[data-kit-pagination] [data-kit-page]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (btn.disabled) return;
      var key = btn.getAttribute("data-kit-page") || "";
      if (key === "prev") {
        flashFeedback("info", "已到第一页（演示）");
        return;
      }
      if (key === "next") {
        flashFeedback("info", "切换到第 2 页（演示）");
        return;
      }
      flashFeedback("info", "切换到第 " + key + " 页（演示）");
    });
  });
})();
