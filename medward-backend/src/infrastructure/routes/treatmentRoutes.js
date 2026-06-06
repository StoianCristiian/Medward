const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const TreatmentController = require('../../controllers/TreatmentController');

// Rută pt adaugare tratament
router.post('/', requireAuth, TreatmentController.addTreatment);

// Rută pt a lua tratamentele unui pacient
router.get('/:patientId', requireAuth, TreatmentController.getTreatments);

module.exports = router;