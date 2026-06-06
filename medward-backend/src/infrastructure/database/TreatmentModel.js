const mongoose = require('mongoose');

const complianceSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    status: { type: String, enum: ['taken', 'missed', 'pending'], default: 'pending' },
    takenAt: { type: Date }
}, { _id: false });

const treatmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    wardenId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    medicationName: {
        type: String,
        required: true
    },
    dosage: {
        type: String, // ex: "500"
    },
    unit: {
        type: String, // ex: "mg"
    },
    frequency: {
        type: String, // ex: "Zilnic, ora 20:00" sau "La nevoie"
        required: true
    },
    stock: {
        type: Number,
        default: 0
    },
    compliance: [complianceSchema]
}, { timestamps: true });

const TreatmentModel = mongoose.model('Treatment', treatmentSchema);
module.exports = TreatmentModel;