const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookings.controller.js');
const { authenticateUserToken, authenticateBookingToken } = require("../middlewares/auth");

// Define your booking routes here

router.post('/', authenticateUserToken, bookingsController.createBooking);

//router.get('/', authenticateUserToken, bookingsController.getAllBookings);
//router.get('/:id', bookingsController.getBookingById);

router.put('/:id/status', authenticateBookingToken, bookingsController.updateBookingStatus);

//router.delete('/:id', bookingsController.deleteBooking);

//router.get('/user/:userId', bookingsController.getBookingsByUserId);
//router.get('/equipment/:equipmentId', bookingsController.getBookingsByEquipmentId);

//router.post('/check-availability', bookingsController.checkAvailability);
module.exports = router;