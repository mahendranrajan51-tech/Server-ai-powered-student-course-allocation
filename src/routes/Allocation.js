const express = require("express");
const allocationRouter = express.Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  allocateCourses,
  getAllocationById,
  getAllAllocations,
} = require("../controllers/Allocation");

allocationRouter.post("/", protect, authorize("ADMIN"), allocateCourses);
allocationRouter.get("/", protect, getAllAllocations);
allocationRouter.get("/:id", protect, getAllocationById);

module.exports = { allocationRouter };
