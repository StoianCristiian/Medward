const VitalSignModel = require('../infrastructure/database/VitalSignModel');

class VitalSignController {
    // [Pacient] Primește și salvează date de la telefon
    async saveVitals(req, res) {
        try {
            const patientId = req.user._id; // Preluat sigur din token (middleware)
            const { vitals } = req.body;    // Ne aşteptăm la un array de înregistrări

            if (!vitals || !Array.isArray(vitals)) {
                return res.status(400).json({ success: false, message: 'Format date invalid. "vitals" trebuie să fie un array.' });
            }

            // Mapăm datele pentru a adăuga referința pacientului și a asigura converisa corectă
            const vitalsToSave = vitals.map(v => ({
                patientId,
                type: v.type,
                value: v.value,
                unit: v.unit,
                timestamp: new Date(v.timestamp)
            }));

            // Inserare rapidă (bulk) în MongoDB
            await VitalSignModel.insertMany(vitalsToSave);

            res.status(201).json({ success: true, message: 'Date medicale salvate cu succes' });
        } catch (error) {
            console.error('❌ Eroare saveVitals:', error);
            res.status(500).json({ success: false, message: 'Eroare internă a serverului' });
        }
    }

    // [Warden] Prelucrează datele unui anumit pacient
    async getPatientVitals(req, res) {
        try {
            const { patientId } = req.params;
            const warden = req.user;

            // Securitate: Verificăm dacă Warden-ul are dreptul să vadă acest pacient
            const isAuthorized = warden.monitoredPatients.some(id => id.toString() === patientId);
            if (!isAuthorized) {
                return res.status(403).json({ success: false, message: 'Nu ai permisiunea să accesezi fișa acestui pacient.' });
            }

            // Preluăm cele mai noi înregistrări din BD (ordonate descrescător după timp)
            const vitals = await VitalSignModel.find({ patientId })
                .sort({ timestamp: -1 })
                .limit(500); // Mărja recomandată pt un singur fetch

            res.status(200).json({ success: true, data: vitals });
        } catch (error) {
            console.error('❌ Eroare getPatientVitals:', error);
            res.status(500).json({ success: false, message: 'Eroare internă a serverului' });
        }
    }
}

module.exports = new VitalSignController();