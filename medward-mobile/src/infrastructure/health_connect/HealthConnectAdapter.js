import { initialize, requestPermission, readRecords } from 'react-native-health-connect';
import HealthDataRepository from '../../domain/repositories/HealthDataRepository';

class HealthConnectAdapter extends HealthDataRepository {
    async initialize() {
        return await initialize();
    }

    async requestPermissions() {
        return await requestPermission([
            { recordType: 'HeartRate', accessType: 'read' }
        ]);
    }

    async getHeartRateRecords(startTime, endTime) {
        const result = await readRecords('HeartRate', {
            timeRangeFilter: {
                operator: 'after',
                startTime: startTime,
                endTime: endTime
            }
        });

        // Extragem formatele specifice API-ului curent de Health Connect
        return result.records || result || [];
    }
}

export default HealthConnectAdapter;