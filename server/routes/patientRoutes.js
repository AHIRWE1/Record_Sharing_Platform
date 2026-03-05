const express = require('express');
const router = express.Router();
const { registerPatient, getAllPatients, searchPatient, getPatientById } = require('../controllers/patientController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { audit } = require('../middleware/auditLogger');

// POST /api/patients/register (staff or admin)
router.post('/register', authenticateToken, authorizeRoles('staff', 'admin', 'doctor'), audit('patient.register'), registerPatient);

// GET /api/patients (authorized users)
router.get('/', authenticateToken, authorizeRoles('staff', 'admin', 'doctor'), audit('patient.list'), getAllPatients);

// GET /api/patients/search?q=smith or ?patient_id=123
router.get('/search', authenticateToken, authorizeRoles('staff', 'admin', 'doctor'), audit('patient.search'), searchPatient);

// GET /api/patients/:id
router.get('/:id', authenticateToken, authorizeRoles('staff', 'admin', 'doctor'), audit('patient.view'), getPatientById);

module.exports = router;
