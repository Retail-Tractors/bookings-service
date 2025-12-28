const swaggerAutoGen = require("swagger-autogen")();

const doc = {
  info: {
    version: "1.0.0",
    title: "Retail Tractors bookings-service API",
    description: "API documentation for the Retail Tractors bookings-service.",
  },
    host: "localhost:3001",
    basePath: "/",
  schemes: ["http"],
  consumes: ["application/json"],
    produces: ["application/json"],
    tags: [
    {
      name: "Bookings",
      description: "Endpoints related to bookings management",
    },
  ],
  definitions: {
    Booking: {
        id: 1,
        userId: 1,
        equipmentId: 1,
        startDate: "2024-07-01T10:00:00Z",
        endDate: "2024-07-05T10:00:00Z",
        status: "confirmed",    
        createdAt: "2024-06-20T12:00:00Z",
        updatedAt: "2024-06-21T12:00:00Z",
    },  
    NewBooking: {
        userId: 1,
        equipmentId: 1,
        startDate: "2024-07-01T10:00:00Z",
        endDate: "2024-07-05T10:00:00Z",
    },
    BookingStatusUpdate: {
        status: "confirmed",
    }
  },
};  

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./src/routes/users.routes.js"];

swaggerAutoGen(outputFile, endpointsFiles, doc);