require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);

  const hashed = await bcrypt.hash("Admin@123", 10);

  await Admin.create({
    name: "Main Admin",
    email: "admin@techmart.com",
    password: hashed,
  });

  console.log("Admin created");
  await mongoose.disconnect();
}

createAdmin().catch((err) => {
  console.log("Error:", err.message);
  process.exit(1);
});
