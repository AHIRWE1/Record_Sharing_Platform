const db = require('../config/db');

// Register a new patient
async function registerPatient(req, res) {
	const { name, date_of_birth, gender, national_id } = req.body;
	if (!name) return res.status(400).json({ message: 'Missing patient name' });
	try {
		const sql = `INSERT INTO patients (name, date_of_birth, gender, national_id, created_at) VALUES (?, ?, ?, ?, NOW())`;
		const [result] = await db.execute(sql, [name, date_of_birth || null, gender || null, national_id || null]);
		const insertedId = result.insertId;
		const [rows] = await db.execute('SELECT * FROM patients WHERE patient_id = ?', [insertedId]);
		res.status(201).json(rows[0]);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
}

// Return all patients (lightweight list)
async function getAllPatients(req, res) {
	try {
		const [rows] = await db.execute('SELECT patient_id, name, date_of_birth, gender, national_id FROM patients');
		res.json(rows);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
}

// Search patient by name (partial) or by patient_id
async function searchPatient(req, res) {
	try {
		const { q, patient_id } = req.query;
		if (patient_id) {
			const [rows] = await db.execute('SELECT * FROM patients WHERE patient_id = ?', [patient_id]);
			return res.json(rows);
		}
		if (q) {
			const like = `%${q}%`;
			const [rows] = await db.execute('SELECT patient_id, name, date_of_birth, gender, national_id FROM patients WHERE name LIKE ? LIMIT 100', [like]);
			return res.json(rows);
		}
		return res.status(400).json({ message: 'Provide query param `q` or `patient_id`' });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
}

async function getPatientById(req, res) {
	const { id } = req.params;
	try {
		const [rows] = await db.execute('SELECT * FROM patients WHERE patient_id = ?', [id]);
		const patient = rows && rows[0];
		if (!patient) return res.status(404).json({ message: 'Patient not found' });
		res.json(patient);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
}

module.exports = { registerPatient, getAllPatients, searchPatient, getPatientById };
