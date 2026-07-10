const express = require("express");
const allocationRouter = express.Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  allocateCourses,
  getAllocationById,
  getAllAllocations,
  getDashboardStats,
} = require("../controllers/Allocation");

allocationRouter.post("/", protect, authorize("ADMIN"), allocateCourses);
allocationRouter.get("/stats", protect, authorize("ADMIN"), getDashboardStats);
allocationRouter.get("/", protect, getAllAllocations);
allocationRouter.get("/:id", protect, getAllocationById);

module.exports = { allocationRouter };
