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
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    studentId: {
      type: String,
      required: true,
    },
    marks: {
      type: Number,
      required: true,
      min: 0,
      max: 600,
    },

    preferences: {
      type: [preferenceSchema],
      validate: {
        validator: function (value) {
          return value && value.length >= 1 && value.length <= 3;
        },
        message: "At least 1 and up to 3 course preferences are required.",
      },
    },

    status: {
      type: String,
      enum: ["PENDING", "ALLOCATED", "REJECTED"],
      default: "PENDING",
    },

    allocationStatus: {
      type: Boolean,
      default: false,
    },

    applicationDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

applicationSchema.pre("save", async function () {
  if (!this.isNew) return;

  const counter = await Counter.findOneAndUpdate(
    { name: "application" },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true },
  );

  this.applicationId = `APP${String(counter.sequence).padStart(7, "0")}`;
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
