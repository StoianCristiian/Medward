class SyncVitalsData {
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

            // Extragem mai multe tipuri de date
            const hrRecords = await this.healthDataRepository.getRecords('HeartRate', startTime, endTime);
            const rmssdRecords = await this.healthDataRepository.getRecords('HeartRateVariabilityRmssd', startTime, endTime);
            const rrRecords = await this.healthDataRepository.getRecords('RespiratoryRate', startTime, endTime);
            const rhrRecords = await this.healthDataRepository.getRecords('RestingHeartRate', startTime, endTime);
            const tempRecords = await this.healthDataRepository.getRecords('BodyTemperature', startTime, endTime);

            const allVitals = [];

            // Helper formatare
            const pushSamples = (records, type, unit, valueField) => {
                records.forEach(record => {
                    const samples = record.samples || [record];
                    samples.forEach(sample => {
                        if (sample[valueField] !== undefined) {
                            allVitals.push({
                                type,
                                value: sample[valueField],
                                unit,
                                timestamp: sample.time || record.startTime || new Date().toISOString()
                            });
                        }
                    });
                });
            };

            onLog(`Extrase: Puls(${hrRecords.length}), HRV(${rmssdRecords.length}), Respiratie(${rrRecords.length}), RestHR(${rhrRecords.length}), Temp(${tempRecords.length})`);

            // Mapanți din Health Connect spre Endpoint-ul nostru generic "VitalSignModel"
            pushSamples(hrRecords, 'heart_rate', 'bpm', 'beatsPerMinute');
            pushSamples(rrRecords, 'respiratory_rate', 'rpm', 'rate');
            pushSamples(rhrRecords, 'resting_heart_rate', 'bpm', 'beatsPerMinute');
            
            // HRV în general e furnizat global pe interval sau via samples
            rmssdRecords.forEach(r => {
                allVitals.push({
                    type: 'hrv_rmssd',
                    value: r.heartRateVariabilityMillis || r.rmssd || 0, // Poate varia în funcție de payload struct
                    unit: 'ms',
                    timestamp: r.startTime || new Date().toISOString()
                });
            });

            tempRecords.forEach(r => {
                allVitals.push({
                    type: 'skin_temperature',
                    value: r.temperature?.inCelsius || r.temperature || 0,
                    unit: 'C',
                    timestamp: r.startTime || new Date().toISOString()
                });
            });

            // Ștergem invalide (care au 0 de la mapping failure pt HRV, Temp) // Ajustează logic dacă temp poate fi null
            const vitals = allVitals.filter(v => v.value !== undefined && v.value !== null && v.value !== 0);

            if (vitals.length === 0) {
                return { success: true, message: 'Nu sunt date noi valide de sincronizat.' };
            }

            onLog(`Trimitem ${vitals.length} măsurători unice spre server (format Time-Series)...`);
            const response = await this.backendRepository.postVitals(vitals);

            onLog(`Server: ${response.message}`);
            return { success: true, message: 'Sincronizare completă reușită!' };

        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            onLog(`Eroare: ${errorMessage}`);
            return { success: false, message: errorMessage };
        }
    }
}

export default SyncVitalsData;