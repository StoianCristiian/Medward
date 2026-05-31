const express = require('express');
const HeartRateController = require('../../controllers/HeartRateController');
const SaveHeartRateRecords = require('../../use_cases/SaveHeartRateRecords');
const MongoHeartRateRepository = require('../database/MongoHeartRateRepository');

const router = express.Router();

// Instanțiem dependențele (Dependency Injection manual)
const repository = new MongoHeartRateRepository();
const useCase = new SaveHeartRateRecords(repository);
const controller = new HeartRateController(useCase);

// Rute
router.post('/heart-rate', (req, res) => controller.syncData(req, res));

module.exports = router;