const mongoose = require("mongoose");
const Counter = require("./Counter");

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      required: true,
    },
    category: {
      type: String,
      enum: ["GENERAL", "OBC", "SC", "ST"],
      required: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["ADMIN", "STUDENT"],
      default: "STUDENT",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function (next) {
  try {
    if (!this.isNew) return next();

    if (this.userId) return next();

    if (this.role === "ADMIN") {
      this.userId = "ADM0001";
      return next();
    }

    const counter = await Counter.findOneAndUpdate(
      { name: "student" },
      { $inc: { sequence: 1 } },
      {
        new: true,
        upsert: true,
      },
    );

    this.userId = `STU${String(counter.sequence).padStart(7, "0")}`;

    next();
  } catch (error) {
    next(error);
  }
});

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ userId: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model("User", userSchema);
