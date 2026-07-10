const express = require("express");
const courseRouter = express.Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  createCourse,
  getAllCourses,
  getCourseById,
  getActiveCourses,
} = require("../controllers/Course");

courseRouter.post("/", protect, authorize("ADMIN"), createCourse);
courseRouter.get("/", protect, authorize("ADMIN"), getAllCourses);
courseRouter.get("/active", protect, getActiveCourses);
courseRouter.get("/:id", protect, authorize("ADMIN"), getCourseById);

module.exports = { courseRouter };
