import jwt from 'jsonwebtoken';

/**
 * @module auth
 * Determines if the token on the request object is valid and sets the decoded
 * properties on the request object and calls next()
 * 
 * @param {object} req The Express request object
 * @param {object} res The Express response object
 * @param {object} next The Express response object
 * @returns {object} Returns the res.status, indicating an error or calls next() if passes 
 */

export default function auth (req, res, next) {
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

		req.assets = decoded.assets ? decoded.assets : [];
		req.address = decoded.address;

	} catch (error) {
		return res.status(500).send({ error })
	}

	next();
}
