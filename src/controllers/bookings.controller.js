const { request } = require("express");
const { generateBookingToken } = require("../utils/token");
const prisma = require("../config/db"); // Import prisma instance
const logger = require("../utils/logger");
const axios = require("axios");

async function updateBookingStatus(req, res) {
    const bookingId = req.params.id;
    const { status, notes } = req.body;
    // Atualizar o status da reserva no banco de dados
    logger.info(`Updating booking ID: ${bookingId} to status: ${status}`);

    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
        logger.warn(`Invalid status value attempted: ${status}`);
        return res.status(400).json({ error: "Invalid status value." });
    }

    if (status === 'cancelled' && (!notes || notes.trim() === '')) {
        logger.warn("Cancellation attempted without providing notes.");
        return res.status(400).json({ error: "Notes are required when cancelling a booking." });
    }

    // Update the booking status in the database
    try {
        await prisma.bookings.update({
            where: { id: bookingId },
            data: { status, notes }
        });
    } catch (error) {
        logger.error(`Error updating booking status: ${error.message}`);
        return res.status(500).json({ error: "Failed to update booking status." });
    }

    res.json({
        message: "Booking status updated successfully."
    });
}

async function checkAvailability(req, res) {
    const { equipmentId, startDate, endDate } = req.body;

    if (!equipmentId || !startDate || !endDate) {
        return res.status(400).json({ error: "Missing required fields." });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end) || start >= end) {
        logger.warn("Invalid date range provided for booking.");
        return res.status(400).json({ error: "Invalid startDate or endDate." });
    }

    try {
        const inventoryResponse = await axios.post('http://localhost:3001/graphql', {
            query: `
            query Item {
                item(id: $id) {
                    id
                }
            }`,
            variables: { id: equipmentId }
        });

        console.log(inventoryResponse);
        
        if (!inventoryResponse.data.data.equipment) {
            logger.warn(`Equipment with ID: ${equipmentId} not found in Inventory Service.`);
            return res.status(404).json({ error: "Equipment not found." });
        }


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
            return res.status(400).json({ 
                available: false,
                error: "Equipment is not available for the selected dates."
            });
        }

        res.status(200).json({ available: true });
    } catch (error) {
        logger.error(`Error checking equipment availability: ${error.message}`);
        res.status(500).json({ error: "Failed to check availability." });
    }    
}

async function createBooking(req, res) {
    const { startDate, endDate, equipmentId } = req.body;
    let equipmentData = null;

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

    try {
        const inventoryResponse = await axios.post('http://localhost:3001/graphql', {
            query: `
            query Item {
                item(id: $id) {
                    id
                    name
                    pricePerDay
                }
            }`,
            variables: { id: equipmentId }
        });

        console.log(inventoryResponse);
        
        if (!inventoryResponse.data.data.equipment) {
            logger.warn(`Equipment with ID: ${equipmentId} not found in Inventory Service.`);
            return res.status(404).json({ error: "Equipment not found." });
        }

        equipmentData = inventoryResponse.data.data.equipment;

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

    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalPrice = totalDays * equipmentData.pricePerDay;

    try {
        logger.info("Creating new booking record in the database.");
        const newBooking = await prisma.bookings.create({
            data: {
                userId: parseInt(req.user.sub),
                startDate: start,
                endDate: end,
                equipmentId,
                totalPrice: totalPrice
            }
        });
        logger.info(`Booking created successfully with ID: ${newBooking.id}`);

        const internalToken = generateBookingToken({ 
            ...newBooking,
            role: "internal" 
        });

        // payments service call could be added here

        res.status(201).json(newBooking); // mudar


    } catch (error) {
        logger.error(`Error creating booking: ${error.message}`);
        res.status(500).json({ error: "Failed to create booking." });
    }
};

async function getAllBookings(req, res) {
    logger.info("getAllBookings called");
    logger.info(`Query parameters received: ${JSON.stringify(req.query)}`);
    const { page, limit, offset } = req.pagination;

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

async function deleteBooking(req, res) {
    const bookingId = req.params.id;
    try {
        logger.info(`Attempting to delete booking with ID: ${bookingId}`);
        const booking = await prisma.bookings.findUnique({
            where: { id: bookingId }
        });
        if (!booking) {
            logger.warn(`Booking with ID: ${bookingId} not found.`);
            return res.status(404).json({ error: "Booking not found." });
        }
        if (booking.status !== "cancelled"){
            logger.warn(`Booking with ID: ${bookingId} cannot be deleted as its status is not 'cancelled'.`);
            return res.status(400).json({ error: "Only cancelled bookings can be deleted." });
        }
        await prisma.bookings.delete({
            where: { id: bookingId }
        });
        logger.info(`Booking with ID: ${bookingId} deleted successfully.`);
        res.json({ message: "Booking deleted successfully." });
    } catch (error) {
        logger.error(`Error deleting booking with ID: ${bookingId} - ${error.message}`);
        res.status(500).json({ error: "Failed to delete booking." });
    }
}

async function getBookingsByUserId(req, res) {
    logger.info("getBookingsByUserId called");
    const { page, limit, offset } = req.pagination;
    const userId = parseInt(req.params.userId);

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
    try {
        logger.info(`Retrieving bookings for userId: ${userId}, page: ${page}, limit: ${limit}`);
        const total = await prisma.bookings.count({
            where: { 
                userId: userId, 
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
        const bookings = await prisma.bookings.findMany({
            skip: offset,
            take: limit,
            where: {
                startDate: { gte: startDate },
                endDate: { lte: endDate },
                ...filters
            },
        });
        logger.info(`Retrieved ${bookings.length} bookings for userId: ${userId}.`);
        return res.json({
            page,
            limit,
            total,
            totalPages,
            data: bookings
        });
    } catch (error) {
        logger.error(`Error retrieving bookings for userId: ${userId} - ${error.message}`);
        res.status(500).json({ error: "Failed to retrieve bookings." });
    }
}

async function getBookingsByEquipmentId(req, res) {
    const { page, limit, offset } = req.pagination;

    logger.info("getBookingsByEquipmentId called");
    const equipmentId = parseInt(req.params.equipmentId);

    /**
     *  Check if the equipment exists by calling the Inventory Service 
     */

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

    try {
        logger.info(`Retrieving bookings for equipmentId: ${equipmentId}, page: ${page}, limit: ${limit}`);
        const total = await prisma.bookings.count({
            where: { 
                equipmentId: equipmentId, 
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
        logger.info(`Retrieving bookings for equipmentId: ${equipmentId}`);
        const bookings = await prisma.bookings.findMany({
            skip: offset,
            take: limit,
            where: { 
                equipmentId: equipmentId,
                startDate: { gte: startDate },
                endDate: { lte: endDate },
                ...filters
            }
        });
        logger.info(`Retrieved ${bookings.length} bookings for equipmentId: ${equipmentId}.`);
        res.json({
            page,
            limit,
            total,
            totalPages,
            data: bookings
        });
    }
    catch (error) {
        logger.error(`Error retrieving bookings for equipmentId: ${equipmentId} - ${error.message}`);
        res.status(500).json({ error: "Failed to retrieve bookings." });
    }
}

module.exports = { 
    deleteBooking,
    updateBookingStatus, 
    createBooking, 
    getAllBookings, 
    getBookingById, 
    getBookingsByUserId,
    getBookingsByEquipmentId,
    checkAvailability
    };