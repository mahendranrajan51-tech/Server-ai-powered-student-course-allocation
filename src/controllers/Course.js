const Course = require("../models/Course");

const createCourse = async (req, res, next) => {
  try {
    const { courseCode, courseName, description, totalSeats, reservedSeats } =
      req.body;

    const exists = await Course.findOne({
      courseCode,
    });

    if (exists) {
      throw new Error("Course already exists.");
    }

    const course = await Course.create({
      courseCode,
      courseName,
      description,
      totalSeats,
      reservedSeats,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (err) {
    next(err);
  }
};

const getAllCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, isActive, search } = req.query;

    const currentPage = Number(page);
    const pageSize = Number(limit);

    const filter = {};

    // Active/Inactive Filter
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    // Search by Course Code or Course Name
    if (search) {
      filter.$or = [
        {
          courseCode: {
            $regex: search,
            $options: "i",
          },
        },
        {
          courseName: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const totalRecords = await Course.countDocuments(filter);

    const totalPages = Math.ceil(totalRecords / pageSize);

    const courses = await Course.find(filter)
      .populate("createdBy", "userId name")
      .sort({ createdAt: -1 })
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
      data: courses,
    });
  } catch (err) {
    next(err);
  }
};

const getActiveCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({
      isActive: true,
    })
      .select(
        "courseId courseCode courseName totalSeats reservedSeats filledSeats",
      )
      .sort({ courseName: 1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (err) {
    next(err);
  }
};

const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      const error = new Error("Course not found");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      data: course,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getActiveCourses,
  getCourseById,
};
