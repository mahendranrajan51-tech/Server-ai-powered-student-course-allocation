const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const generateJWT = async (payload, secret, expiresIn) => {
  return await jwt.sign(payload, secret, { expiresIn });
};

const verifyJWT = async (token, secret) => {
  return await jwt.verify(token, secret);
};

const cookieOptions = async (isProduction) => {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "lax",
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  generateJWT,
  verifyJWT,
  cookieOptions,
};
