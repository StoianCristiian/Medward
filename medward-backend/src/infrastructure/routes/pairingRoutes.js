const express = require('express');
const PairingController = require('../../controllers/PairingController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Pacientul cere un cod
router.post('/generate', requireAuth, requireRole('patient'), PairingController.generatePairingCode);

// Warden-ul folosește codul
router.post('/link', requireAuth, requireRole('warden'), PairingController.linkPatient);

// Warden-ul cere lista cu userii la care are acces
router.get('/my-patients', requireAuth, requireRole('warden'), PairingController.getMonitoredPatients);

module.exports = router;