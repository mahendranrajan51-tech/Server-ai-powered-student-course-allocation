const express = require("express");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
const app = express();
const { connectDB } = require("./db/db.js");
connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/api/health", (req, res) =>
  res.json({ result: true, message: "Server is running" }),
);
app.use("/api/users", require("./routes/User").userRouter);
app.use("/api/courses", require("./routes/Course").courseRouter);
app.use("/api/applications", require("./routes/Application").applicationRouter);
app.use("/api/allocations", require("./routes/Allocation").allocationRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

app.use((err, _req, res, _next) => {
  const status = err.statusCode || 500;
  res
    .status(status)
    .json({ result: false, message: err.message || "Server error" });
});
