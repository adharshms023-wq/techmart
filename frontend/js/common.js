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

const MENU = [
  { key: "dashboard", label: "Dashboard", href: "dashboard.html" },
  { key: "products", label: "Products", href: "products.html" },
  { key: "inventory", label: "Inventory", href: "inventory.html" },
  { key: "orders", label: "Orders", href: "orders.html" },
  { key: "customers", label: "Customers", href: "customers.html" },
  { key: "notifications", label: "Notifications", href: "notifications.html" },
  { key: "reports", label: "Reports", href: "reports.html" },
];

function renderLayout(activeKey, title) {
  const links = MENU.map(
    (m) =>
      '<a href="' + m.href + '" class="nav-link text-white rounded mb-1 ' +
      (m.key === activeKey ? "bg-primary" : "") + '">' + m.label + "</a>"
  ).join("");

  document.getElementById("sidebar").innerHTML =
    '<h5 class="mb-4">TechMart</h5>' + '<nav class="nav flex-column">' + links + "</nav>";

  const name = localStorage.getItem("adminName") || "Admin";
  document.getElementById("topbar").innerHTML =
    '<h5 class="mb-0">' + title + "</h5>" +
    "<div>" +
    '<span class="me-3 text-muted">' + name + "</span>" +
    '<button class="btn btn-outline-secondary btn-sm" onclick="logout()">Logout</button>' +
    "</div>";
}