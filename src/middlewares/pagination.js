const logger = require("../utils/logger");

function paginationMiddleware(req, res, next) {
    logger.info("Pagination middleware invoked.");  
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;

    if (page < 1) {
        page = 1
        logger.warn("Page number less than 1, defaulting to 1.");
    };
    if (limit < 1) {
        limit = 10
        logger.warn("Limit less than 1, defaulting to 10.");
    };
    if (limit > 100) {
        limit = 100;
        logger.warn("Limit exceeds maximum of 100, defaulting to 100.");
    }

  const offset = (page - 1) * limit;

  req.pagination = { page, limit, offset };

  next();
}

module.exports = { paginationMiddleware };