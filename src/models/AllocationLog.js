const mongoose = require("mongoose");

const allocationLogSchema = new mongoose.Schema(
  {
    allocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Allocation",
      required: true,
      index: true,
    },

    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      index: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    studentId: {
      type: String,
      required: true,
      index: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },

    courseId: {
      type: String,
      default: null,
    },

    priority: {
      type: Number,
      enum: [1, 2, 3],
    },

    action: {
      type: String,
      enum: [
        "CHECKING",
        "ALLOCATED",
        "REJECTED",
        "NO_SEAT",
        "NEXT_PREFERENCE",
        "COMPLETED",
      ],
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

allocationLogSchema.index({
  allocation: 1,
});

allocationLogSchema.index({
  application: 1,
});

allocationLogSchema.index({
  student: 1,
});

allocationLogSchema.index({
  course: 1,
});

allocationLogSchema.index({
  action: 1,
});

allocationLogSchema.index({
  createdAt: -1,
});

module.exports = mongoose.model("AllocationLog", allocationLogSchema);
