const logger = require("../utils/logger");
const axios = require("axios");

function ensureSameUser(req, res, next) {
    const paramUserId = parseInt(req.params.userId);
    if (parseInt(req.user.sub) !== paramUserId) {
        return res.status(403).json({ error: "Forbidden: you can only access your own bookings." });
    }
    next();
}

async function ensureUserIsAdmin(req, res, next) {

    const requesterId = req.user.sub;
    logger.info(`Requester ID: ${requesterId}`);

    try {
        logger.info("Fetching user role for authorization check.");
        const response = await axios.get(`http://localhost:3003/users/${requesterId}`, {
        headers: {
            Authorization: req.headers.authorization
        }
        });
        logger.info("User role fetched successfully.");
        req.user.role = response.data.data.role;
    } catch (error) {
        logger.error(`Error in ensureUserIsAdmin middleware: ${error.message}`, error);
        return res.status(500).json({ error: "Internal Server Error" });
    }

    if (req.user.role === "ADMIN") {
        logger.info(`User ${requesterId} is ADMIN, access granted.`);
        return next();
    }
    logger.error(`User ${requesterId} is not ADMIN, access denied.`);
    return res.status(403).json({ error: "Forbidden" });
}

module.exports = { ensureSameUser, ensureUserIsAdmin };