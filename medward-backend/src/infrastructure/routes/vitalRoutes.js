const express = require('express');
const VitalSignController = require('../../controllers/VitalSignController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// [Pacient] Ruta pe care aplicatia moiblă a pacientului o accesează pentru a uploada date din Health Connect
// Middleware-ul garantează că token-ul e valid, și user-ul are rol de 'patient'
router.post('/', requireAuth, requireRole('patient'), VitalSignController.saveVitals);

// [Warden/Doctor] Ruta pe care aplicatia de control o accesează pentru a trage datele de pe backend
// Momentan blocăm ruta astfel încât doar un user 'warden' să aibă voie. (Se poate adăuga validare extra pt perminsiuni între doctor-pacient).
router.get('/:patientId', requireAuth, requireRole('warden'), VitalSignController.getPatientVitals);

module.exports = router;