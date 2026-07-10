const express = require("express");
const applicationRouter = express.Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  createApplication,
  getApplicationById,
  getAllApplications,
} = require("../controllers/Application");

applicationRouter.post("/", protect, authorize("STUDENT"), createApplication);
applicationRouter.get("/", protect, getAllApplications);
applicationRouter.get("/:id", protect, getApplicationById);

module.exports = { applicationRouter };
