const express = require("express");
const userRouter = express.Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  registerUser,
  loginUser,
  logoutUser,
  getAllUsers,
  getUserById,
} = require("../controllers/User");

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/logout", protect, logoutUser);
userRouter.get("/profile/:id", protect, getUserById);
userRouter.get("/", protect, authorize("ADMIN"), getAllUsers);

module.exports = { userRouter };
