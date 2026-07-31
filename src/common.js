function isMobile() {
  return window.innerWidth < 992;
}

function openSidebar() {
  var sidebar = document.getElementById("sidebar");
  var overlay = document.getElementById("sidebarOverlay");
  var btn = document.querySelector(".hamburger-btn");
  sidebar.classList.add("mobile-open");
  overlay.classList.add("active");
  overlay.setAttribute("aria-hidden", "false");
  if (btn) btn.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  var sidebar = document.getElementById("sidebar");
  var overlay = document.getElementById("sidebarOverlay");
  var btn = document.querySelector(".hamburger-btn");
  sidebar.classList.remove("mobile-open");
  overlay.classList.remove("active");
  overlay.setAttribute("aria-hidden", "true");
  if (btn) btn.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}

function toggleSidebar() {
  if (isMobile()) {
    var sidebar = document.getElementById("sidebar");
    if (sidebar.classList.contains("mobile-open")) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }
}

document.getElementById("sidebarOverlay").addEventListener("click", closeSidebar);

document.addEventListener("keydown", function(e) {
  if (e.key === "Escape" && document.getElementById("sidebar").classList.contains("mobile-open")) {
    closeSidebar();
  }
});

window.addEventListener("resize", function() {
  if (!isMobile()) {
    closeSidebar();
  }
});

document.querySelectorAll("#sidebar .nav-link").forEach(function(link) {
  link.addEventListener("click", function() {
    if (isMobile()) {
      closeSidebar();
    }
  });
});

/* === Admin Login Modal === */
function showAdminLogin() {
  var m = document.getElementById("adminLoginModal");
  if (m) m.style.display = "flex";
}
function hideAdminLogin() {
  var m = document.getElementById("adminLoginModal");
  if (m) m.style.display = "none";
  var pw = document.getElementById("adminLoginPw");
  var msg = document.getElementById("adminLoginMsg");
  if (pw) pw.value = "";
  if (msg) msg.innerHTML = "";
}
function doAdminLogin() {
  var pw = document.getElementById("adminLoginPw").value.trim();
  var msg = document.getElementById("adminLoginMsg");
  if (!pw) { msg.innerHTML = '<div class="alert alert-warning py-2 small">Enter password</div>'; return; }
  msg.innerHTML = '<div class="text-center"><div class="spinner-border text-success spinner-border-sm"></div></div>';
  fetch("https://kiganjani-api.vercel.app/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: pw })
  }).then(function(r) {
    return r.json().then(function(d) { return { ok: r.ok, data: d }; });
  }).then(function(resp) {
    if (resp.ok) {
      sessionStorage.setItem("isAdminLoggedIn", "true");
      sessionStorage.setItem("adminPassword", pw);
      window.location.href = "admin.html";
    } else {
      msg.innerHTML = '<div class="alert alert-danger py-2 small">' + (resp.data.message || "Login failed") + "</div>";
    }
  }).catch(function() {
    msg.innerHTML = '<div class="alert alert-danger py-2 small">Server error</div>';
  });
}
(function() {
  var m = document.createElement("div");
  m.id = "adminLoginModal";
  m.style.display = "none";
  m.style.cssText = "display:none;position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:rgba(0,0,0,.6);backdrop-filter:blur(2px);align-items:center;justify-content:center;";
  m.innerHTML = '<div style="max-width:400px;width:90%"><div class="card shadow border-0"><div class="card-body p-4 text-center"><button onclick="hideAdminLogin()" style="position:absolute;top:8px;right:12px;font-size:1.5rem;border:none;background:none;cursor:pointer;color:#6c757d;line-height:1;" title="Close">&times;</button><i class="bi bi-shield-lock text-success" style="font-size:3rem;"></i><h4 class="fw-bold mt-2">Admin Dashboard</h4><p class="text-muted small">Enter your admin password</p><div id="adminLoginMsg"></div><div class="mb-3"><input type="password" id="adminLoginPw" class="form-control form-control-lg" placeholder="Password" onkeydown="if(event.key===\'Enter\')doAdminLogin()"></div><button class="btn btn-success btn-lg w-100" onclick="doAdminLogin()">Login</button></div></div></div>';
  m.addEventListener("click", function(e) { if (e.target === m) hideAdminLogin(); });
  document.body.appendChild(m);
})();
