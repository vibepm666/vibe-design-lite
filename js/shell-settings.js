(function () {
  var params = new URLSearchParams(window.location.search || "");
  var hash = (window.location.hash || "").replace(/^#/, "");
  var initial = params.get("tab") || hash || "profile";
  var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-settings-tab]"));
  var panels = Array.prototype.slice.call(document.querySelectorAll("[data-settings-panel]"));

  function showTab(id) {
    var target = id || "profile";
    var found = false;
    tabs.forEach(function (tab) {
      var on = tab.getAttribute("data-settings-tab") === target;
      if (on) found = true;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
    });
    if (!found) {
      target = "profile";
      tabs.forEach(function (tab) {
        var on = tab.getAttribute("data-settings-tab") === "profile";
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
      });
    }
    panels.forEach(function (panel) {
      var on = panel.getAttribute("data-settings-panel") === target;
      panel.hidden = !on;
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var id = tab.getAttribute("data-settings-tab") || "profile";
      showTab(id);
      try {
        var url = new URL(window.location.href);
        url.searchParams.set("tab", id);
        url.hash = "";
        window.history.replaceState({}, "", url.pathname + url.search);
      } catch (err) {}
    });
  });

  showTab(initial);

  var themeBtns = document.querySelectorAll("[data-settings-theme]");
  function syncThemeUi() {
    var dark = window.WA_THEME && typeof WA_THEME.isDark === "function" ? WA_THEME.isDark() : false;
    var mode = dark ? "dark" : "light";
    themeBtns.forEach(function (btn) {
      var on = btn.getAttribute("data-settings-theme") === mode;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
  }

  themeBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var mode = btn.getAttribute("data-settings-theme");
      if (!window.WA_THEME) return;
      var wantDark = mode === "dark";
      if (typeof WA_THEME.applyDark === "function") WA_THEME.applyDark(wantDark);
      if (typeof WA_THEME.persistDark === "function") WA_THEME.persistDark(wantDark);
      syncThemeUi();
      if (window.WA_MESSAGE) {
        WA_MESSAGE.success(wantDark ? "已切换为深色主题" : "已切换为浅色主题");
      }
    });
  });
  syncThemeUi();

  function tip(text, type) {
    if (window.WA_MESSAGE && typeof WA_MESSAGE[type || "success"] === "function") {
      WA_MESSAGE[type || "success"](text);
    }
  }

  var profileForm = document.getElementById("settings-profile-form");
  if (profileForm) {
    profileForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (window.WA_FORM && typeof WA_FORM.validate === "function") {
        var check = WA_FORM.validate(profileForm);
        if (!check.ok) {
          if (check.firstBad) {
            try {
              check.firstBad.focus();
            } catch (err) {}
          }
          return;
        }
      }
      tip("账号资料已保存");
    });
  }

  var notifySave = document.getElementById("settings-notify-save");
  if (notifySave) {
    notifySave.addEventListener("click", function () {
      tip("通知偏好已保存");
    });
  }

  var securityForm = document.getElementById("settings-security-form");
  if (securityForm) {
    securityForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var cur = document.getElementById("settings-pwd-current");
      var next = document.getElementById("settings-pwd-new");
      var again = document.getElementById("settings-pwd-confirm");
      var c = cur ? String(cur.value || "") : "";
      var n = next ? String(next.value || "") : "";
      var a = again ? String(again.value || "") : "";
      if (!c || !n || !a) {
        tip("请完整填写密码字段", "warning");
        return;
      }
      if (n.length < 8) {
        tip("新密码至少 8 位", "warning");
        return;
      }
      if (n !== a) {
        tip("两次输入的新密码不一致", "warning");
        return;
      }
      tip("密码已更新");
      securityForm.reset();
    });
  }

  var emailForm = document.getElementById("settings-email-form");
  var emailSend = document.getElementById("settings-email-send");
  var emailSendTimer = null;
  var emailSendLeft = 0;

  function syncEmailSendBtn() {
    if (!emailSend) return;
    if (emailSendLeft > 0) {
      emailSend.disabled = true;
      emailSend.textContent = emailSendLeft + "s 后重发";
    } else {
      emailSend.disabled = false;
      emailSend.textContent = "获取验证码";
    }
  }

  if (emailSend) {
    emailSend.addEventListener("click", function () {
      var next = document.getElementById("settings-email-new");
      var val = next ? String(next.value || "").trim() : "";
      var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!val || !emailRe.test(val)) {
        if (next) {
          try {
            next.focus();
          } catch (err) {}
        }
        tip("请先填写有效的新邮箱", "warning");
        return;
      }
      if (emailSendLeft > 0) return;
      tip("验证码已发送至新邮箱");
      emailSendLeft = 60;
      syncEmailSendBtn();
      if (emailSendTimer) window.clearInterval(emailSendTimer);
      emailSendTimer = window.setInterval(function () {
        emailSendLeft -= 1;
        if (emailSendLeft <= 0) {
          emailSendLeft = 0;
          window.clearInterval(emailSendTimer);
          emailSendTimer = null;
        }
        syncEmailSendBtn();
      }, 1000);
    });
  }

  if (emailForm) {
    emailForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (window.WA_FORM && typeof WA_FORM.validate === "function") {
        var check = WA_FORM.validate(emailForm);
        if (!check.ok) {
          if (check.firstBad) {
            try {
              check.firstBad.focus();
            } catch (err) {}
          }
          return;
        }
      }
      var next = document.getElementById("settings-email-new");
      var code = document.getElementById("settings-email-code");
      var cur = document.getElementById("settings-email-current");
      var profileEmail = document.getElementById("settings-email");
      var nextVal = next ? String(next.value || "").trim() : "";
      var codeVal = code ? String(code.value || "").trim() : "";
      if (codeVal.length < 4) {
        tip("请输入完整验证码", "warning");
        return;
      }
      if (cur) cur.value = nextVal;
      if (profileEmail) profileEmail.value = nextVal;
      tip("邮箱已更换");
      if (next) next.value = "";
      if (code) code.value = "";
    });
  }

  var revokeOthers = document.getElementById("settings-revoke-others");
  if (revokeOthers) {
    revokeOthers.addEventListener("click", function () {
      function done() {
        tip("已退出其他设备");
      }
      if (window.WA_CONFIRM && typeof WA_CONFIRM.open === "function") {
        WA_CONFIRM.open({
          title: "退出其他设备？",
          message: "将使除本机以外的登录会话失效。",
          confirmText: "确认退出",
          danger: true,
        }).then(function (ok) {
          if (ok) done();
        });
        return;
      }
      done();
    });
  }
})();
