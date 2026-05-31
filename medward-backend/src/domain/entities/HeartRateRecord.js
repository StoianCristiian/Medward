class HeartRateRecord {
    constructor({ bpm, startTime, source = 'Fitbit Versa 4 / Health Connect' }) {
        this.bpm = bpm;
        this.startTime = startTime ? new Date(startTime) : new Date();
        this.source = source;
    }
}

module.exports = HeartRateRecord;