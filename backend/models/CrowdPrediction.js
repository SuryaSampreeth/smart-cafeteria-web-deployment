const mongoose = require('mongoose');

// Schema for detailed hourly crowd data
const hourlyDataSchema = new mongoose.Schema({
    // Specific hour of the day (0-23)
    hour: {
        type: Number,
        required: true,
    },
    // Average percentage of occupancy for this hour
    avgOccupancy: {
        type: Number,
        required: true,
    },
    // Predicted average wait time in minutes
    avgWaitTime: {
        type: Number,
        required: true,
    },
    // Expected crowd level
    crowdLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true,
    },
    // Number of data points that were used to calculate this average
    sampleCount: {
        type: Number,
        default: 0,
    },
}, { _id: false });

/*
 * This schema stores processed historical data used for crowd prediction.
 * It helps analyze crowd patterns based on date and time.
 */
const crowdPredictionSchema = new mongoose.Schema({
    // Slot template for which prediction data is stored
    slotTemplateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SlotTemplate',
        required: true,
        index: true,
    },
    // Date corresponding to this prediction record
    date: {
        type: Date,
        required: true,
        index: true,
    },
    // Day of the week (0 = Sunday, 7 = Saturday)
    dayOfWeek: {
        type: Number,
        required: true,
    },
    // Hour-wise crowd statistics for the day
    hourlyData: [hourlyDataSchema],
    // Hours when the crowd is expected to be highest
    peakHours: [{
        type: Number, // Hour of day (0-23)
    }],
    //Average occupancy for the entire day.
    averageOccupancy: {
        type: Number,
        required: true,
    },
    //Maximum crowd occupancy recorded for the day
    maxOccupancy: {
        type: Number,
        required: true,
    },
    // Total number of data samples collected for the day
    totalSamples: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// Indexes for fast querying by slot template, date, or day of week
crowdPredictionSchema.index({ slotTemplateId: 1, date: -1 });
crowdPredictionSchema.index({ date: -1 });
crowdPredictionSchema.index({ dayOfWeek: 1 });

// Cleanup: Automatically remove prediction data older than 1 year
crowdPredictionSchema.index({ date: 1 }, { expireAfterSeconds: 31536000 }); // 365 days

module.exports = mongoose.model('CrowdPrediction', crowdPredictionSchema);
