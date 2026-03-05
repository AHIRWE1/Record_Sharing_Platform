const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

function authenticateToken(req, res, next) {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];
	if (!token) return res.status(401).json({ message: 'Missing token' });

	jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
		if (err) return res.status(403).json({ message: 'Invalid token' });
		req.user = user;
		next();
	});
}

function authorizeRoles(...allowedRoles) {
	return (req, res, next) => {
		const role = req.user && req.user.role;
		if (!role || !allowedRoles.includes(role)) {
			return res.status(403).json({ message: 'Forbidden: insufficient role' });
		}
		next();
	};
}

module.exports = {
	authenticateToken,
	authorizeRoles,
};
