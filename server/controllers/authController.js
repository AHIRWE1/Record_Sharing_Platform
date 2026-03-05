const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { auditLogger } = require('../middleware/auditLogger');

dotenv.config();

async function login(req, res) {
	const { email, password } = req.body;
	if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

	try {
		const [rows] = await db.execute('SELECT id, email, password_hash, role FROM users WHERE email = ?', [email]);
		const user = rows && rows[0];
		if (!user) {
			await auditLogger('login_failed', null, { email: email, ip: req.ip });
			return res.status(401).json({ message: 'Invalid credentials' });
		}

		const ok = await bcrypt.compare(password, user.password_hash);
		if (!ok) {
			await auditLogger('login_failed', user.id, { email: email, ip: req.ip });
			return res.status(401).json({ message: 'Invalid credentials' });
		}

		const payload = { id: user.id, email: user.email, role: user.role };
		const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });

		// log successful login
		await auditLogger('login', user.id, { ip: req.ip });

		res.json({ token, user: payload });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
}

module.exports = { login };
