const TreatmentModel = require('../infrastructure/database/TreatmentModel');
const UserModel = require('../infrastructure/database/UserModel');

class TreatmentController {
    // [Warden] Adaugă un tratament nou
    async addTreatment(req, res) {
        try {
            const wardenId = req.user._id;
            const { patientId, medicationName, dosage, unit, frequency, stock } = req.body;

            // Verificăm dacă monitorizează acest pacient
            const isAuthorized = req.user.monitoredPatients.some(id => id.toString() === patientId);
            if (!isAuthorized) {
                return res.status(403).json({ success: false, message: 'Nu ai permisiunea de a adăuga tratamente acestui pacient.' });
            }

            const treatment = new TreatmentModel({
                patientId,
                wardenId,
                medicationName,
                dosage,
                unit,
                frequency,
                stock,
                compliance: [] // Se pot genera zilele in avans daca dorim, acum o lasam goala pt flexibilitate
            });

            await treatment.save();
            res.status(201).json({ success: true, treatment });
        } catch (error) {
            console.error('❌ Eroare addTreatment:', error);
            res.status(500).json({ success: false, message: 'Eroare internă a serverului' });
        }
    }

    // [Warden / Patient] Preia tratamentele unui pacient
    async getTreatments(req, res) {
        try {
            const { patientId } = req.params;
            
            // Dacă e pacient, poate cere doar pt el
            if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
                return res.status(403).json({ success: false, message: 'Acces interzis.' });
            }
            
            // Dacă e warden, verificăm dacă are pacientul in listă
            if (req.user.role === 'warden') {
                const isAuthorized = req.user.monitoredPatients.some(id => id.toString() === patientId);
                if (!isAuthorized) {
                    return res.status(403).json({ success: false, message: 'Acces interzis pe acest pacient.' });
                }
            }

            const treatments = await TreatmentModel.find({ patientId }).sort({ createdAt: -1 });
            res.status(200).json({ success: true, treatments });

        } catch (error) {
            console.error('❌ Eroare getTreatments:', error);
            res.status(500).json({ success: false, message: 'Eroare internă a serverului' });
        }
    }
}

module.exports = new TreatmentController();