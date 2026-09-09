// Entry point for the LLD Practice Platform backend.

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const problemRoutes = require("./src/routes/problemRoutes");
const attemptRoutes = require("./src/routes/attemptRoutes");
const learnerRoutes = require("./src/routes/learnerRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "LLD Practice Platform backend is running",
  });
});

app.use("/api/problems", problemRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/learners", learnerRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
});
