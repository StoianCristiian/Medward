// Interfață / Contract pentru ce așteptăm de la API-ul nostru Backend
class BackendRepository {
    async sendHeartRateData(records) {
        throw new Error('Not implemented');
    }
}

export default BackendRepository;