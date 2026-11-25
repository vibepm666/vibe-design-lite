(function () {
  var list = document.getElementById("msg-list");
  var tabs = document.querySelectorAll("[data-msg-tab]");
  var active = "all";

  function applyFilter() {
    if (!list) return;
    list.querySelectorAll(".wa-shell-msg").forEach(function (el) {
      var kind = el.getAttribute("data-msg-kind") || "";
      var unread = el.classList.contains("is-unread");
      var show =
        active === "all" ||
        (active === "unread" && unread) ||
        (active === "system" && kind === "system");
      el.hidden = !show;
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      active = tab.getAttribute("data-msg-tab") || "all";
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      applyFilter();
    });
  });

  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-msg-read]");
    if (!btn) return;
    var item = btn.closest(".wa-shell-msg");
    if (item) item.classList.remove("is-unread");
    if (window.WA_MESSAGE) WA_MESSAGE.success("已标为已读");
    applyFilter();
  });

  var readAll = document.getElementById("msg-read-all");
  if (readAll) {
    readAll.addEventListener("click", function () {
      if (list) {
        list.querySelectorAll(".wa-shell-msg.is-unread").forEach(function (el) {
          el.classList.remove("is-unread");
        });
      }
      if (window.WA_MESSAGE) WA_MESSAGE.success("已全部标为已读");
      applyFilter();
    });
  }
})();
