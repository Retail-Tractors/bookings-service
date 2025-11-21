
const { request } = require("express");
const { generateBookingToken } = require("../utils/token");
const prisma = require("../config/db"); // Import prisma instance
const logger = require("../utils/logger");


async function testeUserToken(req, res) {
    // Gerar token interno para comunicação entre serviços
    const booking = { id: 123 };
    const internalToken = generateBookingToken({ bookingId: booking.id, role: "internal" });

    res.json({ internalToken });
}

async function updateBookingStatus(req, res) {
    res.json({
        requests: req.bookingToken,
        teste: "Booking status updated successfully.",
        message: "Booking status updated successfully."
    });
}

async function createBooking(req, res) {
    const { startDate, endDate, equipmentId } = req.body;
    logger.info("createBooking called");
    logger.info(`Request body: ${JSON.stringify(req.body)}`);

    if (!startDate || !endDate || !equipmentId) {
        logger.warn("Missing required booking fields.");
        return res.status(400).json({ error: "Missing required booking fields." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start) || isNaN(end) || start >= end) {
        logger.warn("Invalid date range provided for booking.");
        return res.status(400).json({ error: "Invalid startDate or endDate." });
    }

    // fazer pedido ao inventory service para verificar se o equipamento existe
    /// chamar o equipamento
    ////
    /////

    try {
        logger.info(`Checking availability for equipmentId: ${equipmentId} from ${start} to ${end}`);
        const count = await prisma.bookings.count({
            where: {
                equipmentId: equipmentId,
                AND: [
                    { startDate: { lte: end } },
                    { endDate: { gte: start } }
                ]
            }
        });
        if (count > 0) {
            logger.warn("Equipment is not available for the selected dates.");
            return res.status(400).json({ error: "Equipment is not available for the selected dates." });
        }
    } catch (error) {
        logger.error(`Error checking equipment availability: ${error.message}`);
        res.status(500).json({ error: "Failed to create booking." });
    }    

    try {
        logger.info("Creating new booking record in the database.");
        const newBooking = await prisma.bookings.create({
            data: {
                userId: req.user.id,
                startDate: start,
                endDate: end,
                equipmentId,
                totalPrice: 100.00 // Example fixed price
            }
        });
        logger.info(`Booking created successfully with ID: ${newBooking.id}`);
        res.status(201).json(newBooking); // mudar

        // fazer pedido ao payment service para processar o pagamento
    } catch (error) {
        logger.error(`Error creating booking: ${error.message}`);
        res.status(500).json({ error: "Failed to create booking." });
    }
};

async function getAllBookings(req, res) {
    logger.info("getAllBookings called");
    logger.info(`Query parameters received: ${JSON.stringify(req.query)}`);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(0);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    let filters = {};
    if (req.query.status) {
        if (['pending', 'confirmed', 'cancelled', 'completed'].includes(req.query.status)) {
            logger.info(`Filtering bookings by status: ${req.query.status}`);
            filters.status = req.query.status;
        } else {
            logger.warn(`Invalid status filter attempted: ${req.query.status}`);
            return res.status(400).json({ error: "Invalid status filter." });
        }
    }

    if (isNaN(startDate) || isNaN(endDate) || startDate >= endDate) {
        logger.warn("Invalid date range provided for filtering bookings.");
        return res.status(400).json({ error: "Invalid startDate or endDate." });
    }


    if (page < 1 || limit < 1) {
        logger.warn("Invalid pagination parameters provided.");
        return res.status(400).json({ error: "Invalid pagination parameters." });
    }
    if (limit > 100) {
        logger.warn("Requested limit exceeds maximum allowed value.");
        return res.status(400).json({ error: "Limit exceeds maximum of 100." });
    }
    try {
        logger.info(`Retrieving bookings with filters: ${JSON.stringify(filters)}, startDate: ${startDate}, endDate: ${endDate}, page: ${page}, limit: ${limit}`);
        const total = await prisma.bookings.count({
            where: {
                startDate: { gte: startDate },
                endDate: { lte: endDate },
                ...filters
            }
        });
        const totalPages = Math.ceil(total / limit);

        if (page > totalPages && totalPages !== 0) {
            logger.warn("Page number exceeds total pages.");
            return res.status(400).json({ error: "Page number exceeds total pages." });
        }
        logger.info(`Retrieving bookings for page ${page} of ${totalPages}`);
        const bookings = await prisma.bookings.findMany({
            skip: offset,
            take: limit,
            where: {
                startDate: { gte: startDate },
                endDate: { lte: endDate },
                ...filters
            },
        });
        logger.info(`Retrieved ${bookings.length} bookings.`);
        return res.json({
            page,
            limit,
            total,
            totalPages,
            data: bookings
      });
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve bookings." });
    }
}

async function getBookingById(req, res) {
    logger.info("getBookingById called");
    const bookingId = req.params.id;
    try {
        logger.info(`Retrieving booking with ID: ${bookingId}`);
        const booking = await prisma.bookings.findUnique({
            where: { id: bookingId }
        });
        if (!booking) {
            logger.warn(`Booking with ID: ${bookingId} not found.`);    
            return res.status(404).json({ error: "Booking not found." });
        }
        logger.info(`Booking with ID: ${bookingId} retrieved successfully.`);
        res.json(booking);
    } catch (error) {
        logger.error(`Error retrieving booking with ID: ${bookingId} - ${error.message}`);
        res.status(500).json({ error: "Failed to retrieve booking." });
    }
}

module.exports = { testeUserToken, updateBookingStatus, createBooking, getAllBookings, getBookingById };