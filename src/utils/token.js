// const jwt = require("jsonwebtoken");
const jose = require("jose");
require("dotenv").config();

const privateKey = process.env.BOOKING_PRIVATE_KEY.replace(/\\n/g, "\n");

// function generateBookingToken(payload) {
//   return jwt.sign(payload, privateKey, {
//     algorithm: "RS256",
//     expiresIn: process.env.BOOKING_JWT_EXPIRATION,
//   });
// }

async function generateBookingToken(payload) {
  const importedKey = await jose.importPKCS8(privateKey, "RS256");
  
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "RS256" })
    .setExpirationTime(process.env.BOOKING_JWT_EXPIRATION)
    .sign(importedKey);
}

module.exports = { generateBookingToken };