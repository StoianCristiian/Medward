import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackendRepository from '../../domain/repositories/BackendRepository';

// Preluăm IP-ul și PORT-ul din variabilele de mediu Expo (sau folosim valorile implicite)
const IP = process.env.EXPO_PUBLIC_BACKEND_IP;
const PORT = process.env.EXPO_PUBLIC_BACKEND_PORT;
const BASE_URL = `http://${IP}:${PORT}/api`;

class BackendApiAdapter extends BackendRepository {
    // Funcție privată utilitară care extrage și setează token-ul JWT (Bearer)
    async _getHeaders() {
        const token = await AsyncStorage.getItem('userToken');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    // Trimite Vitals spre server (Pacient)
    async postVitals(vitals) {
        const headers = await this._getHeaders();
        const response = await axios.post(`${BASE_URL}/vitals`, { vitals }, { headers });
        return response.data;
    }

    // Cere datele unui pacient de pe server (Warden)
    async getPatientVitals(patientId) {
        const headers = await this._getHeaders();
        const response = await axios.get(`${BASE_URL}/vitals/${patientId}`, { headers });
        return response.data;
    }

    // ============================================
    // Integrare flux asociere (Pairing Flow)
    // ============================================
    
    async generatePairingCode() {
        const headers = await this._getHeaders();
        const response = await axios.post(`${BASE_URL}/pairing/generate`, {}, { headers });
        return response.data;
    }

    async linkPatient(code) {
        const headers = await this._getHeaders();
        const response = await axios.post(`${BASE_URL}/pairing/link`, { code }, { headers });
        return response.data;
    }

    async getMonitoredPatients() {
        const headers = await this._getHeaders();
        const response = await axios.get(`${BASE_URL}/pairing/my-patients`, { headers });
        return response.data;
    }

    async setRole(role) {
        const headers = await this._getHeaders();
        const response = await axios.post(`${BASE_URL}/auth/set-role`, { role }, { headers });
        return response.data;
    }

    // ============================================
    // Integrare flux tratament
    // ============================================

    async addTreatment(patientId, formData) {
        const headers = await this._getHeaders();
        const response = await axios.post(`${BASE_URL}/treatments`, { ...formData, patientId }, { headers });
        return response.data;
    }

    async getTreatments(patientId) {
        const headers = await this._getHeaders();
        const response = await axios.get(`${BASE_URL}/treatments/${patientId}`, { headers });
        return response.data;
    }
}

export default BackendApiAdapter;