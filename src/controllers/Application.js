const Application = require("../models/Application");
const Course = require("../models/Course");

const createApplication = async (req, res, next) => {
  try {
    const { marks, preferences } = req.body;

    if (!preferences) {
      const error = new Error("preferences are required.");
      error.statusCode = 400;
      throw error;
    }

    if (!Array.isArray(preferences) || preferences.length < 1 || preferences.length > 3) {
      const error = new Error("At least 1 and up to 3 preferences are required.");
      error.statusCode = 400;
      throw error;
    }

    const hasFirstPreference = preferences.some((p) => p.priority === 1);
    if (!hasFirstPreference) {
      const error = new Error("First preference is required.");
      error.statusCode = 400;
      throw error;
    }

    // Already applied?
    const exists = await Application.findOne({
      student: req.user._id,
    });

    if (exists) {
      const error = new Error("Application already submitted.");
      error.statusCode = 409;
      throw error;
    }

    // Validate courses
    const courseIds = preferences.map((p) => p.course);

    const courses = await Course.find({
      _id: {
        $in: courseIds,
      },
      isActive: true,
    });

    if (courses.length !== preferences.length) {
      const error = new Error("One or more selected courses are invalid.");
      error.statusCode = 400;
      throw error;
    }

    const application = await Application.create({
      student: req.user._id,
      studentId: req.user.userId,
      marks,
      preferences,
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully.",
      data: application,
    });
  } catch (err) {
    next(err);
  }
};

const getAllApplications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    const filter = {};

    // Student sees only own application
    if (req.user.role === "STUDENT") {
      filter.student = req.user._id;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.studentId = {
        $regex: search,
        $options: "i",
      };
    }

    const totalRecords = await Application.countDocuments(filter);

    const currentPage = Number(page);
    const pageSize = Number(limit);
    const totalPages = Math.ceil(totalRecords / pageSize);

    const applications = await Application.find(filter)
      .populate("student", "userId name email category")
      .populate("preferences.course", "courseCode courseName")
      .sort({ applicationDate: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    res.status(200).json({
      success: true,
      pagination: {
        totalRecords,
        currentPage,
        pageSize,
        totalPages,
        hasPreviousPage: currentPage > 1,
        hasNextPage: currentPage < totalPages,
      },
      data: applications,
    });
  } catch (err) {
    next(err);
  }
};

const getApplicationById = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("student", "userId name email")
      .populate("preferences.course", "courseCode courseName");

    if (!application) {
      const error = new Error("Application not found.");
      error.statusCode = 404;
      throw error;
    }

    // Student can only view own application
    if (
      req.user.role === "STUDENT" &&
      application.student._id.toString() !== req.user._id.toString()
    ) {
      const error = new Error("Forbidden.");
      error.statusCode = 403;
      throw error;
    }

    res.json({
      success: true,
      data: application,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createApplication,
  getAllApplications,
  getApplicationById,
};
