(function () {
  var params = new URLSearchParams(window.location.search || "");
  var mode = params.get("mode") === "edit" ? "edit" : "create";
  var id = params.get("id") || "";
  var title = document.getElementById("form-title");
  var sub = document.getElementById("form-sub");
  var submit = document.getElementById("ticket-submit");
  var cancel = document.getElementById("form-cancel");
  var form = document.getElementById("ticket-page-form");
  var draft = document.getElementById("ticket-draft");
  var completeEl = document.querySelector("[data-form-complete]");
  var completeBar = document.querySelector("[data-form-complete-bar]");
  var remainEl = document.querySelector("[data-form-remain]");

  if (cancel) {
    cancel.href = "./shell-detail.html?id=" + encodeURIComponent(id || "t1");
  }

  if (mode === "edit") {
    if (title) title.textContent = "编辑工单";
    if (window.WA_SHELL && typeof WA_SHELL.setCrumbExtra === "function") {
      WA_SHELL.setCrumbExtra("编辑工单");
    }
    if (sub) sub.innerHTML = "带 <span class=\"wa-req\">*</span> 为必填项；保存后返回详情页。";
    if (submit) submit.textContent = "保存工单";
    var map = {
      "ticket-title": "登录页验证码无法发送",
      "ticket-type": "故障",
      "ticket-priority": "P1",
      "ticket-channel": "站内反馈",
      "ticket-severity": "较重",
      "ticket-customer": "重点",
      "ticket-bizline": "增长",
      "ticket-reporter": "李晓雯",
      "ticket-assignee": "陈可",
      "ticket-due": "2026-11-22T18:00",
      "ticket-product": "会员中心",
      "ticket-status": "处理中",
      "ticket-watcher": "周宁",
      "ticket-impact": "约 12% 新用户",
      "ticket-region": "华东",
      "ticket-sla": "加速",
      "ticket-note": "部分用户在登录页点击「获取验证码」无响应；弱网与高峰时段更明显。",
      "ticket-env": "Chrome 131 / Windows 11 · 生产环境 · 手机号段 138****",
      "ticket-expect": "1）验证码 5 秒内下发；2）失败时给出明确提示与重试入口",
      "ticket-workaround": "高峰时段引导用户改用邮件验证码",
    };
    Object.keys(map).forEach(function (fid) {
      var el = document.getElementById(fid);
      if (!el) return;
      el.value = map[fid];
      if (el.tagName === "TEXTAREA") {
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    [
      "ticket-type",
      "ticket-priority",
      "ticket-channel",
      "ticket-severity",
      "ticket-customer",
      "ticket-bizline",
      "ticket-product",
      "ticket-status",
      "ticket-region",
      "ticket-sla",
    ].forEach(function (fid) {
      var el = document.getElementById(fid);
      if (el) el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    if (window.WA_FIELD && typeof WA_FIELD.bindTextareaCount === "function") {
      WA_FIELD.bindTextareaCount(form || document);
    }
    document.querySelectorAll("[data-ticket-tags] [data-tag]").forEach(function (btn) {
      var tag = btn.getAttribute("data-tag");
      if (tag === "登录" || tag === "短信") {
        btn.classList.add("is-active", "wa-chip--accent");
      }
    });
  }

  var tagGroup = document.querySelector("[data-ticket-tags]");
  if (tagGroup) {
    tagGroup.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-tag]");
      if (!btn || !tagGroup.contains(btn)) return;
      var active = tagGroup.querySelectorAll(".is-active");
      if (!btn.classList.contains("is-active") && active.length >= 3) {
        if (window.WA_MESSAGE) WA_MESSAGE.info("最多选择 3 个模块");
        return;
      }
      btn.classList.toggle("is-active");
      btn.classList.toggle("wa-chip--accent");
    });
  }

  function updateComplete() {
    var required = form ? form.querySelectorAll("[data-form-required]") : [];
    var total = required.length;
    var filled = 0;
    required.forEach(function (item) {
      var field = item.querySelector("input, select, textarea");
      if (field && String(field.value || "").trim()) filled += 1;
    });
    var pct = total ? Math.round((filled / total) * 100) : 0;
    var remain = Math.max(0, total - filled);
    if (completeEl) completeEl.textContent = pct + "%";
    if (completeBar) completeBar.style.width = pct + "%";
    if (remainEl) {
      remainEl.textContent = remain
        ? "还有 " + remain + " 项必填未完成"
        : "必填项已全部填写";
    }
  }

  if (form) {
    form.addEventListener("input", updateComplete);
    form.addEventListener("change", updateComplete);
    updateComplete();
  }

  if (draft) {
    draft.addEventListener("click", function () {
      if (window.WA_MESSAGE) WA_MESSAGE.success("草稿已保存");
    });
  }

  if (!form) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (window.WA_FORM && typeof WA_FORM.validate === "function") {
      var check = WA_FORM.validate(form);
      if (!check.ok) {
        updateComplete();
        if (check.firstBad) {
          try {
            var focusEl =
              window.WA_COMBO && typeof window.WA_COMBO.focusTarget === "function"
                ? window.WA_COMBO.focusTarget(check.firstBad)
                : check.firstBad;
            if (focusEl) focusEl.focus();
            (focusEl || check.firstBad).scrollIntoView({
              block: "center",
              behavior: "smooth",
            });
          } catch (err) {}
        }
        return;
      }
    }
    if (window.WA_MESSAGE) {
      WA_MESSAGE.success(mode === "edit" ? "工单已保存" : "工单已创建");
    }
    window.setTimeout(function () {
      window.location.href =
        "./shell-detail.html?id=" + encodeURIComponent(id || "t1");
    }, 500);
  });
})();
