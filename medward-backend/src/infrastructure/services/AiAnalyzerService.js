const { GoogleGenerativeAI } = require('@google/generative-ai');
const UserModel = require('../database/UserModel');

// Inițializare servicii
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class AiAnalyzerService {
    async analyzeAndNotify(patientId, newVitals) {
        try {
            // Extragem pacientul
            const patient = await UserModel.findById(patientId);
            if (!patient) return;

            // Preia cele mai noi date (ultimele 20 inregistrari pentru a limita token-urile)
            // Sortam descrescator dupa timp ca sa luam fix ce e mai nou
            const recentVitals = newVitals
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 20);

            if (recentVitals.length === 0) return;

            // Pregătim datele pentru prompt
            const vitalsSummary = recentVitals.map(v => `${v.type}: ${v.value} ${v.unit} la ${v.timestamp.toISOString()}`).join('\n');
            const prompt = `Analizează următoarele date vitale recente ale pacientului ${patient.name}. Există vreo anomalie clinică vizibilă care ar necesita atenția medicului? Dacă totul e normal sau sunt abateri mici, răspunde doar cu "OK". Dacă e ceva critic (ex: puls foarte ridicat, oxigen scăzut, tensiune mare), răspunde scurt, în limba română, sub forma unui mesaj de alertă pe care medicul l-ar primi pe telefon (ex: "Alertă: Pacientul Andrei are un puls ridicat de 115 bpm."). Nicio altă explicație suplimentară.\n\nDate vitale:\n${vitalsSummary}`;

            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent(prompt);
            const responseText = result.response.text().trim();

            if (responseText && responseText.toUpperCase() !== "OK") {
                console.log(`[AI Alert] Anomalie detectată pentru ${patient.name}:`, responseText);

                // Găsim toți Warden-ii (medicii) care monitorizează acest pacient
                const wardens = await UserModel.find({ monitoredPatients: patientId, expoPushToken: { $exists: true, $ne: null } });
                console.log(`[AI Alert] Au fost găsiți ${wardens.length} medici (warden) care au Push Token activ.`);
                
                const messages = [];
                for (let warden of wardens) {
                    if (warden.expoPushToken && warden.expoPushToken.includes('PushToken')) {
                        messages.push({
                            to: warden.expoPushToken,
                            sound: 'default',
                            title: `Alertă Medicală - ${patient.name}`,
                            body: responseText,
                            data: { patientId: patient._id },
                        });
                    }
                }

                if (messages.length > 0) {
                    try {
                        const response = await fetch('https://exp.host/--/api/v2/push/send', {
                            method: 'POST',
                            headers: {
                                'Accept': 'application/json',
                                'Accept-encoding': 'gzip, deflate',
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(messages),
                        });
                        const responseBody = await response.json();
                        console.log(`[AI Alert] Notificări trimise! Status: ${response.status}`, JSON.stringify(responseBody));
                    } catch (error) {
                        console.error('Eroare la trimiterea notificărilor Push Expo:', error);
                    }
                }
            } else {
                console.log(`[AI Check] Totul OK pentru ${patient.name}`);
            }

        } catch (error) {
            console.error('❌ Eroare AiAnalyzerService:', error);
        }
    }
}

module.exports = new AiAnalyzerService();