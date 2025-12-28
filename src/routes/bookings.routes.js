const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookings.controller.js');
const { authenticateUserToken, authenticateBookingToken } = require("../middlewares/auth");
const { ensureSameUser, ensureUserIsAdmin } = require("../middlewares/ensureSameUser");
const { paginationMiddleware } = require("../middlewares/pagination");

//booking routes

router.post('/', 
    /*
    #swagger.tags = ['Bookings']
    #swagger.description = 'Endpoint to create a new booking.'
    #swagger.parameters['NewBooking'] = {
        in: 'body',
        description: 'Booking information.',
        required: true,
        schema: { $ref: '#/definitions/NewBooking' }
    }
    #swagger.responses[201] = {
        description: 'Booking created successfully.',
        schema: { $ref: '#/definitions/Booking' }
    }
    #swagger.responses[400] = {
        description: 'Bad Request. Invalid input data.',
        schema: { error: "Error message detailing the issue." }
    }   
    #swagger.responses[401] = {
        description: 'Unauthorized. User token missing or invalid.',
        schema: { error: "User token missing." }
    }
    #swagger.responses[403] = {
        description: 'Forbidden. Invalid booking token.',
        schema: { error: "Invalid booking token." }
    }
    #swagger.responses[500] = {
        description: 'Internal Server Error.',
        schema: { error: "Internal Server Error" }
    }   
    */
    authenticateUserToken, bookingsController.createBooking);

router.get('/',
    /*
    #swagger.tags = ['Bookings']
    #swagger.description = 'Endpoint to retrieve all bookings with pagination.'
    #swagger.parameters['page'] = { 
        in: 'query',
        description: 'Page number for pagination.',
        required: false,
        type: 'integer',
        default: 1
    }
    #swagger.parameters['limit'] = { 
        in: 'query',            
        description: 'Number of items per page.',
        required: false,
        type: 'integer',
        default: 10
    }
    #swagger.responses[200] = { 
        description: 'A list of bookings.',
        schema: {
            type: 'array',
            items: { $ref: '#/definitions/Booking' }
        }
    }   
    #swagger.responses[401] = { 
        description: 'Unauthorized. User token missing or invalid.',
        schema: { error: "User token missing." }
    }
    #swagger.responses[403] = { 
        description: 'Forbidden. Invalid booking token.',   
        schema: { error: "Invalid booking token." }
    }
    #swagger.responses[500] = { 
        description: 'Internal Server Error.',
        schema: { error: "Internal Server Error" }
    }   
    */
    authenticateUserToken, paginationMiddleware, bookingsController.getAllBookings);

router.get('/:id',
    /*
    #swagger.tags = ['Bookings']
    #swagger.description = 'Endpoint to retrieve a booking by its ID.'
    #swagger.parameters['id'] = {   
        in: 'path',
        description: 'ID of the booking to retrieve.',
        required: true,
        type: 'integer'
    }
    #swagger.responses[200] = {
        description: 'Booking details retrieved successfully.',
        schema: { $ref: '#/definitions/Booking' }
    }
    #swagger.responses[401] = {
        description: 'Unauthorized. User token missing or invalid.',
        schema: { error: "User token missing." }
    }
    #swagger.responses[403] = {
        description: 'Forbidden. Invalid booking token.',
        schema: { error: "Invalid booking token." }
    }
    #swagger.responses[404] = { 
        description: 'Booking not found.',
        schema: { error: "Booking not found." }
    }   
    #swagger.responses[500] = { 
        description: 'Internal Server Error.',
        schema: { error: "Internal Server Error" }
    } 
    */
    authenticateUserToken, bookingsController.getBookingById);

router.put('/:id/status', 
    /*
    #swagger.tags = ['Bookings']
    #swagger.description = 'Endpoint to update the status of a booking.'
    #swagger.parameters['id'] = {
        in: 'path', 
        description: 'ID of the booking to update.',
        required: true,
        type: 'integer'
    }
    #swagger.parameters['BookingStatusUpdate'] = {  
        in: 'body',
        description: 'New status for the booking.',
        required: true,
        schema: { $ref: '#/definitions/BookingStatusUpdate' }
    }
    #swagger.responses[200] = {
        description: 'Booking status updated successfully.',    
        schema: { $ref: '#/definitions/Booking' }
    }
    #swagger.responses[400] = {
        description: 'Bad Request. Invalid status value.',
        schema: { error: "Invalid status value." }
    }
    #swagger.responses[401] = {
        description: 'Unauthorized. Booking token missing or invalid.',
        schema: { error: "Booking token missing." }
    }       
    #swagger.responses[403] = {
        description: 'Forbidden. Invalid booking token.',
        schema: { error: "Invalid booking token." }
    }
    #swagger.responses[404] = {
        description: 'Booking not found.',  
        schema: { error: "Booking not found." }
    }   
    #swagger.responses[500] = {
        description: 'Internal Server Error.',
        schema: { error: "Internal Server Error" }
    }
    */
    authenticateBookingToken, bookingsController.updateBookingStatus);

router.delete('/:id',
    /*
    #swagger.tags = ['Bookings']
    #swagger.description = 'Endpoint to delete a booking by its ID. Admin only.'
    #swagger.parameters['id'] = {   
        in: 'path',
        description: 'ID of the booking to delete.',
        required: true,
        type: 'integer'
    }
    #swagger.responses[200] = {     
        description: 'Booking deleted successfully.',
        schema: { message: "Booking deleted successfully." }
    }
    #swagger.responses[401] = {     
        description: 'Unauthorized. User token missing or invalid.',    
        schema: { error: "User token missing." }
    }
    #swagger.responses[403] = {
        description: 'Forbidden. User is not an admin.',
        schema: { error: "Admin privileges required." }
    }       
    #swagger.responses[404] = { 
        description: 'Booking not found.',
        schema: { error: "Booking not found." }
    }   
    #swagger.responses[500] = { 
        description: 'Internal Server Error.',
        schema: { error: "Internal Server Error" }
    }
    */
    authenticateUserToken, ensureUserIsAdmin, bookingsController.deleteBooking);

router.get('/user/:userId', 
    /*
    #swagger.tags = ['Bookings']
    #swagger.description = 'Endpoint to retrieve bookings for a specific user with pagination.'
    #swagger.parameters['userId'] = { 
        in: 'path', 
        description: 'ID of the user whose bookings are to be retrieved.',
        required: true,
        type: 'integer'
    }
    #swagger.parameters['page'] = { 
        in: 'query',
        description: 'Page number for pagination.', 
        required: false,
        type: 'integer',
        default: 1  
    }
    #swagger.parameters['limit'] = { 
        in: 'query',
        description: 'Number of items per page.',
        required: false,
        type: 'integer',
        default: 10
    }
    #swagger.responses[200] = { 
        description: 'A list of bookings for the specified user.',  
        schema: {
            type: 'array',
            items: { $ref: '#/definitions/Booking' }
        }
    }   
    #swagger.responses[401] = { 
        description: 'Unauthorized. User token missing or invalid.',    
        schema: { error: "User token missing." }
    }
    #swagger.responses[403] = { 
        description: 'Forbidden. User not authorized to access these bookings.',    
        schema: { error: "Access denied." }
    }
    #swagger.responses[500] = {
        description: 'Internal Server Error.',
        schema: { error: "Internal Server Error" }
    }
    */
    authenticateUserToken, ensureSameUser, paginationMiddleware, bookingsController.getBookingsByUserId);

router.get('/equipment/:equipmentId',
    /*
    #swagger.tags = ['Bookings']
    #swagger.description = 'Endpoint to retrieve bookings for a specific equipment with pagination.'
    #swagger.parameters['equipmentId'] = {
        in: 'path',
        description: 'ID of the equipment whose bookings are to be retrieved.',
        required: true, 
        type: 'integer'
    }
    #swagger.parameters['page'] = { 
        in: 'query',    
        description: 'Page number for pagination.',
        required: false,
        type: 'integer',
        default: 1
    }
    #swagger.parameters['limit'] = {
        in: 'query',
        description: 'Number of items per page.',
        required: false,    
        type: 'integer',
        default: 10
    }   
    #swagger.responses[200] = {
        description: 'A list of bookings for the specified equipment.',
        schema: {
            type: 'array',  
            items: { $ref: '#/definitions/Booking' }
        }
    }   
    #swagger.responses[401] = { 
        description: 'Unauthorized. User token missing or invalid.',    
        schema: { error: "User token missing." }
    }   
    #swagger.responses[403] = { 
        description: 'Forbidden. User not authorized to access these bookings.',    
        schema: { error: "Access denied." }
    }
    #swagger.responses[500] = {
        description: 'Internal Server Error.',
        schema: { error: "Internal Server Error" }
    }
    */
    authenticateUserToken , paginationMiddleware,/* checks if the user is authorized to view bookings for this equipment */  bookingsController.getBookingsByEquipmentId);

router.get('/check-availability',
    /*
    #swagger.tags = ['Bookings']
    #swagger.description = 'Endpoint to check equipment availability for given dates.'
    #swagger.parameters['equipmentId'] = {
        in: 'query',
        description: 'ID of the equipment to check availability for.',
        required: true,
        type: 'integer'
    }
    #swagger.parameters['startDate'] = {    
        in: 'query',
        description: 'Start date of the desired booking period (ISO 8601 format).',
        required: true,
        type: 'string',
        format: 'date-time'
    }   
    #swagger.parameters['endDate'] = {
        in: 'query',
        description: 'End date of the desired booking period (ISO 8601 format).',
        required: true,
        type: 'string',
        format: 'date-time'
    }
    #swagger.responses[200] = {
        description: 'Availability status retrieved successfully.',
        schema: {
            type: 'object',
            properties: {
                available: { type: 'boolean' }
            }
        }   
    }
    #swagger.responses[400] = {
        description: 'Bad Request. Missing or invalid query parameters.',
        schema: { error: "Error message detailing the issue." }
    }   
    #swagger.responses[500] = {
        description: 'Internal Server Error.',
        schema: { error: "Internal Server Error" }
    }
    */
    bookingsController.checkAvailability);

module.exports = router;