
// Import the Pool class from the pg library to create a connection pool
const { Pool } = require("pg");

// Define the configuration for the database connection pool using environment variables
const config = {
    user: process.env.USER,       // Database username
    host: process.env.HOST,       // Database host (e.g., localhost)
    database: process.env.DATABASE, // Name of the database
    password: process.env.PASSWORD, // Database password
    port: process.env.DB_PORT,       // Database port (default is usually 5432)
}

// Create a new Pool instance with the specified configuration
// and export it for use in other parts of the application
module.exports = new Pool(config);