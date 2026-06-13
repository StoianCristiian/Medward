class SyncVitalsData {
    constructor(healthDataRepository, backendRepository) {
        this.healthDataRepository = healthDataRepository;
        this.backendRepository = backendRepository;
    }

    async execute(onLog, isBackground = false) {
        try {
            if (!isBackground) {
                onLog('Se verifică permisiunile (Pacient)...');
                await this.healthDataRepository.requestPermissions();
                onLog('Permisiuni acordate. Se citesc datele locale...');
            } else {
                onLog('Sincronizare în fundal. Se presupune că permisiunile sunt gata...');
            }
            
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
            let vitals = allVitals.filter(v => v.value !== undefined && v.value !== null && v.value !== 0);

            // GĂSIRE MAXIMUM TIMESTAMP REAL
            // Verificăm dacă telefonul raportează REA date chiar complet "NOI" prin salvarea in AsyncStorage
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const lastLatestStr = await AsyncStorage.getItem('lastRealVitalsTimestamp');
            let lastLatestMs = lastLatestStr ? parseInt(lastLatestStr, 10) : 0;
            
            let isVitalsEmptyOrStale = false;
            
            if (vitals.length === 0) {
               isVitalsEmptyOrStale = true;
            } else {
               // Extragem the max timestamp din payloadul real
               const currentMaxMs = Math.max(...vitals.map(v => new Date(v.timestamp).getTime()));
               
               if (currentMaxMs <= lastLatestMs) {
                   // Datele sunt absolut la fel ca la minutul trecut (Health Connect n-a syncuit un update pe device)
                   isVitalsEmptyOrStale = true;
               } else {
                   // Avem date fresh
                   await AsyncStorage.setItem('lastRealVitalsTimestamp', currentMaxMs.toString());
               }
            }

            // Dacă HC nu ne dă nimic valabil SAU nimic fresh în acest ultim interval, generăm noi automat MOCK DATA.
            if (isVitalsEmptyOrStale) {
                console.log(`[Mobil-Log] Health Connect nu are date **NOI**. Se generează date MOCK...`);
                const currentTime = new Date().toISOString();
                
                vitals = [
                    { type: 'heart_rate', value: Math.floor(70 + Math.random() * 20), unit: 'bpm', timestamp: currentTime, isMock: true },
                    { type: 'respiratory_rate', value: Math.floor(14 + Math.random() * 6), unit: 'rpm', timestamp: currentTime, isMock: true },
                    { type: 'skin_temperature', value: parseFloat((36 + Math.random() * 1.5).toFixed(1)), unit: 'C', timestamp: currentTime, isMock: true }
                ];
                
                // Pentru a testa alertele sistemului de AI ocazional generam si niste spike-uri false dacă Math.random > 0.8
                if (Math.random() > 0.8) {
                    console.log(`[Mobil-Log] Generăm un spike critic MOCK (pentru AI) !`);
                    vitals[0].value = 120 + Math.floor(Math.random() * 20); // Puls alarmant
                }
            } else {
                console.log(`[Mobil-Log] Avem ${vitals.length} înregistrări REALE. Se trimit...`);
                // Dacă avem date reale de la HC le marcam clar cu isMock false
                vitals = vitals.map(v => ({ ...v, isMock: false }));
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