const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/*
 * This Schema manages user accounts for students, staff, and admins.
 * It handles secure password storage and authentication.
 */
const userSchema = new mongoose.Schema({
    //Name of the user
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
    },
    // Email address (used for login and notifications)
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    // password of the user
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false,
    },
    // User roles
    role: {
        type: String,
        enum: ['student', 'staff', 'admin'],
        default: 'student',
    },
    // Unique ID for students (optional for staff/admins)
    registrationNumber: {
        type: String,
        sparse: true,
    },
    // Account creation date
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

//Hash the password before saving the user records
userSchema.pre('save', async function (next) {
    // Only hash if the password has been modified
    if (!this.isModified('password')) {
        return next();
    }
    // Generate salt and hash the password using the bcryptjs library
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

//Compare entered password with the password stored in the database
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
