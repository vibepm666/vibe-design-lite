(function () {
  var params = new URLSearchParams(window.location.search || "");
  var id = params.get("id") || "t1";
  var edit = document.getElementById("detail-edit");
  if (edit) edit.href = "./shell-form.html?mode=edit&id=" + encodeURIComponent(id);

  var actionTips = {
    assign: "已打开转派流程",
    watch: "已关注本工单",
    close: "工单已关闭",
  };
  document.querySelectorAll("[data-detail-action]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-detail-action");
      if (window.WA_MESSAGE) WA_MESSAGE.info(actionTips[key] || "操作示意");
    });
  });

  var tabs = document.querySelectorAll("[data-detail-tab]");
  var panels = document.querySelectorAll("[data-detail-panel]");
  var meta = document.querySelector("[data-detail-tab-meta]");
  var metaMap = { logs: "3 条记录", people: "3 人", changes: "3 条变更" };

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var key = tab.getAttribute("data-detail-tab");
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach(function (p) {
        p.hidden = p.getAttribute("data-detail-panel") !== key;
      });
      if (meta) meta.textContent = metaMap[key] || "";
    });
  });
})();
