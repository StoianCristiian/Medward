class HeartRateController {
    constructor(saveHeartRateRecordsUseCase) {
        this.saveHeartRateRecordsUseCase = saveHeartRateRecordsUseCase;
    }

    async syncData(req, res) {
        try {
            const { records } = req.body;
            
            const result = await this.saveHeartRateRecordsUseCase.execute(records);

            console.log(`\n======================================================`);
            console.log(`✅ ${result.savedCount} înregistrări noi de puls salvate cu succes în MongoDB!`);
            console.log(`======================================================\n`);

            res.status(200).json({ 
                success: true, 
                message: result.message,
                savedCount: result.savedCount
            });
        } catch (error) {
            console.error('❌ Eroare Controller:', error.message);
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = HeartRateController;