# TechMart – Admin-Centric E-Commerce Management System

TechMart is a web-based administrative system for a consumer electronics retailer. It replaces manual handling of products, inventory, orders and customers with one secure, centralized dashboard.

**Status:** work in progress. The backend is complete, and the frontend is partly built (see [Project status](#project-status)).

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript, Bootstrap 5 |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, accessed with Mongoose |
| Authentication | JWT (JSON Web Tokens), bcryptjs for password hashing |
| External API | DummyJSON (product import) |
| Tools | VS Code, Git/GitHub, Thunder Client |

---

## Features built so far

### Backend
- **Admin login:** passwords are stored as bcrypt hashes, and a successful login returns a JWT that expires after 1 day.
- **Route guard:** middleware that checks the token on every protected route.
- **Products:** add, list, view one, edit, delete.
- **Inventory:** low-stock list (`/api/products/low-stock?limit=10`), sorted with the lowest stock first.
- **Orders:**
  - Placing an order checks stock first, then subtracts it, and the server calculates the total.
  - Status flow: `pending → shipped → delivered`, or `pending → cancelled`.
  - Cancelling an order puts the stock back.
- **Customers:** add, list, view, edit, and see a customer's orders with order count and total spent.
- **Notifications:** alerts are saved automatically for new orders and for products that fall to 10 units or less. They can be filtered to unread and marked as read.
- **External product API import:** fetches products from DummyJSON, validates them, converts them to the TechMart format (renamed fields, price converted from USD to INR), skips duplicates by name, and saves the rest.
- **Reports:**
  - Summary: totals for products, customers, orders, revenue, low-stock count and orders by status.
  - Top-selling products.
  - Sales per day (grouped by Indian calendar date).

### Frontend
- Login page.
- Shared layout: sidebar menu, top bar, logout, and a login check on every page (`js/common.js`).
- Dashboard with four summary cards (revenue, orders, products, low-stock products).
- Products page: table with low-stock badges, plus add, edit and delete in a pop-up form.

---

## Project structure

```
techmart/
├── backend/
│   ├── models/          Admin, Product, Order, Customer, Notification
│   ├── routes/          auth, products, orders, customers, notifications, reports
│   ├── middleware/      auth.js (token guard)
│   ├── utils/           notify.js (saves notifications)
│   ├── createAdmin.js   run once to create the first admin
│   ├── server.js        starts the app
│   └── .env             secrets (never commit this file)
└── frontend/
    ├── login.html
    ├── dashboard.html
    ├── products.html
    └── js/common.js     login check, API helper, sidebar and top bar
```

---

## Getting started

### 1. Requirements
- Node.js 18 or higher (the import feature uses the built-in `fetch`)
- A free MongoDB Atlas cluster, with your IP address added under **Network Access**

### 2. Install dependencies
In the folder that holds `package.json`:

```
npm install express mongoose dotenv cors bcryptjs jsonwebtoken
```

### 3. Create the `.env` file
Create `backend/.env`:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/techmart?appName=Cluster0
JWT_SECRET=choose_a_long_random_secret
PORT=5000
```

Add `.env` and `node_modules` to `.gitignore` so secrets never reach GitHub.

### 4. Create the first admin
Open `backend/createAdmin.js` and set your own admin name, email and password, then run it once:

```
cd backend
node createAdmin.js
```

The default values in that file are for learning only. Change them before sharing or deploying the project.

### 5. Start the server

```
node server.js
```

You should see `MongoDB connected` and `Server started on port 5000`.

### 6. Open the frontend
Open `frontend/login.html` in a browser (keep the server running), log in with your admin details, and you will land on the dashboard.

---

## API reference

All routes except login need the header `Authorization: Bearer <token>`.

### Auth
| Method | URL | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Log in with `email` and `password`, returns a token |

### Products
| Method | URL | Purpose |
|---|---|---|
| POST | `/api/products` | Add a product |
| GET | `/api/products` | List all products (newest first) |
| GET | `/api/products/low-stock?limit=10` | Products with stock at or below the limit |
| GET | `/api/products/:id` | Get one product |
| PUT | `/api/products/:id` | Edit a product |
| DELETE | `/api/products/:id` | Delete a product |
| POST | `/api/products/import?limit=10` | Import products from DummyJSON (maximum 30) |

### Orders
| Method | URL | Purpose |
|---|---|---|
| POST | `/api/orders` | Place an order (`customerName`, `customerEmail`, `items: [{ productId, quantity }]`) |
| GET | `/api/orders` | List all orders |
| GET | `/api/orders/:id` | Get one order |
| PUT | `/api/orders/:id/status` | Change status (`{ "status": "shipped" }`) |

### Customers
| Method | URL | Purpose |
|---|---|---|
| POST | `/api/customers` | Add a customer (email must be unique) |
| GET | `/api/customers` | List customers |
| GET | `/api/customers/:id` | Get one customer |
| PUT | `/api/customers/:id` | Edit a customer |
| GET | `/api/customers/:id/orders` | A customer's orders, order count and total spent |

### Notifications
| Method | URL | Purpose |
|---|---|---|
| GET | `/api/notifications` | List alerts (add `?unread=true` for unread only) |
| PUT | `/api/notifications/:id/read` | Mark one alert as read |
| PUT | `/api/notifications/read-all` | Mark all alerts as read |

### Reports
| Method | URL | Purpose |
|---|---|---|
| GET | `/api/reports/summary` | Totals, revenue and orders by status |
| GET | `/api/reports/top-products?limit=5` | Best-selling products by units sold |
| GET | `/api/reports/sales-by-day?days=7` | Orders and revenue for each day |

---

## Business rules

- **Revenue** counts every order that is not cancelled (pending, shipped and delivered).
- **Low stock** means 10 units or fewer.
- **Order status moves:** `pending → shipped | cancelled`, `shipped → delivered`. `delivered` and `cancelled` are final.
- **Customer orders** are matched by email, so the customer's email must equal the `customerEmail` used on the order.
- **Imported prices** are converted with `USD_TO_INR = 85`, an approximate fixed rate set in `routes/products.js`. Change it for different prices.

---

## Project status

| Part | Status |
|---|---|
| Setup, MongoDB connection | Done |
| Admin login and token guard | Done |
| Products, low-stock list | Done |
| Orders and status changes | Done |
| Customers | Done |
| Notifications | Done |
| External product API import | Done |
| Reports (backend) | Done |
| Frontend: login, layout, dashboard cards, Products page | Done |
| Frontend: Inventory page | To do |
| Frontend: Orders page | To do |
| Frontend: Customers page | To do |
| Frontend: Notifications page | To do |
| Frontend: Analytics page (charts) | To do |
| Frontend: Import button on the Products page | To do |
| Testing and bug fixing | To do |
| Final report and documentation | To do |

---

## Known limitations

- Order creation checks and subtracts stock in separate steps (no database transaction), so two orders placed at the same instant could oversell a product. This is acceptable for a learning project.
- The login check in the browser only decides which page to show. The real protection is the token check on the server.
- The frontend files call `http://localhost:5000`, so the API address must be changed before deploying.
