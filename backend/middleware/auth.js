const jwt = require('jsonwebtoken');
const User = require('../models/User');

/*
 * This middleware is used to protect private routes.
 * It checks whether a valid JWT token is present in the request.
 * If valid, the logged-in user details are attached to req.user.
 */
const protect = async (req, res, next) => {
    let token;

    // Check if authorization header is present and starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify the token using the secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch user details using ID from token
            // Password is excluded for security
            req.user = await User.findById(decoded.id).select('-password');

            //if user does not exist
            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            // Continue to next middleware or controller
            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    // If no token is found in the header
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
