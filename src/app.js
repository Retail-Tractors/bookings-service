const express = require('express');
const app = express();
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("../swagger-output.json");

app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.use(express.json());

const logger = require('./utils/logger');

const { errorHandler } = require("./middlewares/error-handler");

app.use("/bookings", require("./routes/bookings.routes.js"));

app.use((req, res, next) => {
    logger.warn(`404 Not Found: ${req.originalUrl}`);
    const err = new Error("Endpoint not found....");
    err.statusCode = 404;
    next(err);
});

app.use(errorHandler);

module.exports = app;   