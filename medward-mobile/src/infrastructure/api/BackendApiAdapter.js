import axios from 'axios';
import BackendRepository from '../../domain/repositories/BackendRepository';

// Preluăm IP-ul și PORT-ul din variabilele de mediu Expo (sau folosim valorile implicite)
const IP = process.env.EXPO_PUBLIC_BACKEND_IP;
const PORT = process.env.EXPO_PUBLIC_BACKEND_PORT;
const BACKEND_URL = `http://${IP}:${PORT}/api/vitals/heart-rate`;

class BackendApiAdapter extends BackendRepository {
    async sendHeartRateData(records) {
        const response = await axios.post(BACKEND_URL, { records });
        return response.data;
    }
}

export default BackendApiAdapter;