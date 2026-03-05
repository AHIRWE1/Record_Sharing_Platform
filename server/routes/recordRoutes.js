const express = require('express');
const router = express.Router();
const { createRecord, updateRecord, getRecordsByPatient } = require('../controllers/recordController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { audit } = require('../middleware/auditLogger');

// POST /api/records (doctor/staff)
router.post('/', authenticateToken, authorizeRoles('doctor', 'staff', 'admin'), audit('record.create'), createRecord);

// PUT /api/records/:id (doctor/staff)
router.put('/:id', authenticateToken, authorizeRoles('doctor', 'staff', 'admin'), audit('record.update'), updateRecord);

// GET /api/records/patient/:patientId
router.get('/patient/:patientId', authenticateToken, authorizeRoles('doctor', 'staff', 'admin'), audit('record.list'), getRecordsByPatient);

module.exports = router;
