const db = require('../config/db');

async function auditLogger(action, userId, details) {
	try {
		const sql = `INSERT INTO audit_logs (action, user_id, details, timestamp) VALUES (?, ?, ?, NOW())`;
		await db.execute(sql, [action, userId || null, JSON.stringify(details || {})]);
	} catch (err) {
		console.error('Failed to write audit log', err);
	}
}

// express middleware example
function audit(action) {
	return async (req, res, next) => {
		// execute after response finishes
		res.on('finish', () => {
			const userId = req.user && req.user.id;
			auditLogger(action, userId, { path: req.path, method: req.method, status: res.statusCode });
		});
		next();
	};
}

module.exports = { auditLogger, audit };
