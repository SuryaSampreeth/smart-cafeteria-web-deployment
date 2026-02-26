/*
 * This middleware checks whether the logged-in user
 * has permission to access a specific route.
 * Allowed roles (like admin or staff) are passed as arguments.
 */
const checkRole = (...roles) => {
    return (req, res, next) => {
        // First, ensure the user is logged in (req.user must exist)
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Check if the user's role is in the list of allowed roles
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }

        // If role is valid, continue to next middleware or controller
        next();
    };
};

module.exports = { checkRole };
