const mongoose = require("mongoose");
const Counter = require("./Counter");

const seatSchema = new mongoose.Schema(
  {
    GENERAL: {
      type: Number,
      default: 0,
      min: 0,
    },

    OBC: {
      type: Number,
      default: 0,
      min: 0,
    },

    SC: {
      type: Number,
      default: 0,
      min: 0,
    },

    ST: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const courseSchema = new mongoose.Schema(
  {
    courseId: {
      type: String,
    },
    courseCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    courseName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    totalSeats: {
      type: Number,
      required: true,
      min: 1,
    },

    reservedSeats: {
      type: seatSchema,
      required: true,
    },

    filledSeats: {
      type: seatSchema,
      default: () => ({
        GENERAL: 0,
        OBC: 0,
        SC: 0,
        ST: 0,
      }),
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

courseSchema.pre("save", async function () {
  if (!this.isNew) return;

  const counter = await Counter.findOneAndUpdate(
    { name: "course" },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true },
  );

  this.courseId = `CRS${String(counter.sequence).padStart(6, "0")}`;
});

courseSchema.index(
  {
    courseId: 1,
  },
  {
    unique: true,
  },
);

courseSchema.index(
  {
    courseCode: 1,
  },
  {
    unique: true,
  },
);

courseSchema.index({
  courseName: 1,
});

courseSchema.index({
  isActive: 1,
});

module.exports = mongoose.model("Course", courseSchema);
