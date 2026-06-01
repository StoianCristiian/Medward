const UserModel = require('../infrastructure/database/UserModel');
const crypto = require('crypto');

class PairingController {
    // [Pacient] Generează un cod din 6 cifre
    async generatePairingCode(req, res) {
        try {
            const patient = req.user;
            
            // Generăm un cod de 6 cifre
            const code = crypto.randomInt(100000, 999999).toString();
            
            // Setăm codul să expire în 15 minute
            const expires = new Date();
            expires.setMinutes(expires.getMinutes() + 15);

            patient.pairingCode = code;
            patient.pairingCodeExpires = expires;
            await patient.save();

            res.status(200).json({ 
                success: true, 
                code, 
                expiresIn: '15 minute' 
            });
        } catch (error) {
            console.error('❌ Eroare generatePairingCode:', error);
            res.status(500).json({ success: false, message: 'Eroare internă a serverului' });
        }
    }

    // [Warden] Introduce codul și creează legătura
    async linkPatient(req, res) {
        try {
            const warden = req.user;
            const { code } = req.body;

            if (!code) {
                return res.status(400).json({ success: false, message: 'Codul de asociere este obligatoriu.' });
            }

            // Căutăm un pacient cu acest cod care să nu fi expirat
            const patient = await UserModel.findOne({
                pairingCode: code,
                pairingCodeExpires: { $gt: new Date() }, // Codul trebuie să expire în viitor
                role: 'patient'
            });

            if (!patient) {
                return res.status(404).json({ success: false, message: 'Cod de asociere invalid sau expirat.' });
            }

            // Verificăm dacă nu e deja în listă
            const alreadyLinked = warden.monitoredPatients.some(id => id.toString() === patient._id.toString());
            
            if (!alreadyLinked) {
                warden.monitoredPatients.push(patient._id);
                await warden.save();
            }

            // Invalidează codul după utilizare pentru siguranță
            patient.pairingCode = undefined;
            patient.pairingCodeExpires = undefined;
            await patient.save();

            res.status(200).json({ 
                success: true, 
                message: 'Asociere realizată cu succes!',
                patient: { id: patient._id, name: patient.name, email: patient.email }
            });
        } catch (error) {
            console.error('❌ Eroare linkPatient:', error);
            res.status(500).json({ success: false, message: 'Eroare internă' });
        }
    }

    // [Warden] Ia toți pacienții la care are acces
    async getMonitoredPatients(req, res) {
        try {
            const warden = req.user;
            
            // Folosim populate pentru a trage datele conturilor legate
            await warden.populate('monitoredPatients', 'name email picture');

            res.status(200).json({ success: true, patients: warden.monitoredPatients });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Eroare la preluarea pacienților' });
        }
    }
}

module.exports = new PairingController();