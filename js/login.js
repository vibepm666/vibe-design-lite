/**
 * 登录页：校验、弹层、验证码示意（原型无真实鉴权）
 */
(function () {
  "use strict";

  var DEMO_USER = "admin";
  var DEMO_PASS = "123456";
  var DEMO_CODE = "123456";
  var CODE_SECONDS = 60;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function tip(type, text) {
    if (window.WA_MESSAGE && typeof window.WA_MESSAGE[type] === "function") {
      window.WA_MESSAGE[type](text);
      return;
    }
    if (window.WA_MESSAGE) window.WA_MESSAGE.show(text, { type: type });
  }

  function setFieldError(scope, name, message) {
    var item = document.querySelector("[data-" + scope + "-field=\"" + name + "\"]");
    var err = document.querySelector("[data-" + scope + "-error=\"" + name + "\"]");
    if (!item) return;
    var bad = !!message;
    item.classList.toggle("is-error", bad);
    if (err) err.textContent = bad ? message : "";
  }

  function clearFieldError(scope, name) {
    setFieldError(scope, name, "");
  }

  function clearItemError(item) {
    if (!item || !item.classList) return;
    item.classList.remove("is-error");
    var err = item.querySelector(".wa-field__error");
    if (err) err.textContent = "";
  }

  /* 聚焦输入时隐藏当前项校验提示 */
  document.addEventListener("focusin", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (!t.closest("input, textarea, select, .wa-otp__cell, .wa-login__send")) return;
    var item = t.closest(".wa-form-item.is-error");
    if (item) clearItemError(item);
  });

  /* —— 弹窗 —— */
  var modalReturn = null;

  function openModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    modalReturn = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("wa-modal-open");
    var panel = modal.querySelector(".wa-modal__panel");
    if (panel) window.setTimeout(function () { panel.focus(); }, 0);
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    if (!document.querySelector(".wa-modal.is-open")) {
      document.body.classList.remove("wa-modal-open");
    }
    if (modalReturn && typeof modalReturn.focus === "function") {
      try { modalReturn.focus(); } catch (e) {}
    }
    modalReturn = null;
  }

  document.querySelectorAll("[data-modal-open]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openModal(btn.getAttribute("data-modal-open"));
    });
  });

  document.querySelectorAll(".wa-modal").forEach(function (modal) {
    modal.querySelectorAll("[data-modal-close]").forEach(function (el) {
      el.addEventListener("click", function () { closeModal(modal); });
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var open = document.querySelector(".wa-modal.is-open");
    if (open) closeModal(open);
  });

  /* —— 显示密码 —— */
  document.querySelectorAll("[data-toggle-password]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-toggle-password");
      var input = document.getElementById(id);
      if (!input) return;
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-label", show ? "隐藏密码" : "显示密码");
      var icon = btn.querySelector("i");
      if (icon) {
        icon.className = show ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
        icon.setAttribute("aria-hidden", "true");
      }
    });
  });

  /* —— 主登录 —— */
  var form = document.getElementById("login-form");
  var submitBtn = document.getElementById("login-submit");
  if (form) {
    ["login-user", "login-password"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", function () {
        clearFieldError("login", id === "login-user" ? "user" : "password");
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var user = String((document.getElementById("login-user") || {}).value || "").trim();
      var pwd = String((document.getElementById("login-password") || {}).value || "");
      var userErr = user ? "" : "用户名不能为空";
      var pwdErr = pwd ? "" : "密码不能为空";
      setFieldError("login", "user", userErr);
      setFieldError("login", "password", pwdErr);
      if (userErr || pwdErr) return;
      if (user !== DEMO_USER) {
        setFieldError("login", "user", "用户名不正确");
        return;
      }
      if (pwd !== DEMO_PASS) {
        setFieldError("login", "password", "密码不正确");
        return;
      }
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "登录中…";
      }
      window.setTimeout(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "登录";
        }
        tip("success", "登录成功");
        window.setTimeout(function () {
          window.location.href = "./shell-dashboard.html";
        }, 600);
      }, 380);
    });
  }

  document.querySelectorAll("[data-social]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      tip("info", btn.getAttribute("data-social") + "登录");
    });
  });

  /* —— 验证码倒计时 —— */
  var codeState = {
    forget: { sent: false, left: 0, timer: null },
    register: { sent: false, left: 0, timer: null },
  };

  function syncSendBtn(kind) {
    var btn = document.querySelector("[data-send-code=\"" + kind + "\"]");
    if (!btn) return;
    var st = codeState[kind];
    if (st.left > 0) {
      btn.disabled = true;
      btn.textContent = st.left + "s";
      return;
    }
    btn.disabled = false;
    btn.textContent = st.sent ? "重新发送" : "发送验证码";
  }

  function startCountdown(kind) {
    var st = codeState[kind];
    if (st.timer) window.clearInterval(st.timer);
    st.left = CODE_SECONDS;
    syncSendBtn(kind);
    st.timer = window.setInterval(function () {
      st.left -= 1;
      if (st.left <= 0) {
        window.clearInterval(st.timer);
        st.timer = null;
        st.left = 0;
      }
      syncSendBtn(kind);
    }, 1000);
  }

  function readOtp(kind) {
    var root = document.querySelector("[data-otp=\"" + kind + "\"]");
    if (!root) return "";
    var cells = root.querySelectorAll(".wa-otp__cell");
    var out = "";
    for (var i = 0; i < cells.length; i += 1) {
      out += String(cells[i].value || "").replace(/\D/g, "").slice(0, 1);
    }
    var hidden = document.getElementById(kind + "-code");
    if (hidden) hidden.value = out;
    return out;
  }

  function fillOtp(kind, digits) {
    var root = document.querySelector("[data-otp=\"" + kind + "\"]");
    if (!root) return;
    var cells = root.querySelectorAll(".wa-otp__cell");
    var chars = String(digits || "").replace(/\D/g, "").slice(0, cells.length);
    for (var i = 0; i < cells.length; i += 1) {
      cells[i].value = chars.charAt(i) || "";
    }
    readOtp(kind);
  }

  function bindOtp(kind) {
    var root = document.querySelector("[data-otp=\"" + kind + "\"]");
    if (!root) return;
    var cells = Array.prototype.slice.call(root.querySelectorAll(".wa-otp__cell"));

    cells.forEach(function (cell, index) {
      cell.addEventListener("input", function () {
        var v = String(cell.value || "").replace(/\D/g, "");
        if (v.length > 1) {
          fillOtp(kind, (readOtp(kind).slice(0, index) + v).slice(0, 6));
          var next = Math.min(index + v.length, cells.length - 1);
          cells[next].focus();
        } else {
          cell.value = v.slice(0, 1);
          readOtp(kind);
          if (v && index < cells.length - 1) cells[index + 1].focus();
        }
        clearFieldError(kind, "code");
      });

      cell.addEventListener("keydown", function (e) {
        if (e.key === "Backspace" && !cell.value && index > 0) {
          cells[index - 1].focus();
          cells[index - 1].value = "";
          readOtp(kind);
          e.preventDefault();
        }
        if (e.key === "ArrowLeft" && index > 0) {
          cells[index - 1].focus();
          e.preventDefault();
        }
        if (e.key === "ArrowRight" && index < cells.length - 1) {
          cells[index + 1].focus();
          e.preventDefault();
        }
      });

      cell.addEventListener("paste", function (e) {
        e.preventDefault();
        var text = "";
        try {
          text = (e.clipboardData || window.clipboardData).getData("text") || "";
        } catch (err) {}
        fillOtp(kind, text);
        var len = String(text || "").replace(/\D/g, "").length;
        cells[Math.min(Math.max(len, 1), cells.length) - 1].focus();
        clearFieldError(kind, "code");
      });

      cell.addEventListener("focus", function () {
        cell.select();
      });
    });
  }

  bindOtp("forget");
  bindOtp("register");

  document.querySelectorAll("[data-send-code]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var kind = btn.getAttribute("data-send-code");
      var emailId = kind === "forget" ? "forget-email" : "register-email";
      var email = String((document.getElementById(emailId) || {}).value || "").trim();
      var err = !email ? "请输入邮箱" : EMAIL_RE.test(email) ? "" : "请输入正确的邮箱地址";
      setFieldError(kind, "email", err);
      if (err) return;
      codeState[kind].sent = true;
      tip("success", "验证码已发送（演示码 " + DEMO_CODE + "）");
      startCountdown(kind);
      var otpRoot = document.querySelector("[data-otp=\"" + kind + "\"]");
      if (otpRoot) {
        var first = otpRoot.querySelector(".wa-otp__cell");
        if (first) first.focus();
      }
    });
  });

  function validateCode(kind, code) {
    var st = codeState[kind];
    var value = String(code || "").replace(/\s/g, "");
    if (!st.sent) return "请先发送验证码";
    if (!value) return "请输入验证码";
    if (value.length < 6) return "请输入 6 位验证码";
    if (value !== DEMO_CODE) return "验证码错误，演示码为 123456";
    return "";
  }

  /* —— 忘记密码 —— */
  var forgetSubmit = document.getElementById("forget-submit");
  if (forgetSubmit) {
    forgetSubmit.addEventListener("click", function () {
      var email = String((document.getElementById("forget-email") || {}).value || "").trim();
      var code = readOtp("forget");
      var pwd = String((document.getElementById("forget-password") || {}).value || "");
      var confirm = String((document.getElementById("forget-confirm") || {}).value || "");
      var emailErr = !email ? "请输入邮箱" : EMAIL_RE.test(email) ? "" : "请输入正确的邮箱地址";
      var codeErr = validateCode("forget", code);
      var pwdErr = !pwd ? "请输入新密码" : pwd.length < 6 ? "密码至少 6 位" : "";
      var confirmErr = !confirm ? "请再次输入密码" : confirm !== pwd ? "两次密码不一致" : "";
      setFieldError("forget", "email", emailErr);
      setFieldError("forget", "code", codeErr);
      setFieldError("forget", "password", pwdErr);
      setFieldError("forget", "confirm", confirmErr);
      if (emailErr || codeErr || pwdErr || confirmErr) return;
      tip("success", "密码已重置");
      closeModal(document.getElementById("forget-modal"));
    });
  }

  /* —— 注册 —— */
  var registerSubmit = document.getElementById("register-submit");
  if (registerSubmit) {
    registerSubmit.addEventListener("click", function () {
      var user = String((document.getElementById("register-user") || {}).value || "").trim();
      var email = String((document.getElementById("register-email") || {}).value || "").trim();
      var code = readOtp("register");
      var pwd = String((document.getElementById("register-password") || {}).value || "");
      var confirm = String((document.getElementById("register-confirm") || {}).value || "");
      var userErr = !user ? "请输入用户名" : user.length < 2 ? "用户名至少 2 个字符" : "";
      var emailErr = !email ? "请输入邮箱" : EMAIL_RE.test(email) ? "" : "请输入正确的邮箱地址";
      var codeErr = validateCode("register", code);
      var pwdErr = !pwd ? "请输入密码" : pwd.length < 6 ? "密码至少 6 位" : "";
      var confirmErr = !confirm ? "请再次输入密码" : confirm !== pwd ? "两次密码不一致" : "";
      setFieldError("register", "user", userErr);
      setFieldError("register", "email", emailErr);
      setFieldError("register", "code", codeErr);
      setFieldError("register", "password", pwdErr);
      setFieldError("register", "confirm", confirmErr);
      if (userErr || emailErr || codeErr || pwdErr || confirmErr) return;
      tip("success", "注册成功");
      closeModal(document.getElementById("register-modal"));
    });
  }
})();
