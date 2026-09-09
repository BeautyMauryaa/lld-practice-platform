// Force Node.js to bypass the Windows DNS resolution bug for cloud MongoDB strings
require("dns").setServers(["1.1.1.1", "8.8.8.8"]);

const mongoose = require("mongoose");

/**
 * Connects to MongoDB using the URI defined in .env (MONGODB_URI).
 * Keeps connection logic isolated so server.js / app bootstrap stays clean.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("MONGODB_URI is not defined in environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }

  // Log unexpected disconnects/errors after the initial connection succeeds.
  mongoose.connection.on("error", (err) => {
    console.error("MongoDB runtime error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });
}

module.exports = connectDB;
