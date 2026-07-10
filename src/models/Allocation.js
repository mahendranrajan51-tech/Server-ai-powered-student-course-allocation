const mongoose = require("mongoose");
const Counter = require("./Counter");

const allocationSchema = new mongoose.Schema(
  {
    allocationId: {
      type: String,
      unique: true,
      index: true,
    },

    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      unique: true,
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
      default: null,
      index: true,
    },

    courseId: {
      type: String,
      default: null,
      index: true,
    },

    allocatedPreference: {
      type: Number,
      enum: [1, 2, 3],
      default: null,
    },

    marks: {
      type: Number,
      required: true,
      index: true,
    },

    allocationStatus: {
      type: String,
      enum: ["ALLOCATED", "REJECTED"],
      required: true,
      index: true,
    },

    remarks: {
      type: String,
      default: "",
    },

    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    allocatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

allocationSchema.pre("save", async function (next) {
  try {
    if (!this.isNew) return next();

    const counter = await Counter.findOneAndUpdate(
      { name: "allocation" },

      { $inc: { sequence: 1 } },

      { new: true, upsert: true },
    );

    this.allocationId = `ALL${String(counter.sequence).padStart(7, "0")}`;

    next();
  } catch (err) {
    next(err);
  }
});

allocationSchema.index({ allocationId: 1 }, { unique: true });

allocationSchema.index({ application: 1 }, { unique: true });

allocationSchema.index({
  student: 1,
});

allocationSchema.index({
  course: 1,
});

allocationSchema.index({
  allocationStatus: 1,
});

allocationSchema.index({
  marks: -1,
});

module.exports = mongoose.model("Allocation", allocationSchema);
