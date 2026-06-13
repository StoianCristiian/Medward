const VitalSignModel = require('../infrastructure/database/VitalSignModel');
const AiAnalyzerService = require('../infrastructure/services/AiAnalyzerService');

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
                timestamp: new Date(v.timestamp),
                isMock: v.isMock || false
            }));

            // Optimizare: Extragem datele preexistente din baza de date folosind timestamps
            const incomingTimestamps = vitalsToSave.map(v => v.timestamp);
            const existingRecords = await VitalSignModel.find({
                patientId,
                timestamp: { $in: incomingTimestamps }
            }).select('timestamp type');

            // Creăm un format HashSet eficient pe combinația `timestamp_tip`
            const existingSet = new Set(
                existingRecords.map(r => `${r.timestamp.getTime()}_${r.type}`)
            );

            // Filtrăm duplicatele păstrând doar cele ce NU sunt în baza de date
            const newVitalsToSave = vitalsToSave.filter(v => 
                !existingSet.has(`${v.timestamp.getTime()}_${v.type}`)
            );

            // Inserare rapidă (bulk) în MongoDB doar a intrărilor cu adevărat noi
            if (newVitalsToSave.length > 0) {
                // Dacă avem date REALE (isMock == false) venite de la telefon, putem șterge datele fake anterioare din baza de date
                const hasRealData = newVitalsToSave.some(v => v.isMock === false);
                if (hasRealData) {
                    await VitalSignModel.deleteMany({ patientId, isMock: true });
                }

                await VitalSignModel.insertMany(newVitalsToSave);
                console.log(`[Backend] Pacient ${patientId}: Inserate ${newVitalsToSave.length} înregistrări (Duplicate evitate: ${vitalsToSave.length - newVitalsToSave.length}).`);
                
                // Chemăm modelul de AI în background (asincron) să verifice noile semne
                AiAnalyzerService.analyzeAndNotify(patientId, newVitalsToSave).catch(e => console.error(e));

                res.status(201).json({ success: true, message: `Acum am adăugat ${newVitalsToSave.length} din ${vitals.length} date trimise (s-au exclus duplicatele).` });
            } else {
                console.log(`[Backend] Pacient ${patientId}: Toate cele ${vitals.length} au fost refuzate deoarece erau deja in sistem (0 noi).`);
                res.status(200).json({ success: true, message: `Toate cele ${vitals.length} înregistrări erau deja sincronizate.` });
            }
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