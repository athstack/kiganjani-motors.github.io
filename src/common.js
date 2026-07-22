function isMobile() {
  return window.innerWidth < 992;
}

function openSidebar() {
  var sidebar = document.getElementById("sidebar");
  var overlay = document.getElementById("sidebarOverlay");
  sidebar.classList.add("mobile-open");
  overlay.classList.add("active");
  overlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  var sidebar = document.getElementById("sidebar");
  var overlay = document.getElementById("sidebarOverlay");
  sidebar.classList.remove("mobile-open");
  overlay.classList.remove("active");
  overlay.setAttribute("aria-hidden", "true");
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

/* === Sidebar active state on load === */
(function() {
  var currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("#sidebar .nav-link").forEach(function(link) {
    var href = link.getAttribute("href");
    if (!href || href.charAt(0) === "#") return;
    if (href === currentPage) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    } else {
      link.classList.remove("active");
      link.removeAttribute("aria-current");
    }
  });
})();

/* === Admin overlay (hash-based #admin) === */
(function() {
  var overlay = document.createElement("div");
  overlay.id = "adminOverlayWrap";
  overlay.style.cssText = "display:none;position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:#000;";
  overlay.innerHTML = '<iframe src="admin.html" style="width:100%;height:100%;border:none;"></iframe>';
  document.body.appendChild(overlay);

  function syncAdmin() {
    if (window.location.hash === "#admin") {
      overlay.style.display = "block";
      document.body.style.overflow = "hidden";
    } else {
      overlay.style.display = "none";
      document.body.style.overflow = "";
    }
  }

  window.addEventListener("hashchange", syncAdmin);
  syncAdmin();

  window.addEventListener("message", function(e) {
    if (e.data === "closeAdmin") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
      syncAdmin();
    }
  });
})();
