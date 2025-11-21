
const { request } = require("express");
const { generateBookingToken } = require("../utils/token");
const prisma = require("../config/db"); // Import prisma instance


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

    if (!startDate || !endDate || !equipmentId) {
        return res.status(400).json({ error: "Missing required booking fields." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start) || isNaN(end) || start >= end) {
        return res.status(400).json({ error: "Invalid startDate or endDate." });
    }

    // fazer pedido ao inventory service para verificar se o equipamento existe
    /// chamar o equipamento
    ////
    /////

    try {
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
            return res.status(400).json({ error: "Equipment is not available for the selected dates." });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to create booking." });
    }    

    try {
        const newBooking = await prisma.bookings.create({
            data: {
                userId: req.user.id,
                startDate: start,
                endDate: end,
                equipmentId,
                totalPrice: 100.00 // Example fixed price
            }
        });
        res.status(201).json(newBooking); // mudar

        // fazer pedido ao payment service para processar o pagamento
    } catch (error) {
        res.status(500).json({ error: "Failed to create booking." });
    }
};

async function getAllBookings(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(0);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    let filters = {};
    if (req.query.status) {
        if (['pending', 'confirmed', 'cancelled', 'completed'].includes(req.query.status)) {
            filters.status = req.query.status;
        } else {
            return res.status(400).json({ error: "Invalid status filter." });
        }
    }

    if (isNaN(startDate) || isNaN(endDate) || startDate >= endDate) {
        return res.status(400).json({ error: "Invalid startDate or endDate." });
    }


    if (page < 1 || limit < 1) {
        return res.status(400).json({ error: "Invalid pagination parameters." });
    }
    if (limit > 100) {
        return res.status(400).json({ error: "Limit exceeds maximum of 100." });
    }
    try {
        const total = await prisma.bookings.count({
            where: {
                startDate: { gte: startDate },
                endDate: { lte: endDate },
                ...filters
            }
        });
        const totalPages = Math.ceil(total / limit);

        if (page > totalPages && totalPages !== 0) {
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

module.exports = { testeUserToken, updateBookingStatus, createBooking, getAllBookings };