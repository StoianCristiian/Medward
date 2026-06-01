// Interfață / Contract pentru ce așteptăm de la API-ul nostru Backend
class BackendRepository {
    async postVitals(vitals) {
        throw new Error('Not implemented');
    }
    
    async getPatientVitals(patientId) {
        throw new Error('Not implemented');
    }

    // Funcții pentru noul flux de Pairing (Patient-Warden)
    async generatePairingCode() {
        throw new Error('Not implemented');
    }

    async linkPatient(code) {
        throw new Error('Not implemented');
    }

    async getMonitoredPatients() {
        throw new Error('Not implemented');
    }
}

export default BackendRepository;