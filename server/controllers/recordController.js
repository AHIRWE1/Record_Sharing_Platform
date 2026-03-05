const db = require('../config/db');

// Create a new medical record attached to a patient
async function createMedicalRecord(req, res) {
	const { patient_id, diagnosis, treatment_plan, clinical_notes } = req.body;
	if (!patient_id) return res.status(400).json({ message: 'Missing patient_id' });
	try {
		const createdBy = req.user && req.user.id;
		const sql = `INSERT INTO medical_records (patient_id, diagnosis, treatment_plan, clinical_notes, created_at, created_by) VALUES (?, ?, ?, ?, NOW(), ?)`;
		const [result] = await db.execute(sql, [patient_id, diagnosis || null, treatment_plan || null, clinical_notes || null, createdBy || null]);
		const [rows] = await db.execute('SELECT * FROM medical_records WHERE record_id = ?', [result.insertId]);
		res.status(201).json(rows[0]);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
}

// Return all medical records for a patient
async function getPatientHistory(req, res) {
	const { patientId } = req.params;
	if (!patientId) return res.status(400).json({ message: 'Missing patientId' });
	try {
		const [rows] = await db.execute('SELECT * FROM medical_records WHERE patient_id = ? ORDER BY created_at DESC', [patientId]);
		res.json(rows);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
}

// Update a medical record (diagnosis, treatment_plan, clinical_notes)
async function updateMedicalRecord(req, res) {
	const { id } = req.params; // record_id
	const { diagnosis, treatment_plan, clinical_notes } = req.body;
	try {
		const [existing] = await db.execute('SELECT * FROM medical_records WHERE record_id = ?', [id]);
		if (!existing || existing.length === 0) return res.status(404).json({ message: 'Record not found' });
		await db.execute('UPDATE medical_records SET diagnosis = ?, treatment_plan = ?, clinical_notes = ?, updated_at = NOW() WHERE record_id = ?', [diagnosis || existing[0].diagnosis, treatment_plan || existing[0].treatment_plan, clinical_notes || existing[0].clinical_notes, id]);
		const [rows] = await db.execute('SELECT * FROM medical_records WHERE record_id = ?', [id]);
		res.json(rows[0]);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
}

// Append clinical notes to an existing medical record
async function addClinicalNotes(req, res) {
	const { id } = req.params; // record_id
	const { note } = req.body;
	if (!note) return res.status(400).json({ message: 'Missing note' });
	try {
		const [rows] = await db.execute('SELECT clinical_notes FROM medical_records WHERE record_id = ?', [id]);
		const existing = rows && rows[0] && rows[0].clinical_notes ? rows[0].clinical_notes : '';
		const timestamp = new Date().toISOString();
		const userInfo = req.user ? ` (user:${req.user.id})` : '';
		const appended = existing + `\n[${timestamp}]${userInfo} ${note}`;
		await db.execute('UPDATE medical_records SET clinical_notes = ?, updated_at = NOW() WHERE record_id = ?', [appended, id]);
		const [updated] = await db.execute('SELECT * FROM medical_records WHERE record_id = ?', [id]);
		res.json(updated[0]);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
}

// Backwards-compatible wrappers for earlier route names (if used elsewhere)
const createRecord = createMedicalRecord;
const updateRecord = updateMedicalRecord;
const getRecordsByPatient = getPatientHistory;

module.exports = { createMedicalRecord, getPatientHistory, updateMedicalRecord, addClinicalNotes, createRecord, updateRecord, getRecordsByPatient };
