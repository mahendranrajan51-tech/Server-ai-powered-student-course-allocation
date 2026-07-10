const User = require("../models/User");

const {
  hashPassword,
  comparePassword,
  generateJWT,
  cookieOptions,
} = require("../utils/helper");

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, gender, category, phone } = req.body;

    if (!name || !email || !password || !gender || !category || !phone) {
      const error = new Error("All fields are required.");
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      const error = new Error("Email already exists.");
      error.statusCode = 409;
      throw error;
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      gender,
      category,
      phone,
      role: "STUDENT",
    });

    const token = await generateJWT(
      {
        id: user._id,
      },
      process.env.JWT_SECRET,
      "7d",
    );

    res.cookie(
      "token",
      token,
      await cookieOptions(process.env.IS_PRODUCTION === "true"),
    );

    res.status(201).json({
      success: true,
      message: "Registration Successful",
    });
  } catch (err) {
    next(err);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      const error = new Error("Invalid Credentials");
      error.statusCode = 401;
      throw error;
    }

    const matched = await comparePassword(password, user.password);

    if (!matched) {
      const error = new Error("Invalid Credentials");
      error.statusCode = 401;
      throw error;
    }

    user.lastLogin = new Date();

    await user.save();

    const token = await generateJWT(
      {
        id: user._id,
      },
      process.env.JWT_SECRET,
      "7d",
    );

    res.cookie(
      "token",
      token,
      await cookieOptions(process.env.IS_PRODUCTION === "true"),
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: "Login Successful",
    });
  } catch (err) {
    next(err);
  }
};

const logoutUser = async (req, res) => {
  res.clearCookie("token");

  res.json({
    success: true,

    message: "Logout Successful",
  });
};

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query;

    const currentPage = Number(page);
    const pageSize = Number(limit);

    const filter = {};

    // Search
    if (search) {
      filter.$or = [
        {
          userId: {
            $regex: search,
            $options: "i",
          },
        },
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Role Filter
    if (role) {
      filter.role = role.toUpperCase();
    }

    // Active / Inactive Filter
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const totalRecords = await User.countDocuments(filter);

    const totalPages = Math.ceil(totalRecords / pageSize);

    const users = await User.find(filter)
      .select("-password")
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
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      const error = new Error("User Not Found");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getAllUsers,
  getUserById,
};
