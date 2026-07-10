const Allocation = require("../models/Allocation");
const AllocationLog = require("../models/AllocationLog");
const Application = require("../models/Application");
const Course = require("../models/Course");
const User = require("../models/User");
const mongoose = require("mongoose");

const { detectIntent } = require("../services/ai.service.js");
const {
  getAllocationCount,
  getMissedFirstPreference,
  getHighestRejection,
  getCategorySummary
} = require("../services/allocation.service.js");
const { askGemini } = require("../utils/gemini.js");

const allocateCourses = async (req, res, next) => {
  try {
    // Get all pending applications
    const applications = await Application.find({
      status: "PENDING",
      allocationStatus: false,
    })
      .populate("student")
      .sort({
        marks: -1,
        applicationDate: 1,
      });

    if (!applications.length) {
      const error = new Error("No pending applications found.");
      error.statusCode = 404;
      throw error;
    }

    let allocatedCount = 0;
    let rejectedCount = 0;

    // Process every application
    for (const application of applications) {
      const session = await mongoose.startSession();

      try {
        session.startTransaction();

        let allocated = false;

        const userDetails = await User.findById(
          application.student._id,
        ).session(session);

        if (!userDetails) {
          throw new Error("Student details not found.");
        }
        const category = userDetails.category;
        const allocation = await Allocation.create(
          [
            {
              application: application._id,
              student: application.student._id,
              studentId: application.studentId,
              marks: application.marks,
              allocationStatus: "REJECTED",
              allocatedBy: req.user._id,
            },
          ],
          {
            session,
          },
        );

        const allocationDoc = allocation[0];

        await AllocationLog.create(
          [
            {
              allocation: allocationDoc._id,
              application: application._id,
              student: application.student._id,
              studentId: application.studentId,
              action: "CHECKING",
              message: "Started allocation.",
              createdBy: req.user._id,
            },
          ],
          {
            session,
          },
        );

        // Check preference one by one
        const preferences = [...application.preferences].sort(
          (a, b) => a.priority - b.priority,
        );

        for (const preference of preferences) {
          const course = await Course.findById(preference.course).session(
            session,
          );

          if (!course || !course.isActive) {
            continue;
          }

          const reservedSeat = course.reservedSeats[category];

          const updatedCourse = await Course.findOneAndUpdate(
            {
              _id: course._id,
              [`filledSeats.${category}`]: {
                $lt: reservedSeat,
              },
            },
            {
              $inc: {
                [`filledSeats.${category}`]: 1,
              },
            },
            {
              new: true,
              session,
            },
          );

          // No seat available
          if (!updatedCourse) {
            await AllocationLog.create(
              [
                {
                  allocation: allocationDoc._id,
                  application: application._id,
                  student: application.student._id,
                  studentId: application.studentId,
                  course: course._id,
                  courseId: course.courseId,
                  priority: preference.priority,
                  category,
                  action: "NO_SEAT",
                  message: `No ${category} seat available in ${course.courseName}.`,
                  createdBy: req.user._id,
                },
              ],
              { session },
            );

            const hasNextPref = preferences.some(p => p.priority === preference.priority + 1);
            if (hasNextPref) {
              await AllocationLog.create(
                [
                  {
                    allocation: allocationDoc._id,
                    application: application._id,
                    student: application.student._id,
                    studentId: application.studentId,
                    course: course._id,
                    courseId: course.courseId,
                    priority: preference.priority,
                    category,
                    action: "NEXT_PREFERENCE",
                    message: `Checking Preference ${preference.priority + 1}.`,
                    createdBy: req.user._id,
                  },
                ],
                { session },
              );
            }

            continue;
          }

          // Seat allocated
          allocationDoc.course = updatedCourse._id;
          allocationDoc.courseId = updatedCourse.courseId;
          allocationDoc.allocatedPreference = preference.priority;
          allocationDoc.allocationStatus = "ALLOCATED";
          allocationDoc.remarks = "Seat Allocated";

          await allocationDoc.save({ session });

          application.status = "ALLOCATED";
          application.allocationStatus = true;

          await application.save({ session });

          await AllocationLog.create(
            [
              {
                allocation: allocationDoc._id,
                application: application._id,
                student: application.student._id,
                studentId: application.studentId,
                course: updatedCourse._id,
                courseId: updatedCourse.courseId,
                priority: preference.priority,
                category,
                action: "ALLOCATED",
                message: `Allocated in ${updatedCourse.courseName} (Preference ${preference.priority})`,
                createdBy: req.user._id,
              },
            ],
            { session },
          );

          allocatedCount++;
          allocated = true;

          break;
        }

        // All preferences failed
        if (!allocated) {
          application.status = "REJECTED";
          application.allocationStatus = true;

          await application.save({
            session,
          });

          allocationDoc.allocationStatus = "REJECTED";
          allocationDoc.remarks = "No seats available";

          await allocationDoc.save({
            session,
          });

          await AllocationLog.create(
            [
              {
                allocation: allocationDoc._id,
                application: application._id,
                student: application.student._id,
                studentId: application.studentId,
                category,
                action: "REJECTED",
                message: "No seats available in any preferred course.",
                createdBy: req.user._id,
              },
            ],
            {
              session,
            },
          );

          rejectedCount++;
        }

        // Allocation completed log
        await AllocationLog.create(
          [
            {
              allocation: allocationDoc._id,
              application: application._id,
              student: application.student._id,
              studentId: application.studentId,
              course: allocationDoc.course,
              courseId: allocationDoc.courseId,
              priority: allocationDoc.allocatedPreference,
              category,
              action: "COMPLETED",
              message: "Allocation process completed.",
              createdBy: req.user._id,
            },
          ],
          {
            session,
          },
        );
        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    }

    res.status(200).json({
      success: true,
      message: "Course allocation completed successfully.",
      summary: {
        totalApplications: applications.length,
        allocated: allocatedCount,
        rejected: rejectedCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getAllAllocations = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      allocationStatus,
      category,
      course,
    } = req.query;

    const filter = {};

    if (req.user.role === "STUDENT") {
      filter.student = req.user._id;
    }

    // Search
    if (search) {
      filter.$or = [
        {
          allocationId: {
            $regex: search,
            $options: "i",
          },
        },
        {
          studentId: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Allocation Status Filter
    if (allocationStatus) {
      filter.allocationStatus = allocationStatus;
    }

    // Category Filter
    if (category) {
      const students = await User.find({ category }).select("_id");
      const studentIds = students.map((s) => s._id);
      filter.student = { $in: studentIds };
    }

    // Course Filter
    if (course) {
      filter.course = course;
    }

    const totalRecords = await Allocation.countDocuments(filter);

    const allocations = await Allocation.find(filter)
      .populate("student", "userId name email category")
      .populate("course", "courseId courseCode courseName academicYear")
      .populate("allocatedBy", "userId name")
      .sort({
        createdAt: -1,
      })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const totalPages = Math.ceil(totalRecords / Number(limit));

    res.status(200).json({
      success: true,
      totalRecords,
      currentPage: Number(page),
      totalPages,
      hasPreviousPage: Number(page) > 1,
      hasNextPage: Number(page) < totalPages,
      data: allocations,
    });
  } catch (err) {
    next(err);
  }
};

const getAllocationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const filter = id.match(/^[0-9a-fA-F]{24}$/)
      ? {
        _id: id,
      }
      : {
        allocationId: id,
      };

    const allocation = await Allocation.findOne(filter)
      .populate("student", "userId name email")
      .populate("course", "courseId courseCode courseName academicYear")
      .populate("application")
      .populate("allocatedBy", "userId name");

    if (!allocation) {
      const error = new Error("Allocation not found.");
      error.statusCode = 404;
      throw error;
    }

    if (
      req.user.role === "STUDENT" &&
      allocation.student._id.toString() !== req.user._id.toString()
    ) {
      const error = new Error("Forbidden.");
      error.statusCode = 403;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: allocation,
    });
  } catch (err) {
    next(err);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalCourses,
      totalApplications,
      pendingApps,
      allocatedApps,
      rejectedApps,
      totalAllocations,
      courses,
      categoryAllocationsAgg,
    ] = await Promise.all([
      User.countDocuments({ role: "STUDENT" }),
      Course.countDocuments(),
      Application.countDocuments(),
      Application.countDocuments({ status: "PENDING" }),
      Application.countDocuments({ status: "ALLOCATED" }),
      Application.countDocuments({ status: "REJECTED" }),
      Allocation.countDocuments(),
      Course.find(),
      Allocation.aggregate([
        { $match: { allocationStatus: "ALLOCATED" } },
        {
          $lookup: {
            from: "users",
            localField: "student",
            foreignField: "_id",
            as: "studentInfo",
          },
        },
        { $unwind: "$studentInfo" },
        {
          $group: {
            _id: "$studentInfo.category",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    let totalSeats = 0;
    let filledSeats = 0;

    const courseStats = courses.map((c) => {
      const filled =
        (c.filledSeats.GENERAL || 0) +
        (c.filledSeats.OBC || 0) +
        (c.filledSeats.SC || 0) +
        (c.filledSeats.ST || 0);

      totalSeats += c.totalSeats || 0;
      filledSeats += filled;

      return {
        courseCode: c.courseCode,
        courseName: c.courseName,
        totalSeats: c.totalSeats,
        filledSeats: filled,
        availableSeats: Math.max(0, (c.totalSeats || 0) - filled),
        reservedSeats: c.reservedSeats,
        filledSeatsByCategory: c.filledSeats,
      };
    });

    const categoryAllocations = {
      GENERAL: 0,
      OBC: 0,
      SC: 0,
      ST: 0,
    };

    categoryAllocationsAgg.forEach((item) => {
      if (item._id && categoryAllocations[item._id] !== undefined) {
        categoryAllocations[item._id] = item.count;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalCourses,
        totalApplications,
        pendingApps,
        allocatedApps,
        rejectedApps,
        allocationProcessed: totalAllocations > 0,
        seatStats: {
          totalSeats,
          filledSeats,
          availableSeats: Math.max(0, totalSeats - filledSeats),
        },
        categoryAllocations,
        courseStats,
      },
    });
  } catch (err) {
    next(err);
  }
};

const handleAiQuery = async (req, res) => {

  const { query } = req.body;

  const intent = await detectIntent(query);

  let data;

  switch (intent) {

    case "allocation_count":
      data = await getAllocationCount();
      break;

    case "missed_first_preference":
      data = await getMissedFirstPreference();
      break;

    case "highest_rejection":
      data = await getHighestRejection();
      break;

    case "category_summary":
      data = await getCategorySummary();
      break;

    default:
      return res.status(400).json({
        message: "Unsupported question."
      });

  }

  const prompt = `

You are an AI Assistant.

Answer professionally.

Question:

${query}

Database Result:

${JSON.stringify(data, null, 2)}

Do not invent information.

Format using markdown.

`;

  const answer = await askGemini(prompt);

  res.json({

    success: true,
    data: { answer }

  });

};

module.exports = {
  allocateCourses,
  getAllAllocations,
  getAllocationById,
  getDashboardStats,
  handleAiQuery,
};
