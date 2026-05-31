// Interfață pentru repository (în JS nu avem interfețe, dar definim un contract)
class HeartRateRepository {
    async saveMany(records) {
        throw new Error('Not implemented');
    }
    
    async getRecent(limit) {
        throw new Error('Not implemented');
    }
}

module.exports = HeartRateRepository;