// Interfață / Contract pentru ce așteptăm de la Health Connect
class HealthDataRepository {
    async initialize() {
        throw new Error('Not implemented');
    }

    async requestPermissions() {
        throw new Error('Not implemented');
    }

    async getHeartRateRecords(startTime, endTime) {
        throw new Error('Not implemented');
    }
}

export default HealthDataRepository;