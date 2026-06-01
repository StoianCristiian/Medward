const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    picture: String,
    role: {
        type: String,
        enum: ['patient', 'warden'],
        default: 'patient' // Implicit orice cont nou e pacient, rolul de warden poate fi setat manual din DB sau printr-un alt flux
    },
    // ---- Câmpuri adăugate pentru Sincronizarea Warden-Patient ----
    pairingCode: String,            // Cod temporar generat de pacient (ex: "748392")
    pairingCodeExpires: Date,       // Când expiră codul
    monitoredPatients: [{           // Lista de pascienți pe care Warden-ul are voie să îi monitorizeze
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }]
}, { timestamps: true });

const UserModel = mongoose.model('User', userSchema);
module.exports = UserModel;