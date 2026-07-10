const path = require("path");
const { connectDB } = require("./db/db");
const mongoose = require("mongoose");
const User = require("./models/User");
const { hashPassword } = require("./utils/helper");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });

const run = async () => {
  await connectDB();
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.error(
      "Admin email or password is not set in the environment variables.",
    );
    process.exit(1);
  }
  await User.create({
    name: "University Admin",
    email: adminEmail,
    password: await hashPassword(adminPassword),
    gender: "MALE",
    category: "GENERAL",
    phone: "1234567890",
    role: "ADMIN",
  });
  console.log("\n✅ Seed Data Complete!\n");
  console.log("University Admin:");
  console.log(`• Email: ${adminEmail}`);
  console.log(`• Password: ${adminPassword}`);

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
