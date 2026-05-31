const HeartRateRepository = require('../../domain/repositories/HeartRateRepository');
const HeartRateModel = require('./HeartRateModel');

class MongoHeartRateRepository extends HeartRateRepository {
    async saveMany(records) {
        // Folosim unordered bulk insert pentru a ignora pur și simplu duplicatele
        // fără să oprim inserarea celorlalte înregistrări.
        try {
            await HeartRateModel.insertMany(records, { ordered: false });
        } catch (error) {
            // codul 11000 în MongoDB este "Duplicate Key Error". 
            // Ignorăm erorile de duplicare la nivel de lot, deoarece vrem doar să salvăm noutățile
            if (error.code !== 11000) {
                console.error('Mongo Insert Error', error);
            }
        }
    }

    async getRecent(limit = 10) {
        return HeartRateModel.find().sort({ startTime: -1 }).limit(limit);
    }
}

module.exports = MongoHeartRateRepository;