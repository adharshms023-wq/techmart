 # TechMart – Admin-Centric E-Commerce Management System

TechMart is a web-based administrative e-commerce management system designed for a consumer electronics retailer. It provides a centralized platform to manage products, inventory, orders, customers, notifications and sales analytics through a secure admin dashboard.

The system replaces manual business operations with an integrated web application powered by Node.js, Express and MongoDB.

**Project Status:** Core development completed. Testing, final verification and deployment are the next steps.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript, Bootstrap 5 |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | JWT (JSON Web Tokens) |
| Password Security | bcryptjs |
| Charts | Chart.js |
| External API | DummyJSON |
| Development Tools | VS Code, Thunder Client |
| Version Control | Git and GitHub |

---

## Features

### 1. Admin Authentication
- Secure admin login.
- Password hashing using bcryptjs.
- JWT-based authentication.
- Protected API routes using authentication middleware.
- Automatic login verification on frontend pages.
- Logout functionality.

### 2. Dashboard
- Total revenue overview.
- Total orders.
- Total products.
- Low-stock product count.
- Centralized business overview.
- Quick access to management modules.

### 3. Product Management
- Add new products.
- View all products.
- View individual product details.
- Edit existing products.
- Delete products.
- Product search and management.
- Low-stock indicators.
- Import products from DummyJSON.

### 4. Inventory Management
- Monitor available product stock.
- Identify low-stock products.
- Display products with stock at or below 10 units.
- Sort products by stock availability.
- Support inventory monitoring through the dashboard.

### 5. Order Management
- View all customer orders.
- View individual order details.
- Track order status.
- Update order status.
- Automatic stock deduction when orders are placed.
- Restore stock when orders are cancelled.

**Order Status Workflow:**

`Pending → Shipped → Delivered`

`Pending → Cancelled`

### 6. Customer Management
- Add customers.
- View customer records.
- Edit customer details.
- View individual customer information.
- Access customer order history.
- Display order count and total amount spent.
- Identify customer orders using email addresses.

### 7. Notifications
- Automatically generate notifications for new orders.
- Generate low-stock alerts.
- View all notifications.
- Filter unread notifications.
- Mark individual notifications as read.
- Mark all notifications as read.

### 8. Analytics and Reports
- View business performance statistics.
- Monitor total revenue and orders.
- Analyze order status distribution.
- Identify top-selling products.
- View daily sales performance.
- Visualize sales data using charts.

### 9. External Product API Integration
- Import products from DummyJSON.
- Validate imported product information.
- Convert external product data into the TechMart format.
- Convert product prices from USD to INR.
- Prevent duplicate products based on product name.
- Save imported products to MongoDB.

---

## Project Structure

```text
techmart/
│
├── backend/
│   ├── models/
│   │   ├── Admin.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Customer.js
│   │   └── Notification.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── customers.js
│   │   ├── notifications.js
│   │   └── reports.js
│   │
│   ├── middleware/
│   │   └── auth.js
│   │
│   ├── utils/
│   │   └── notify.js
│   │
│   ├── createAdmin.js
│   ├── server.js
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── login.html
    ├── dashboard.html
    ├── products.html
    ├── inventory.html
    ├── orders.html
    ├── customers.html
    ├── notifications.html
    ├── analytics.html
    │
    ├── css/
    │   └── style.css
    │
    └── js/
        └── common.js
```

*Note: Adjust the structure above if your actual filenames or folders differ.*

---

## Getting Started

### 1. Prerequisites

Make sure you have installed:

- Node.js 18 or higher.
- npm.
- MongoDB Atlas account.
- Git.
- Visual Studio Code.

### 2. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd techmart
```

### 3. Install Dependencies

Navigate to the backend directory:

```bash
cd backend
npm install
```

Required dependencies:

```bash
npm install express mongoose dotenv cors bcryptjs jsonwebtoken
```

### 4. Configure Environment Variables

Create a `.env` file inside the backend directory.

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
PORT=5000
```

Never expose your MongoDB credentials or JWT secret in public repositories.

### 5. Create the First Admin

Configure the admin credentials in `createAdmin.js` and run:

```bash
node createAdmin.js
```

Run this script only when creating the initial administrator.

### 6. Start the Backend Server

```bash
node server.js
```

Expected output:

```text
MongoDB connected
Server started on port 5000
```

### 7. Open the Frontend

Open `frontend/login.html` using a local development server.

Log in using your configured admin credentials to access the dashboard.

---

## API Reference

All API routes except the login endpoint require JWT authentication.

**Authorization Header:**

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Admin login |

### Products

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/products` | Add product |
| GET | `/api/products` | Get all products |
| GET | `/api/products/low-stock?limit=10` | Get low-stock products |
| GET | `/api/products/:id` | Get product details |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| POST | `/api/products/import?limit=10` | Import external products |

### Orders

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/orders` | Create an order |
| GET | `/api/orders` | Get all orders |
| GET | `/api/orders/:id` | Get order details |
| PUT | `/api/orders/:id/status` | Update order status |

### Customers

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/customers` | Add customer |
| GET | `/api/customers` | Get all customers |
| GET | `/api/customers/:id` | Get customer details |
| PUT | `/api/customers/:id` | Update customer |
| GET | `/api/customers/:id/orders` | Get customer order history |

### Notifications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | Get notifications |
| GET | `/api/notifications?unread=true` | Get unread notifications |
| PUT | `/api/notifications/:id/read` | Mark notification as read |
| PUT | `/api/notifications/read-all` | Mark all notifications as read |

### Reports and Analytics

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports/summary` | Get business summary |
| GET | `/api/reports/top-products?limit=5` | Get top-selling products |
| GET | `/api/reports/sales-by-day?days=7` | Get daily sales data |

---

## Business Rules

- Revenue includes pending, shipped and delivered orders.
- Cancelled orders are excluded from revenue.
- Low stock is defined as 10 units or fewer.
- Stock is deducted when an order is created.
- Stock is restored when an order is cancelled.
- Delivered and cancelled orders are final.
- Customer order history is matched using customer email.
- Imported product prices use a fixed USD-to-INR conversion rate of 85.
- Duplicate imported products are skipped based on product name.

---

## Project Workflow

1. Administrator logs into the system.
2. JWT authentication verifies the administrator.
3. The dashboard displays business statistics.
4. The administrator manages products and inventory.
5. Orders are created and their stock is updated.
6. Customers and their order histories are managed.
7. Notifications alert administrators about new orders and low stock.
8. Analytics generate business insights from stored records.

---

## Project Status

| Module | Status |
|---|---|
| Project setup and MongoDB connection | Completed |
| Admin authentication | Completed |
| JWT authentication middleware | Completed |
| Product management | Completed |
| Inventory management | Completed |
| Order management | Completed |
| Customer management | Completed |
| Notifications | Completed |
| External product API integration | Completed |
| Dashboard | Completed |
| Analytics and reports | Completed |
| Frontend login and shared layout | Completed |
| Frontend Products page | Completed |
| Frontend Inventory page | Completed |
| Frontend Orders page | Completed |
| Frontend Customers page | Completed |
| Frontend Notifications page | Completed |
| Frontend Analytics page | Completed |
| Product import interface | Completed |
| Comprehensive testing | Pending verification |
| Security review | Pending verification |
| Production deployment | Pending |

---

## Known Limitations

- Order creation and stock deduction are currently separate database operations, which can create overselling risks during simultaneous orders.
- Frontend login checks provide navigation control, while actual API protection is enforced by backend JWT middleware.
- The frontend currently uses a local backend API address that must be updated for production.
- Product import uses a fixed USD-to-INR exchange rate rather than a live currency API.
- Inventory availability and sales reports depend on the accuracy of stored database records.

---

## Future Enhancements

- Role-based access control for administrators and staff.
- Audit logs for tracking administrative activities.
- Advanced sales forecasting.
- CSV and Excel report exports.
- Improved inventory alerts and stock forecasting.
- Payment gateway integration.
- Customer-facing shopping interface.
- Automated email notifications.
- Production deployment and monitoring.

---

## Learning Outcomes

Through this project, the following concepts and technologies were implemented:

- Full-stack web application development.
- REST API development using Express.js.
- MongoDB database design and Mongoose integration.
- JWT-based authentication.
- Password hashing and security.
- CRUD operations.
- Inventory and order management.
- External API integration.
- Data aggregation and analytics.
- Frontend and backend integration.

---

## Author

Developed as an academic and practical full-stack web development project.

**TechMart – Simplifying E-Commerce Management.**
