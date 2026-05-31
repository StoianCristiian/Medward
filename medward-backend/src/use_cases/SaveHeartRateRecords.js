const HeartRateRecord = require('../domain/entities/HeartRateRecord');

class SaveHeartRateRecords {
    constructor(heartRateRepository) {
        this.heartRateRepository = heartRateRepository;
    }

    async execute(rawRecords) {
        if (!rawRecords || rawRecords.length === 0) {
            throw new Error('Nu s-au primit date.');
        }

        // Mapăm datele brute din Health Connect la entitatea noastră de domeniu
        const records = rawRecords.map(record => {
            const bpm = record.samples?.[0]?.beatsPerMinute || record.beatsPerMinute;
            return new HeartRateRecord({
                bpm: Math.round(bpm),
                startTime: record.startTime
            });
        }).filter(r => r.bpm); // Păstrăm doar cele valabile

        // Salvăm în baza de date prin repository-ul nostru (care ține de infrastructură, dar e injectat)
        await this.heartRateRepository.saveMany(records);

        return {
            savedCount: records.length,
            message: 'Datele au fost salvate cu succes!'
        };
    }
}

module.exports = SaveHeartRateRecords;