const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
require("dotenv").config();

// JWT interno do Booking Service (RS256)
const bookingPublicKey = process.env.BOOKING_PUBLIC_KEY.replace(/\\n/g, "\n");

// JWT do User Service (HS256)
const USER_JWT_SECRET = process.env.USER_SERVICE_JWT_SECRET;

function authenticateBookingToken(req, res, next) {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            return res.status(401).json({ error: "Authorization header missing." });
        }
        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(400).json({ error: "Invalid Authorization format." });
        }
        const token = parts[1];
        if (!token) {
            return res.status(401).json({ error: "Booking token missing." });
        }
        const publicKey = process.env.BOOKING_PUBLIC_KEY;
        if (!publicKey) {
            logger.error("BOOKING_PUBLIC_KEY is missing from environment");
            return res.status(500).json({ error: "Server misconfiguration." });
        }
        // jwt.verify pode lançar erro síncrono → try/catch pega
        jwt.verify(
            token,
            publicKey,
            { algorithms: ["RS256"] },
            (err, payload) => {
                if (err) {
                    return res.status(403).json({ error: "Invalid booking token." });
                }

                req.bookingToken = payload;
                return next(); // seguro, só chega aqui se não houve resposta antes
            }
        );

    } catch (error) {
        logger.error("Token verification error:", error);
        return res.status(500).json({ error: "Token verification failed." });
    }
}

function authenticateUserToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "User token missing." });

    jwt.verify(token, USER_JWT_SECRET, (err, payload) => {
        if (err) return res.status(403).json({ error: "Invalid user token." });
        req.user = payload // id, email do usuário
        next();
    });
}

module.exports = { authenticateBookingToken, authenticateUserToken };