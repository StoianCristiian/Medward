class SyncHeartRateData {
    constructor(healthDataRepository, backendRepository) {
        this.healthDataRepository = healthDataRepository;
        this.backendRepository = backendRepository;
    }

    async execute(onLog) {
        try {
            onLog('Se verifică permisiunile...');
            await this.healthDataRepository.requestPermissions();
            
            onLog('Permisiuni acordate. Se citesc datele locale...');
            
            const endTime = new Date().toISOString();
            const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            const records = await this.healthDataRepository.getHeartRateRecords(startTime, endTime);

            onLog(`🔍 Am găsit ${records.length} înregistrări de puls pe telefon.`);

            if (records.length === 0) {
                return { success: true, message: 'Nu sunt date noi de sincronizat.' };
            }

            onLog('Se trimit datele către server...');
            const response = await this.backendRepository.sendHeartRateData(records);

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