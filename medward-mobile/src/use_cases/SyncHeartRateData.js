class SyncHeartRateData {
    constructor(healthDataRepository, backendRepository) {
        this.healthDataRepository = healthDataRepository;
        this.backendRepository = backendRepository;
    }

    async execute(onLog) {
        try {
            onLog('Se verifică permisiunile (Pacient)...');
            await this.healthDataRepository.requestPermissions();
            
            onLog('Permisiuni acordate. Se citesc datele locale...');
            
            const endTime = new Date().toISOString();
            const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            const records = await this.healthDataRepository.getHeartRateRecords(startTime, endTime);

            onLog(`🔍 Am găsit ${records.length} de seturi-rădăcină (puls) pe telefon.`);

            if (records.length === 0) {
                return { success: true, message: 'Nu sunt date noi de sincronizat.' };
            }

            // Normalizăm datele pentru a corespunde modelului generic Time-Series de pe Backend (VitalSign)
            const vitals = [];
            records.forEach(record => {
                // Structura poate veni cu samples sau direct cu atribute în funcție de payload-ul sistemului Android
                const samples = record.samples || [record];
                
                samples.forEach(sample => {
                    if (sample.beatsPerMinute) {
                        vitals.push({
                            type: 'heart_rate',
                            value: sample.beatsPerMinute,
                            unit: 'bpm',
                            timestamp: sample.time || record.startTime || new Date().toISOString()
                        });
                    }
                });
            });

            if (vitals.length === 0) {
                return { success: true, message: 'Nicio înregistrare validă găsită în formatul așteptat.' };
            }

            onLog(`Trimitem ${vitals.length} măsurători unice spre server (format Time-Series)...`);
            const response = await this.backendRepository.postVitals(vitals);

            onLog(`Server: ${response.message}`);
            return { success: true, message: 'Sincronizare reușită!' };

        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            onLog(`Eroare: ${errorMessage}`);
            return { success: false, message: errorMessage };
        }
    }
}

export default SyncHeartRateData;