const express = require("express");
const allocationRouter = express.Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  allocateCourses,
  getAllocationById,
  getAllAllocations,
  getDashboardStats,
  handleAiQuery,
} = require("../controllers/Allocation");

allocationRouter.post("/", protect, authorize("ADMIN"), allocateCourses);
allocationRouter.post("/ai-query", protect, authorize("ADMIN"), handleAiQuery);
allocationRouter.get("/stats", protect, authorize("ADMIN"), getDashboardStats);
allocationRouter.get("/", protect, getAllAllocations);
allocationRouter.get("/:id", protect, getAllocationById);

module.exports = { allocationRouter };
