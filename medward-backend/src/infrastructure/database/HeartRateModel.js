const mongoose = require('mongoose');

const heartRateSchema = new mongoose.Schema({
    bpm: {
        type: Number,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    source: {
        type: String,
        default: 'Fitbit Versa 4 / Health Connect'
    }
}, { timestamps: true });

// Opțional: Pentru eficiență adăugăm un index pe startTime ca să nu salvăm duplicate sau să le căutăm rapid
heartRateSchema.index({ startTime: 1 }, { unique: true });

const HeartRateModel = mongoose.model('HeartRate', heartRateSchema);

module.exports = HeartRateModel;