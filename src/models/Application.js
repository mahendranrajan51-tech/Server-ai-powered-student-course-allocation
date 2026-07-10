const mongoose = require("mongoose");
const Counter = require("./Counter");

const preferenceSchema = new mongoose.Schema(
  {
    priority: {
      type: Number,
      required: true,
      enum: [1, 2, 3],
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
  },
  {
    _id: false,
  },
);

const applicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      unique: true,
      index: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    studentId: {
      type: String,
      required: true,
      index: true,
    },
    marks: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    preferences: {
      type: [preferenceSchema],
      validate: {
        validator: function (value) {
          return value.length === 3;
        },
        message: "Exactly 3 course preferences are required.",
      },
    },

    status: {
      type: String,
      enum: ["PENDING", "ALLOCATED", "REJECTED"],
      default: "PENDING",
      index: true,
    },

    allocationStatus: {
      type: Boolean,
      default: false,
    },

    applicationDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

applicationSchema.pre("save", async function (next) {
  try {
    if (!this.isNew) return next();

    const counter = await Counter.findOneAndUpdate(
      { name: "application" },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true },
    );

    this.applicationId = `APP${String(counter.sequence).padStart(7, "0")}`;

    next();
  } catch (err) {
    next(err);
  }
});

applicationSchema.pre("validate", function (next) {
  const courseIds = this.preferences.map((preference) =>
    preference.course.toString(),
  );

  const uniqueCourseIds = [...new Set(courseIds)];

  if (courseIds.length !== uniqueCourseIds.length) {
    return next(new Error("Duplicate course preferences are not allowed."));
  }

  next();
});

applicationSchema.index(
  {
    applicationId: 1,
  },
  {
    unique: true,
  },
);

applicationSchema.index(
  {
    student: 1,
  },
  {
    unique: true,
  },
);

applicationSchema.index({
  status: 1,
});

applicationSchema.index({
  applicationDate: 1,
});

applicationSchema.index({
  studentId: 1,
});

module.exports = mongoose.model("Application", applicationSchema);
