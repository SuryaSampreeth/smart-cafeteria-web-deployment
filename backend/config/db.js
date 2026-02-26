const mongoose = require('mongoose');

/**
 * connect to MongoDB Database(ATLAS CLUSTER created with the project name smart-cafeteria-management)
 * 
 * establishes a connection to the MongoDB database using the URI
 * provided in the .env file.
 * 
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    // log success message to the console if the connection is successful
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // if connection fails, the error message is displayed to the console
    console.error(`Error: ${error.message}`);

    // exit the process
    process.exit(1);
  }
};

module.exports = connectDB;
