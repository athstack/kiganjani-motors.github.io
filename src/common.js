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
