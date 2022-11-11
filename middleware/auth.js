const jwt = require('jsonwebtoken');

function auth (req, res, next) {
	if (!req.headers) {
		return res.status(401).send({ error: 'Missing headers' })
	}

	if (!req.headers.authorization || req.headers.authorization === 'null') {
		return res.status(401).send({ error: 'No authorization token present' })
	}

	try {
		// Verify token
		const decoded = jwt.verify(req.headers.authorization, 'shh')

		if (req.headers.address !== decoded.address) {
			return res.status(401).send({ error: 'Address mismatch' })
		}


	} catch (error) {
		return res.status(500).send({ error })
	}

	next();
}

module.exports = auth;