require('dotenv').config();
const mongoose = require('mongoose');

/*
 * Simple utility script to verify MongoDB connectivity.
 * Useful for debugging connection issues in different environments.
 */

const uri = process.env.MONGODB_URI;

console.log('Attempting to connect to MongoDB Atlas...');
console.log(`URI: ${uri.replace(/:([^:@]+)@/, ':****@')}`); // Mask password

mongoose.connect(uri)
    .then(() => {
        console.log('Connection SUCCESSFUL!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Connection FAILED');
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        if (err.reason) console.error('Reason:', err.reason);
        console.log('\nTroubleshooting Tips:');
        console.log('1. Check "Network Access" in MongoDB Atlas. Your current IP must be allowed.');
        console.log('2. If you see "We are deploying your changes" in Atlas, WAIT for it to finish.');
        console.log('3. If on a university/corporate network, port 27017 might be blocked. Try using a mobile hotspot.');
        process.exit(1);
    });
