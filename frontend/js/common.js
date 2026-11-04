const API = "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("token");
}

function getUserRole() {
  return localStorage.getItem("userRole") || (localStorage.getItem("adminName") ? "admin" : "customer");
}

function requireLogin() {
  if (!getToken()) {
    window.location.href = "login.html";
  }
}

function requireAdmin() {
  requireLogin();
  if (getUserRole() !== "admin") {
    // If a customer tries to access Admin pages, send them to Customer Storefront
    window.location.href = "store.html";
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("adminName");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
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
    '<div class="side-label">Admin Management</div>' +
    '<nav>' + links + "</nav>" +
    '<hr class="my-3 mx-3 opacity-25" style="border-color: rgba(255,255,255,0.2);">' +
    '<div class="side-label">Customer View</div>' +
    '<a href="store.html" class="side-link" title="Open Customer Storefront">' +
    '<i class="bi bi-shop text-success"></i><span>Customer Store</span>' +
    '<span class="badge bg-success ms-auto" style="font-size: 0.65rem;">Store</span></a>';

  const name = localStorage.getItem("adminName") || localStorage.getItem("userName") || "Admin";
  const initial = name.charAt(0).toUpperCase();

  document.getElementById("topbar").innerHTML =
    '<div class="d-flex align-items-center gap-2">' +
    '<h5 class="mb-0">' + title + "</h5>" +
    '<span class="badge bg-dark-subtle text-dark border ms-2 d-none d-sm-inline-block">Admin Panel</span>' +
    "</div>" +
    '<div class="d-flex align-items-center gap-2 gap-sm-3">' +
    '<a href="store.html" class="btn btn-outline-success btn-sm d-flex align-items-center gap-1" title="Switch to Customer Store">' +
    '<i class="bi bi-shop"></i><span class="d-none d-md-inline">Customer Store</span></a>' +
    '<a href="notifications.html" class="bell" title="Notifications">' +
    '<i class="bi bi-bell"></i><span id="bellCount" class="bell-count d-none"></span></a>' +
    '<div class="avatar">' + initial + "</div>" +
    '<span class="fw-semibold d-none d-md-inline">' + name + "</span>" +
    '<button class="btn btn-outline-secondary btn-sm" onclick="logout()">' +
    '<i class="bi bi-box-arrow-right"></i> <span class="d-none d-sm-inline">Logout</span></button>' +
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
