import { initialize, requestPermission, readRecords } from 'react-native-health-connect';
import HealthDataRepository from '../../domain/repositories/HealthDataRepository';

class HealthConnectAdapter extends HealthDataRepository {
    async initialize() {
        return await initialize();
    }

    async requestPermissions() {
        return await requestPermission([
            { recordType: 'HeartRate', accessType: 'read' },
            { recordType: 'HeartRateVariabilityRmssd', accessType: 'read' },
            { recordType: 'RespiratoryRate', accessType: 'read' },
            { recordType: 'RestingHeartRate', accessType: 'read' },
            { recordType: 'BodyTemperature', accessType: 'read' }
        ]);
    }

    async getRecords(recordType, startTime, endTime) {
        try {
            const result = await readRecords(recordType, {
                timeRangeFilter: {
                    operator: 'after',
                    startTime: startTime,
                    endTime: endTime
                }
            });
            return result.records || result || [];
        } catch (error) {
            console.log(`Eroare la citirea ${recordType}:`, error.message);
            return [];
        }
    }
}

export default HealthConnectAdapter;