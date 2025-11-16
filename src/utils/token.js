const jwt = require("jsonwebtoken");
require("dotenv").config();

const privateKey = process.env.BOOKING_PRIVATE_KEY.replace(/\\n/g, "\n");

function generateBookingToken(payload) {
  return jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: process.env.BOOKING_JWT_EXPIRATION,
  });
}

module.exports = { generateBookingToken };