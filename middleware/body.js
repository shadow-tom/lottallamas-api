import pkg from 'bitcore-lib';
const { Address } = pkg;

/**
 * @module verifyWalletBodyParams
 * A filter to determine if wallet body params are present on the req object
 * 
 * @param {object} req The Express request object
 * @param {object} res The Express response object
 * @param {object} next The Express response object
 * @returns {object} Returns the res.status, indicating an error or calls next() if passes 
 */

export default function verifyWalletBodyParams(req, res, next) {
	if (!req.body || !req.body.address || !req.body.signature || !req.body.message) {
		return res.status(401).send({ error: 'Missing params' })
	}

	if (!Address.isValid(req.body.address)) {
		return res.status(401).send({ error: 'Invalid address'})
	}

	next()
}