
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


module.exports = { testeUserToken, updateBookingStatus, createBooking };