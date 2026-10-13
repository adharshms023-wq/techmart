const API = "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("token");
}

function requireLogin() {
  if (!getToken()) {
    window.location.href = "login.html";
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("adminName");
  window.location.href = "login.html";
}

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken(),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    logout();
    throw new Error("Session expired");
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

// Load the icon font and the theme on every page that uses this file
(function loadTheme() {
  const files = [
    "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css",
    "css/theme.css",
  ];
  files.forEach((href) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  });
})();

const MENU = [
  { key: "dashboard", label: "Dashboard", href: "dashboard.html", icon: "bi-speedometer2" },
  { key: "products", label: "Products", href: "products.html", icon: "bi-box-seam" },
  { key: "inventory", label: "Inventory", href: "inventory.html", icon: "bi-boxes" },
  { key: "orders", label: "Orders", href: "orders.html", icon: "bi-bag-check" },
  { key: "customers", label: "Customers", href: "customers.html", icon: "bi-people" },
  { key: "notifications", label: "Notifications", href: "notifications.html", icon: "bi-bell" },
  { key: "reports", label: "Reports", href: "reports.html", icon: "bi-bar-chart-line" },
];

function renderLayout(activeKey, title) {
  const links = MENU.map(
    (m) =>
      '<a href="' + m.href + '" class="side-link' +
      (m.key === activeKey ? " active" : "") + '">' +
      '<i class="bi ' + m.icon + '"></i><span>' + m.label + "</span></a>"
  ).join("");

  document.getElementById("sidebar").innerHTML =
    '<div class="brand"><div class="brand-icon"><i class="bi bi-lightning-charge-fill"></i></div><span>TechMart</span></div>' +
    '<div class="side-label">Menu</div>' +
    '<nav>' + links + "</nav>";

  const name = localStorage.getItem("adminName") || "Admin";
  const initial = name.charAt(0).toUpperCase();

  document.getElementById("topbar").innerHTML =
    '<h5 class="mb-0">' + title + "</h5>" +
    '<div class="d-flex align-items-center gap-3">' +
    '<a href="notifications.html" class="bell" title="Notifications">' +
    '<i class="bi bi-bell"></i><span id="bellCount" class="bell-count d-none"></span></a>' +
    '<div class="avatar">' + initial + "</div>" +
    '<span class="fw-semibold">' + name + "</span>" +
    '<button class="btn btn-outline-secondary btn-sm" onclick="logout()">' +
    '<i class="bi bi-box-arrow-right"></i> Logout</button>' +
    "</div>";

  loadBellCount();
}

// Show the number of unread notifications on the bell
async function loadBellCount() {
  try {
    const data = await api("/notifications?unread=true");
    const badge = document.getElementById("bellCount");
    if (badge && data.count > 0) {
      badge.textContent = data.count;
      badge.classList.remove("d-none");
    }
  } catch (err) {
    // the bell is optional, so ignore errors
  }
}