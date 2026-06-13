const mongoose = require('mongoose');

const vitalSignSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true, // ex: 'heart_rate', 'steps', 'blood_pressure'
        index: true
    },
    value: {
        type: Number,
        required: true
    },
    unit: {
        type: String,
        required: true // ex: 'bpm', 'count', 'mmHg'
    },
    timestamp: {
        type: Date,
        required: true
    },
    isMock: {
        type: Boolean,
        default: false
    }
}, { 
    // Optimizare MongoDB Time-Series (necesită MongoDB >= 5.0)
    timeseries: {
        timeField: 'timestamp',
        metaField: 'patientId',
        granularity: 'seconds' // adaptat pentru ritm cardiac / pași care pot veni frecvent
    }
});

const VitalSignModel = mongoose.model('VitalSign', vitalSignSchema);
module.exports = VitalSignModel;